"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Tag, Copy, Check, Pencil, Trash2, X, RefreshCw,
  Users, Percent, DollarSign, Calendar, ToggleLeft, ToggleRight,
  UserPlus, UserMinus, Search, Globe, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  usageLimit: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
  assignedTo: string[];
  durum: "aktif" | "pasif";
  createdAt: string;
}

interface Customer {
  id: string;
  ad: string;
  email: string;
  sirket?: string;
}

type CouponForm = {
  code: string;
  type: "percent" | "fixed";
  value: string;
  minOrder: string;
  usageLimit: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  durum: "aktif" | "pasif";
};

const EMPTY_FORM: CouponForm = {
  code: "", type: "percent", value: "", minOrder: "0",
  usageLimit: "", startDate: "", endDate: "",
  isPublic: true, durum: "aktif",
};

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function isExpired(endDate: string | null) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

function couponStatus(c: Coupon): "aktif" | "pasif" | "bitti" {
  if (isExpired(c.endDate)) return "bitti";
  return c.durum;
}

const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors";

// ─── Kupon Drawer ─────────────────────────────────────────────────────────────
function CouponDrawer({ open, onClose, coupon, onSaved }: {
  open: boolean; onClose: () => void;
  coupon: Coupon | null;
  onSaved: (c: Coupon) => void;
}) {
  const isEdit = !!coupon;
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      if (coupon) {
        setForm({
          code: coupon.code,
          type: coupon.type,
          value: String(coupon.value),
          minOrder: String(coupon.minOrder),
          usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
          startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
          endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : "",
          isPublic: coupon.isPublic ?? true,
          durum: coupon.durum,
        });
      } else {
        setForm({ ...EMPTY_FORM, code: generateCode() });
      }
    }
  }, [open, coupon]);

  function set<K extends keyof CouponForm>(key: K, value: CouponForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.code.trim()) { setError("Kupon kodu gerekli"); return; }
    if (!form.value || parseFloat(form.value) <= 0) { setError("Geçerli bir indirim değeri girin"); return; }
    setLoading(true);
    try {
      const body = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: parseFloat(form.value),
        minOrder: parseFloat(form.minOrder) || 0,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isPublic: form.isPublic,
        durum: form.durum,
      };
      const url = isEdit ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/coupons/${coupon!.id}` : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/coupons`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Hata"); return; }
      onSaved(data as Coupon);
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
              <h2 className="text-base font-semibold text-white">{isEdit ? "Kuponu Düzenle" : "Yeni Kupon"}</h2>
              <button onClick={onClose} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Kupon kodu */}
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">Kupon Kodu <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    className={cn(inputCls, "pr-10 font-mono tracking-widest uppercase")}
                    value={form.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase())}
                    placeholder="YAZA25"
                    required
                  />
                  <button type="button" onClick={() => set("code", generateCode())} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 cursor-pointer">
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              {/* İndirim tipi */}
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block">İndirim Tipi</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "percent", label: "Yüzde (%)", icon: Percent },
                    { value: "fixed", label: "Sabit (₺)", icon: DollarSign },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => set("type", value)}
                      className={cn("flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                        form.type === value ? "border-white/20 bg-white/[0.06] text-white" : "border-white/[0.06] text-white/30 hover:border-white/10 hover:text-white/50"
                      )}>
                      <Icon size={13} />{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Değer */}
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">
                  İndirim Değeri {form.type === "percent" ? "(%)" : "(₺)"} <span className="text-red-400">*</span>
                </label>
                <input type="number" min="0" max={form.type === "percent" ? "100" : undefined} step="0.01"
                  className={inputCls} value={form.value} onChange={(e) => set("value", e.target.value)}
                  placeholder={form.type === "percent" ? "25" : "100"} required />
              </div>

              {/* Min sipariş */}
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">Minimum Sipariş Tutarı (₺)</label>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.minOrder}
                  onChange={(e) => set("minOrder", e.target.value)} placeholder="0" />
              </div>

              {/* Kullanım limiti */}
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">Kullanım Limiti (boş = sınırsız)</label>
                <input type="number" min="1" className={inputCls} value={form.usageLimit}
                  onChange={(e) => set("usageLimit", e.target.value)} placeholder="Sınırsız" />
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1.5 block">Başlangıç</label>
                  <input type="date" className={inputCls} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1.5 block">Bitiş</label>
                  <input type="date" className={inputCls} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                </div>
              </div>

              {/* Kapsam */}
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block">Kapsam</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: true, label: "Herkese Açık", icon: Globe, desc: "Tüm müşteriler kullanabilir" },
                    { value: false, label: "Özel Müşteriler", icon: Lock, desc: "Sadece atanan müşteriler" },
                  ] as const).map(({ value, label, icon: Icon, desc }) => (
                    <button key={String(value)} type="button" onClick={() => set("isPublic", value)}
                      className={cn("flex flex-col items-start gap-1 px-3 py-3 rounded-xl border text-left transition-all cursor-pointer",
                        form.isPublic === value ? "border-white/20 bg-white/[0.06]" : "border-white/[0.06] hover:border-white/10"
                      )}>
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} className={form.isPublic === value ? "text-white/70" : "text-white/25"} />
                        <span className={cn("text-xs font-medium", form.isPublic === value ? "text-white" : "text-white/30")}>{label}</span>
                      </div>
                      <span className="text-[10px] text-white/25 leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Durum */}
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block">Durum</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["aktif", "pasif"] as const).map((d) => (
                    <button key={d} type="button" onClick={() => set("durum", d)}
                      className={cn("py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                        form.durum === d
                          ? d === "aktif" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/[0.04] text-white/50"
                          : "border-white/[0.06] text-white/25 hover:border-white/10"
                      )}>
                      {d === "aktif" ? "Aktif" : "Pasif"}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><p className="text-xs text-red-400">{error}</p></div>}
            </form>

            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">İptal</button>
              <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent)} disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50">
                {loading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Müşteri Atama Dialog ─────────────────────────────────────────────────────
function AssignDialog({ coupon, customers, onClose, onUpdated }: {
  coupon: Coupon;
  customers: Customer[];
  onClose: () => void;
  onUpdated: (c: Coupon) => void;
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"atanmamis" | "atanmis">("atanmamis");
  const [loading, setLoading] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const assigned = coupon.assignedTo || [];
  const assignedCustomers = customers.filter((c) => assigned.includes(c.id));
  const unassignedCustomers = customers.filter((c) => !assigned.includes(c.id));

  const filterList = (list: Customer[]) => {
    const q = search.toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.ad.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  };

  const displayList = tab === "atanmis" ? filterList(assignedCustomers) : filterList(unassignedCustomers);

  async function toggle(customerId: string, isAssigned: boolean) {
    setLoading(customerId);
    try {
      const endpoint = isAssigned ? "unassign" : "assign";
      const body = isAssigned ? { customerId } : { customerIds: [customerId] };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/coupons/${coupon.id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toastError("Hata", data.message); return; }
      onUpdated(data as Coupon);
      const customer = customers.find((c) => c.id === customerId);
      success(isAssigned ? "Kupon kaldırıldı" : "Kupon atandı", customer?.ad);
    } catch {
      toastError("Hata", "Sunucuya bağlanılamadı");
    } finally {
      setLoading(null);
    }
  }

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
            <h3 className="text-sm font-semibold text-white">Müşteri Ataması</h3>
            <p className="text-[10px] text-white/30 mt-0.5 font-mono">{coupon.code}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={16} /></button>
        </div>

        {/* Özet */}
        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-white/30" />
            <span className="text-xs text-white/50">{assigned.length} atandı</span>
          </div>
          <div className="flex items-center gap-1.5">
            {coupon.isPublic
              ? <><Globe size={12} className="text-blue-400" /><span className="text-xs text-blue-400">Herkese açık</span></>
              : <><Lock size={12} className="text-amber-400" /><span className="text-xs text-amber-400">Sadece atananlar</span></>
            }
          </div>
          {!coupon.isPublic && assigned.length === 0 && (
            <span className="text-[10px] text-red-400/70 ml-auto">⚠ Kimse kullanamaz</span>
          )}
        </div>

        {/* Tab */}
        <div className="flex border-b border-white/[0.06]">
          {([
            { key: "atanmamis", label: `Atanmamış (${unassignedCustomers.length})` },
            { key: "atanmis", label: `Atanmış (${assignedCustomers.length})` },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn("flex-1 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                tab === key ? "text-white border-b-2 border-white" : "text-white/30 hover:text-white/60"
              )}>
              {label}
            </button>
          ))}
        </div>

        {/* Arama */}
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Müşteri ara..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors" />
          </div>
        </div>

        {/* Liste */}
        <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
          {displayList.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/20">
              {search ? "Sonuç bulunamadı" : tab === "atanmis" ? "Henüz kimse atanmadı" : "Tüm müşteriler atandı"}
            </div>
          ) : (
            displayList.map((c) => {
              const isAssigned = assigned.includes(c.id);
              const isLoading = loading === c.id;
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 text-[10px] font-semibold text-white/40">
                    {c.ad.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/80 truncate">{c.ad}</p>
                    <p className="text-[10px] text-white/30 truncate">{c.email}</p>
                  </div>
                  <button
                    onClick={() => toggle(c.id, isAssigned)}
                    disabled={isLoading}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer disabled:opacity-50 shrink-0",
                      isAssigned ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    )}
                  >
                    {isLoading ? (
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : isAssigned ? <><UserMinus size={11} /> Kaldır</> : <><UserPlus size={11} /> Ata</>}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white/[0.06] text-white/60 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer">Kapat</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Kupon Kartı ──────────────────────────────────────────────────────────────
function CouponCard({ coupon, customers, onEdit, onDelete, onToggle, onAssign }: {
  coupon: Coupon;
  customers: Customer[];
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onAssign: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const status = couponStatus(coupon);

  function copy() {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const assignedNames = (coupon.assignedTo || [])
    .map((id) => customers.find((c) => c.id === id)?.ad)
    .filter(Boolean) as string[];

  return (
    <motion.div layout
      className={cn("bg-[#161616] border rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden",
        status === "aktif" ? "border-white/[0.08]" : "border-white/[0.04] opacity-60"
      )}
    >
      <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/[0.015] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Üst satır */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
            <Tag size={15} className="text-white/50" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white tracking-wider">{coupon.code}</span>
              <button onClick={copy} className="text-white/20 hover:text-white/60 transition-colors cursor-pointer">
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                status === "aktif" ? "text-emerald-400 bg-emerald-400/10" :
                  status === "bitti" ? "text-amber-400 bg-amber-400/10" : "text-white/30 bg-white/5"
              )}>
                {status === "aktif" ? "Aktif" : status === "bitti" ? "Süresi Doldu" : "Pasif"}
              </span>
              {coupon.isPublic
                ? <span className="text-[9px] text-blue-400/70 flex items-center gap-0.5"><Globe size={8} /> Herkese açık</span>
                : <span className="text-[9px] text-amber-400/70 flex items-center gap-0.5"><Lock size={8} /> Özel</span>
              }
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">
            {coupon.type === "percent" ? `%${coupon.value}` : `₺${coupon.value}`}
          </p>
          <p className="text-[10px] text-white/30">indirim</p>
        </div>
      </div>

      {/* Detaylar */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/[0.03] rounded-xl py-2">
          <p className="text-xs font-semibold text-white">{coupon.usedCount}</p>
          <p className="text-[9px] text-white/30 mt-0.5">Kullanılan</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl py-2">
          <p className="text-xs font-semibold text-white">
            {coupon.usageLimit != null ? coupon.usageLimit - coupon.usedCount : "∞"}
          </p>
          <p className="text-[9px] text-white/30 mt-0.5">Kalan</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl py-2">
          <p className="text-xs font-semibold text-white">{coupon.minOrder > 0 ? `₺${coupon.minOrder}` : "—"}</p>
          <p className="text-[9px] text-white/30 mt-0.5">Min. Sipariş</p>
        </div>
      </div>

      {/* Tarih */}
      {(coupon.startDate || coupon.endDate) && (
        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
          <Calendar size={10} />
          {coupon.startDate && <span>{formatDate(coupon.startDate)}</span>}
          {coupon.startDate && coupon.endDate && <span>—</span>}
          {coupon.endDate && <span className={isExpired(coupon.endDate) ? "text-amber-400" : ""}>{formatDate(coupon.endDate)}</span>}
        </div>
      )}

      {/* Atanan müşteriler — sadece özel modda göster */}
      {!coupon.isPublic && (
        <button onClick={onAssign} className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer">
          <Users size={11} className="text-white/25 shrink-0" />
          {assignedNames.length === 0 ? (
            <span className="text-[10px] text-red-400/60">⚠ Henüz kimse atanmadı</span>
          ) : (
            <span className="text-[10px] text-white/40 truncate">
              {assignedNames.slice(0, 2).join(", ")}
              {assignedNames.length > 2 && ` +${assignedNames.length - 2} kişi`}
            </span>
          )}
        </button>
      )}

      {/* Aksiyonlar */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.05]">
        {!coupon.isPublic && (
          <button onClick={onAssign} className="flex items-center gap-1.5 text-[10px] text-white/35 hover:text-white/70 transition-colors cursor-pointer">
            <UserPlus size={11} />
            Müşteri Ata
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[10px] text-white/35 hover:text-white/70 transition-colors cursor-pointer"
          title={coupon.durum === "aktif" ? "Pasife Al" : "Aktife Al"}
        >
          {coupon.durum === "aktif"
            ? <><ToggleRight size={16} className="text-emerald-400" /><span className="text-emerald-400">Aktif</span></>
            : <><ToggleLeft size={16} /><span>Pasif</span></>
          }
        </button>
        <button onClick={onEdit} className="text-white/25 hover:text-white/70 transition-colors cursor-pointer p-1">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete} className="text-white/25 hover:text-red-400 transition-colors cursor-pointer p-1">
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const { success, error: toastError } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [assignCoupon, setAssignCoupon] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [filterStatus, setFilterStatus] = useState<"hepsi" | "aktif" | "pasif">("hepsi");

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/coupons`).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/customers`).then((r) => r.json()),
    ]).then(([c, cu]) => {
      setCoupons(c as Coupon[]);
      setCustomers(cu as Customer[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function handleSaved(c: Coupon) {
    const isNew = !coupons.find((x) => x.id === c.id);
    setCoupons((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
      return [c, ...prev];
    });
    success(isNew ? "Kupon oluşturuldu" : "Kupon güncellendi", c.code);
  }

  function handleUpdated(c: Coupon) {
    setCoupons((prev) => prev.map((x) => x.id === c.id ? c : x));
    if (assignCoupon?.id === c.id) setAssignCoupon(c);
  }

  async function handleToggle(coupon: Coupon) {
    const newDurum = coupon.durum === "aktif" ? "pasif" : "aktif";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: newDurum }),
      });
      const data = await res.json();
      if (!res.ok) { toastError("Hata", data.message); return; }
      setCoupons((prev) => prev.map((x) => x.id === coupon.id ? data as Coupon : x));
      success(newDurum === "aktif" ? "Kupon aktifleştirildi" : "Kupon pasife alındı", coupon.code);
    } catch {
      toastError("Hata", "Sunucuya bağlanılamadı");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/coupons/${deleteTarget.id}`, { method: "DELETE" });
      setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toastError("Kupon silindi", deleteTarget.code);
    } catch {
      toastError("Hata", "Silme başarısız");
    }
    setDeleteTarget(null);
  }

  const filtered = coupons.filter((c) => {
    if (filterStatus === "hepsi") return true;
    return couponStatus(c) === filterStatus;
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => couponStatus(c) === "aktif").length,
    used: coupons.reduce((s, c) => s + c.usedCount, 0),
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white">Pazarlama</h1>
          <p className="text-sm text-white/30 mt-0.5">İndirim kuponları ve müşteri atamaları</p>
        </div>
        <button onClick={() => { setEditCoupon(null); setDrawerOpen(true); }}
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer">
          <Plus size={15} />Yeni Kupon
        </button>
      </motion.div>

      {/* İstatistikler */}
      <motion.div className="grid grid-cols-3 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        {[
          { label: "Toplam Kupon", value: stats.total, icon: Tag },
          { label: "Aktif Kupon", value: stats.active, icon: ToggleRight },
          { label: "Toplam Kullanım", value: stats.used, icon: Check },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#161616] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
              <Icon size={15} className="text-white/40" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-[10px] text-white/30">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filtre */}
      <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {(["hepsi", "aktif", "pasif"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                filterStatus === s ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}>
              {s === "hepsi" ? "Hepsi" : s === "aktif" ? "Aktif" : "Pasif"}
            </button>
          ))}
        </div>
        <span className="text-xs text-white/25">{filtered.length} kupon</span>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div className="flex flex-col items-center gap-3 py-20 text-white/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Tag size={36} strokeWidth={1.2} />
          <p className="text-sm">Henüz kupon yok</p>
          <button onClick={() => { setEditCoupon(null); setDrawerOpen(true); }} className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2 cursor-pointer">İlk kuponu oluştur</button>
        </motion.div>
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AnimatePresence>
            {filtered.map((c) => (
              <CouponCard key={c.id} coupon={c} customers={customers}
                onEdit={() => { setEditCoupon(c); setDrawerOpen(true); }}
                onDelete={() => setDeleteTarget(c)}
                onToggle={() => handleToggle(c)}
                onAssign={() => setAssignCoupon(c)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <CouponDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} coupon={editCoupon} onSaved={handleSaved} />

      {assignCoupon && (
        <AssignDialog coupon={assignCoupon} customers={customers}
          onClose={() => setAssignCoupon(null)} onUpdated={handleUpdated} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <motion.div className="relative bg-[#161616] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h3 className="text-sm font-semibold text-white mb-2">Kuponu Sil</h3>
            <p className="text-xs text-white/40 mb-5">
              <span className="font-mono text-white/70">{deleteTarget.code}</span> kodlu kuponu silmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">İptal</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500/90 text-white text-sm font-semibold hover:bg-red-500 transition-colors cursor-pointer">Sil</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}