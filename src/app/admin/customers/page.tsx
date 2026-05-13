"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pencil, Trash2, X, RefreshCw, Eye, EyeOff, Copy, Check, Info,
  Wallet, TrendingUp, TrendingDown, SlidersHorizontal, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface BalanceEntry {
  id: string;
  type: "ekle" | "cikar" | "ayarla";
  amount: number;
  previousBalance: number;
  newBalance: number;
  note: string;
  date: string;
}

interface Customer {
  id: string;
  ad: string;
  email: string;
  telefon?: string;
  sirket?: string;
  sehir: string;
  tcNo?: string;
  vergiNo?: string;
  vergiDairesi?: string;
  kaynak?: string;
  durum: "aktif" | "pasif";
  notlar?: string;
  balance?: number;
  balanceHistory?: BalanceEntry[];
  createdAt: string;
}

type FormData = Omit<Customer, "id" | "createdAt" | "balance" | "balanceHistory"> & { password?: string };

const EMPTY_FORM: FormData = {
  ad: "", email: "", telefon: "", sirket: "", sehir: "",
  tcNo: "", vergiNo: "", vergiDairesi: "",
  kaynak: "direkt", durum: "aktif", notlar: "", password: "",
};

const KAYNAKLAR = ["direkt", "instagram", "referans", "diger"];
const KAYNAK_LABEL: Record<string, string> = {
  direkt: "Direkt", instagram: "Instagram", referans: "Referans", diger: "Diğer",
};

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(n);
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="text-white/20 hover:text-white/50 transition-colors cursor-pointer">
        <Info size={12} />
      </button>
      {show && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 bg-[#222] border border-white/10 text-white/60 text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

function Field({ label, required, tooltip, children }: { label: string; required?: boolean; tooltip?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-1.5">
        {label}
        {required && <span className="text-red-400">*</span>}
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors";

// ─── Bakiye Dialog ────────────────────────────────────────────────────────────
function BalanceDialog({ customer, onClose, onUpdated }: {
  customer: Customer;
  onClose: () => void;
  onUpdated: (c: Customer) => void;
}) {
  const [tab, setTab] = useState<"islem" | "gecmis">("islem");
  const [type, setType] = useState<"ekle" | "cikar" | "ayarla">("ekle");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [invoiceType, setInvoiceType] = useState<"kurumsal" | "bireysel">("bireysel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) { setError("Geçerli bir miktar girin"); return; }
    setError("");
    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customers/${customer.id}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: parsed, note, invoiceType }),
      });
      let data: unknown;
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) {
        setError((data as { message?: string }).message || "Hata");
        setLoading(false);
        submittingRef.current = false;
        return;
      }
      // Başarılı — önce guard'ı sıfırla, sonra kapat
      setLoading(false);
      submittingRef.current = false;
      onUpdated(data as Customer);
      onClose();
    } catch (err) {
      console.error("balance error:", err);
      setError("Sunucuya bağlanılamadı");
      setLoading(false);
      submittingRef.current = false;
    }
  }

  const balance = customer.balance ?? 0;
  const history = customer.balanceHistory ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-[#161616] border border-white/[0.08] rounded-2xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white">Bakiye Yönetimi</h3>
            <p className="text-[10px] text-white/30 mt-0.5">{customer.ad}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={16} /></button>
        </div>

        {/* Mevcut bakiye */}
        <div className="px-5 py-4 bg-white/[0.02] border-b border-white/[0.06]">
          <p className="text-[10px] text-white/30 mb-1">Mevcut Bakiye</p>
          <p className={cn("text-2xl font-bold", balance > 0 ? "text-emerald-400" : balance < 0 ? "text-red-400" : "text-white/60")}>
            {formatCurrency(balance)}
          </p>
        </div>

        {/* Tab */}
        <div className="flex border-b border-white/[0.06]">
          {(["islem", "gecmis"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                tab === t ? "text-white border-b-2 border-white" : "text-white/30 hover:text-white/60"
              )}
            >
              {t === "islem" ? "İşlem Yap" : `Geçmiş (${history.length})`}
            </button>
          ))}
        </div>

        {tab === "islem" ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* İşlem tipi */}
            <div>
              <label className="text-xs font-medium text-white/40 mb-2 block">İşlem Tipi</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "ekle", label: "Ekle", icon: TrendingUp, color: "text-emerald-400" },
                  { value: "cikar", label: "Çıkar", icon: TrendingDown, color: "text-red-400" },
                  { value: "ayarla", label: "Ayarla", icon: SlidersHorizontal, color: "text-blue-400" },
                ] as const).map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                      type === value
                        ? "border-white/20 bg-white/[0.06] " + color
                        : "border-white/[0.06] text-white/30 hover:border-white/10 hover:text-white/50"
                    )}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fatura Tipi — sadece "ekle" işleminde */}
            {type === "ekle" && (
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block">Fatura Tipi</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "kurumsal", label: "Kurumsal", desc: "%20 KDV" },
                    { value: "bireysel", label: "Bireysel", desc: "%0 KDV" },
                  ] as const).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setInvoiceType(value)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        invoiceType === value
                          ? value === "kurumsal"
                            ? "border-blue-500/30 bg-blue-500/10"
                            : "border-white/20 bg-white/[0.06]"
                          : "border-white/[0.06] hover:border-white/10"
                      )}
                    >
                      <span className={cn("text-xs font-medium", invoiceType === value ? "text-white" : "text-white/30")}>{label}</span>
                      <span className={cn("text-[9px]", invoiceType === value ? (value === "kurumsal" ? "text-blue-400/70" : "text-white/40") : "text-white/20")}>{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Miktar */}
            <Field label="Miktar (₺)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </Field>

            {/* Not */}
            <Field label="Not (opsiyonel)">
              <input
                className={inputCls}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="İşlem açıklaması..."
              />
            </Field>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "İşleniyor..." : type === "ekle" ? "Bakiye Ekle" : type === "cikar" ? "Bakiye Çıkar" : "Bakiyeyi Ayarla"}
            </button>
          </form>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-white/20">
                <Wallet size={28} />
                <p className="text-xs">Henüz işlem yok</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {history.map((h) => (
                  <div key={h.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      h.type === "ekle" ? "bg-emerald-400/10" : h.type === "cikar" ? "bg-red-400/10" : "bg-blue-400/10"
                    )}>
                      {h.type === "ekle" ? <TrendingUp size={13} className="text-emerald-400" /> :
                        h.type === "cikar" ? <TrendingDown size={13} className="text-red-400" /> :
                          <SlidersHorizontal size={13} className="text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-medium", h.type === "ekle" ? "text-emerald-400" : h.type === "cikar" ? "text-red-400" : "text-blue-400")}>
                          {h.type === "ekle" ? "+" : h.type === "cikar" ? "-" : "="}{formatCurrency(h.amount)}
                        </span>
                        <span className="text-[10px] text-white/30">{formatDate(h.date)}</span>
                      </div>
                      {h.note && <p className="text-[10px] text-white/30 truncate mt-0.5">{h.note}</p>}
                      <p className="text-[10px] text-white/20 mt-0.5">
                        {formatCurrency(h.previousBalance)} → {formatCurrency(h.newBalance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function CustomerDrawer({ open, onClose, customer, onSaved }: {
  open: boolean; onClose: () => void;
  customer: Customer | null;
  onSaved: (c: Customer, tempPassword?: string) => void;
}) {
  const isEdit = !!customer;
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setShowPass(false);
      setForm(customer ? { ...EMPTY_FORM, ...customer, password: "" } : { ...EMPTY_FORM, password: generatePassword() });
    }
  }, [open, customer]);

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customers/${customer!.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customers`;
      const body: Record<string, unknown> = { ...form };
      if (isEdit && !form.password) delete body.password;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Hata oluştu"); return; }
      onSaved(data as Customer, isEdit ? undefined : data.tempPassword);
      onClose();
    } catch {
      setError("Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-[#111] border-l border-white/[0.06] flex flex-col"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white">{isEdit ? "Müşteriyi Düzenle" : "Yeni Müşteri"}</h2>
              <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Ad Soyad" required>
                    <input className={inputCls} value={form.ad} onChange={(e) => set("ad", e.target.value)} placeholder="Ahmet Yılmaz" required />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="E-posta" required>
                    <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ahmet@ornek.com" required />
                  </Field>
                </div>
                <Field label="Telefon">
                  <input className={inputCls} value={form.telefon} onChange={(e) => set("telefon", e.target.value)} placeholder="0532 000 00 00" />
                </Field>
                <Field label="Şehir" required>
                  <input className={inputCls} value={form.sehir} onChange={(e) => set("sehir", e.target.value)} placeholder="İstanbul" required />
                </Field>
                <div className="col-span-2">
                  <Field label="Şirket Adı">
                    <input className={inputCls} value={form.sirket} onChange={(e) => set("sirket", e.target.value)} placeholder="Örnek A.Ş." />
                  </Field>
                </div>
                <Field label="TC Kimlik No" tooltip="Bireysel fatura kesilirken kullanılır">
                  <input className={inputCls} value={form.tcNo} onChange={(e) => set("tcNo", e.target.value)} placeholder="11111111111" maxLength={11} />
                </Field>
                <Field label="Vergi No" tooltip="Kurumsal fatura için vergi numarası">
                  <input className={inputCls} value={form.vergiNo} onChange={(e) => set("vergiNo", e.target.value)} placeholder="1234567890" />
                </Field>
                <div className="col-span-2">
                  <Field label="Vergi Dairesi">
                    <input className={inputCls} value={form.vergiDairesi} onChange={(e) => set("vergiDairesi", e.target.value)} placeholder="Kadıköy VD" />
                  </Field>
                </div>
                <Field label="Kaynak">
                  <select className={inputCls} value={form.kaynak} onChange={(e) => set("kaynak", e.target.value)}>
                    {KAYNAKLAR.map((k) => <option key={k} value={k}>{KAYNAK_LABEL[k]}</option>)}
                  </select>
                </Field>
                <Field label="Durum">
                  <select className={inputCls} value={form.durum} onChange={(e) => set("durum", e.target.value as "aktif" | "pasif")}>
                    <option value="aktif">Aktif</option>
                    <option value="pasif">Pasif</option>
                  </select>
                </Field>
                <div className="col-span-2">
                  <Field label={isEdit ? "Yeni Şifre (boş bırakırsan değişmez)" : "Şifre"}>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        className={cn(inputCls, "pr-20")}
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        placeholder={isEdit ? "Değiştirmek için girin" : "Otomatik oluşturuldu"}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={() => set("password", generatePassword())} className="text-white/25 hover:text-white/60 transition-colors cursor-pointer p-1" title="Yeni şifre üret">
                          <RefreshCw size={13} />
                        </button>
                        <button type="button" onClick={() => setShowPass((v) => !v)} className="text-white/25 hover:text-white/60 transition-colors cursor-pointer p-1">
                          {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Notlar">
                    <textarea className={cn(inputCls, "resize-none h-20")} value={form.notlar} onChange={(e) => set("notlar", e.target.value)} placeholder="Admin notları..." />
                  </Field>
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><p className="text-xs text-red-400">{error}</p></div>}
            </form>

            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-colors cursor-pointer">İptal</button>
              <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent)} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50">
                {loading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Şifre dialog ─────────────────────────────────────────────────────────────
function PasswordDialog({ password, onClose }: { password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-[#161616] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Müşteri Oluşturuldu</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={16} /></button>
        </div>
        <p className="text-xs text-white/40 mb-4">Bu şifreyi müşteriye iletin. Daha sonra tekrar görüntülenemez.</p>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 mb-4">
          <span className="flex-1 font-mono text-sm text-white tracking-wider">{password}</span>
          <button onClick={copy} className="text-white/30 hover:text-white/70 transition-colors cursor-pointer">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer">Tamam, İlettim</button>
      </motion.div>
    </div>
  );
}

// ─── Silme dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-[#161616] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <h3 className="text-sm font-semibold text-white mb-2">Müşteriyi Sil</h3>
        <p className="text-xs text-white/40 mb-5"><span className="text-white/70 font-medium">{name}</span> adlı müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">İptal</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500/90 text-white text-sm font-semibold hover:bg-red-500 transition-colors cursor-pointer">Sil</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Satır genişletme (bakiye geçmişi) ───────────────────────────────────────
function ExpandedRow({ customer }: { customer: Customer }) {
  const history = (customer.balanceHistory ?? []).slice(0, 6);

  return (
    <tr className="border-0">
      <td colSpan={8} className="p-0 border-0">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          {history.length === 0 ? (
            <div className="px-10 py-3 text-[10px] text-white/20 bg-white/[0.01]">Bakiye işlemi yok</div>
          ) : (
            <div className="bg-white/[0.015] border-t border-white/[0.04]">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 px-10 py-2.5 border-b border-white/[0.03] last:border-0">
                  <div className={cn("w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                    h.type === "ekle" ? "bg-emerald-400/10" : h.type === "cikar" ? "bg-red-400/10" : "bg-blue-400/10"
                  )}>
                    {h.type === "ekle" ? <TrendingUp size={10} className="text-emerald-400" /> :
                      h.type === "cikar" ? <TrendingDown size={10} className="text-red-400" /> :
                        <SlidersHorizontal size={10} className="text-blue-400" />}
                  </div>
                  <span className={cn("text-[10px] font-medium w-24 shrink-0",
                    h.type === "ekle" ? "text-emerald-400" : h.type === "cikar" ? "text-red-400" : "text-blue-400"
                  )}>
                    {h.type === "ekle" ? "+" : h.type === "cikar" ? "-" : "="}{formatCurrency(h.amount)}
                  </span>
                  <span className="text-[10px] text-white/25 flex-1 truncate">{h.note || "—"}</span>
                  <span className="text-[10px] text-white/20 shrink-0">
                    {formatCurrency(h.previousBalance)} → {formatCurrency(h.newBalance)}
                  </span>
                  <span className="text-[10px] text-white/20 shrink-0 w-20 text-right">{formatDate(h.date)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </td>
    </tr>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const { success, error: toastError, info } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDurum, setFilterDurum] = useState<"hepsi" | "aktif" | "pasif">("hepsi");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [balanceTarget, setBalanceTarget] = useState<Customer | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customers`)
      .then((r) => r.json())
      .then((data) => setCustomers(data as Customer[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function openNew() { setEditCustomer(null); setDrawerOpen(true); }
  function openEdit(c: Customer) { setEditCustomer(c); setDrawerOpen(true); }

  function handleSaved(c: Customer, pass?: string) {
    const isNew = !customers.find((x) => x.id === c.id);
    setCustomers((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
      return [c, ...prev];
    });
    if (pass) {
      setTempPassword(pass);
      success("Müşteri oluşturuldu", `${c.ad} başarıyla eklendi`);
    } else if (!isNew) {
      info("Müşteri güncellendi", `${c.ad} bilgileri kaydedildi`);
    }
  }

  function handleBalanceUpdated(c: Customer) {
    setCustomers((prev) => prev.map((x) => x.id === c.id ? c : x));
    success("Bakiye güncellendi", `${c.ad} — yeni bakiye: ${formatCurrency(c.balance ?? 0)}`);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const name = deleteTarget.ad;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customers/${deleteTarget.id}`, { method: "DELETE" });
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toastError("Müşteri silindi", `${name} sistemden kaldırıldı`);
    } catch {
      toastError("Hata", "Silme işlemi başarısız");
    }
    setDeleteTarget(null);
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.ad.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.sirket || "").toLowerCase().includes(q);
    const matchDurum = filterDurum === "hepsi" || c.durum === filterDurum;
    return matchSearch && matchDurum;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Başlık */}
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white">Müşteriler</h1>
          <p className="text-sm text-white/30 mt-0.5">{customers.length} müşteri kayıtlı</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer">
          <Plus size={15} />
          Yeni Müşteri
        </button>
      </motion.div>

      {/* Filtreler */}
      <motion.div className="flex items-center gap-3 flex-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad, e-posta veya şirket ara..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors" />
        </div>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {(["hepsi", "aktif", "pasif"] as const).map((d) => (
            <button key={d} onClick={() => setFilterDurum(d)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer", filterDurum === d ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60")}>
              {d === "hepsi" ? "Hepsi" : d === "aktif" ? "Aktif" : "Pasif"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tablo */}
      <motion.div className="bg-[#161616] rounded-xl border border-white/[0.06] overflow-hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-white/20">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">{search || filterDurum !== "hepsi" ? "Sonuç bulunamadı" : "Henüz müşteri yok"}</p>
            {!search && filterDurum === "hepsi" && (
              <button onClick={openNew} className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2 cursor-pointer">İlk müşteriyi ekle</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left text-white/30 font-medium px-5 py-3 w-6"></th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Müşteri</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">İletişim</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Şehir</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Bakiye</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Durum</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Kayıt</th>
                  <th className="text-right text-white/30 font-medium px-5 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((c) => {
                  const isExpanded = expandedId === c.id;
                  return (
                    <>
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            className="text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                          >
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown size={13} />
                            </motion.div>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-white/80 font-medium">{c.ad}</p>
                          {c.sirket && <p className="text-white/30 text-[10px] mt-0.5">{c.sirket}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-white/60">{c.email}</p>
                          {c.telefon && <p className="text-white/30 text-[10px] mt-0.5">{c.telefon}</p>}
                        </td>
                        <td className="px-4 py-4 text-white/50">{c.sehir}</td>
                        <td className="px-4 py-4">
                          <span className={cn("font-medium", (c.balance ?? 0) > 0 ? "text-emerald-400" : "text-white/40")}>
                            {formatCurrency(c.balance ?? 0)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium", c.durum === "aktif" ? "text-emerald-400 bg-emerald-400/10" : "text-white/30 bg-white/5")}>
                            {c.durum === "aktif" ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-white/30">{formatDate(c.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setBalanceTarget(c)} className="text-white/25 hover:text-emerald-400 transition-colors cursor-pointer p-1" title="Bakiye Yönet">
                              <Wallet size={13} />
                            </button>
                            <button onClick={() => openEdit(c)} className="text-white/25 hover:text-white/70 transition-colors cursor-pointer p-1">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteTarget(c)} className="text-white/25 hover:text-red-400 transition-colors cursor-pointer p-1">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && <ExpandedRow customer={c} />}
                      </AnimatePresence>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <CustomerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} customer={editCustomer} onSaved={handleSaved} />
      {tempPassword && <PasswordDialog password={tempPassword} onClose={() => setTempPassword(null)} />}
      {deleteTarget && <DeleteDialog name={deleteTarget.ad} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
      {balanceTarget && <BalanceDialog customer={balanceTarget} onClose={() => setBalanceTarget(null)} onUpdated={handleBalanceUpdated} />}
    </div>
  );
}