"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, WifiOff, RefreshCw, Send, Users, Phone, CheckCircle,
  XCircle, Loader2, MessageSquare, Zap, Plus, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr";

type WAStatus = "disconnected" | "qr" | "connecting" | "ready";

interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  phone: string | null;
  name: string | null;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneVerified?: boolean;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface BulkResult {
  id: string;
  name: string;
  phone: string;
  success: boolean;
  error?: string;
}

const STATUS_CONFIG: Record<WAStatus, { label: string; color: string; icon: React.ElementType }> = {
  disconnected: { label: "Bağlı Değil", color: "text-red-400", icon: WifiOff },
  qr: { label: "QR Bekleniyor", color: "text-amber-400", icon: RefreshCw },
  connecting: { label: "Bağlanıyor...", color: "text-blue-400", icon: Loader2 },
  ready: { label: "Bağlı", color: "text-emerald-400", icon: Wifi },
};

export default function WhatsAppPage() {
  const toast = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [waState, setWaState] = useState<WAState>({ status: "disconnected", qrDataUrl: null, phone: null, name: null });
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Toplu mesaj
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);

  // Tekil mesaj + kişi rehberi
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>(""); // phone value
  const [singlePhone, setSinglePhone] = useState("");
  const [singleName, setSingleName] = useState("");
  const [singleMessage, setSingleMessage] = useState("");
  const [sendingSingle, setSendingSingle] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // OTP
  const [otpCustomerId, setOtpCustomerId] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  const [activeTab, setActiveTab] = useState<"connect" | "bulk" | "single" | "otp">("connect");

  async function fetchStatus() {
    try {
      const res = await fetch(`${API}/api/whatsapp/status`, { credentials: "include" });
      if (res.ok) setWaState(await res.json());
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    // Telefonu olan müşteriler
    fetch(`${API}/api/whatsapp/customers-with-phone`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => {});
    // Kişi rehberi
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const res = await fetch(`${API}/api/whatsapp/contacts`, { credentials: "include" });
      if (res.ok) setContacts(await res.json());
    } catch { /* ignore */ }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch(`${API}/api/whatsapp/connect`, { method: "POST", credentials: "include" });
      const data = await res.json();
      toast.info(data.message || "Bağlantı başlatıldı");
    } catch { toast.error("Bağlantı başlatılamadı"); } finally { setConnecting(false); }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch(`${API}/api/whatsapp/disconnect`, { method: "POST", credentials: "include" });
      toast.success("Bağlantı kesildi");
    } catch { toast.error("Bağlantı kesilemedi"); } finally { setDisconnecting(false); }
  }

  async function handleSendBulk() {
    if (!bulkMessage.trim() || selectedIds.size === 0) return;
    setSending(true);
    setBulkResults(null);
    try {
      const res = await fetch(`${API}/api/whatsapp/send-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ customerIds: Array.from(selectedIds), message: bulkMessage }),
      });
      const data = await res.json();
      setBulkResults(data.results || []);
      toast.success(data.message || "Mesajlar gönderildi");
    } catch { toast.error("Toplu mesaj gönderilemedi"); } finally { setSending(false); }
  }

  // Kişi seçilince telefonu doldur
  function handleContactSelect(phone: string) {
    setSelectedContact(phone);
    setSinglePhone(phone);
    const c = contacts.find((c) => c.phone === phone);
    if (c) setSingleName(c.name);
  }

  async function handleSaveContact() {
    if (!singlePhone.trim()) return;
    setSavingContact(true);
    try {
      const res = await fetch(`${API}/api/whatsapp/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: singleName || singlePhone, phone: singlePhone }),
      });
      if (res.ok) {
        toast.success("Kişi kaydedildi");
        await fetchContacts();
      } else {
        const d = await res.json();
        toast.error(d.message || "Kaydedilemedi");
      }
    } catch { toast.error("Kaydedilemedi"); } finally { setSavingContact(false); }
  }

  async function handleDeleteContact(id: string) {
    try {
      await fetch(`${API}/api/whatsapp/contacts/${id}`, { method: "DELETE", credentials: "include" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Kişi silindi");
    } catch { toast.error("Silinemedi"); }
  }

  async function handleSendSingle() {
    if (!singlePhone.trim() || !singleMessage.trim()) return;
    setSendingSingle(true);
    try {
      const res = await fetch(`${API}/api/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: singlePhone, message: singleMessage }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Mesaj gönderildi"); setSingleMessage(""); }
      else toast.error(data.message || "Mesaj gönderilemedi");
    } catch { toast.error("Mesaj gönderilemedi"); } finally { setSendingSingle(false); }
  }

  async function handleSendOTP() {
    if (!otpCustomerId || !otpPhone.trim()) return;
    setSendingOtp(true);
    try {
      const res = await fetch(`${API}/api/whatsapp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ customerId: otpCustomerId, phone: otpPhone }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Doğrulama kodu gönderildi"); setOtpPhone(""); setOtpCustomerId(""); }
      else toast.error(data.message || "OTP gönderilemedi");
    } catch { toast.error("OTP gönderilemedi"); } finally { setSendingOtp(false); }
  }

  const statusCfg = STATUS_CONFIG[waState.status];
  const StatusIcon = statusCfg.icon;

  const tabs = [
    { id: "connect" as const, label: "Bağlantı", icon: Wifi },
    { id: "bulk" as const, label: "Toplu Mesaj", icon: Users },
    { id: "single" as const, label: "Tekil Mesaj", icon: MessageSquare },
    { id: "otp" as const, label: "OTP Gönder", icon: Zap },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-white">WhatsApp Entegrasyonu</h1>
        <p className="text-sm text-white/30 mt-0.5">QR kod ile WhatsApp hesabını bağla, otomasyon mesajları gönder</p>
      </motion.div>

      {/* Durum kartı */}
      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
            waState.status === "ready" ? "bg-emerald-400/10" :
            waState.status === "qr" ? "bg-amber-400/10" :
            waState.status === "connecting" ? "bg-blue-400/10" : "bg-red-400/10"
          )}>
            <StatusIcon size={16} className={cn(statusCfg.color, (waState.status === "connecting" || waState.status === "qr") && "animate-spin")} />
          </div>
          <div>
            <p className={cn("text-sm font-semibold", statusCfg.color)}>{statusCfg.label}</p>
            {waState.status === "ready" && waState.phone && (
              <p className="text-xs text-white/30">+{waState.phone}{waState.name ? ` · ${waState.name}` : ""}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {waState.status !== "ready" && (
            <button onClick={handleConnect} disabled={connecting || waState.status === "connecting"}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-semibold rounded-xl hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40">
              {connecting ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
              Bağlan
            </button>
          )}
          {waState.status === "ready" && (
            <button onClick={handleDisconnect} disabled={disconnecting}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-40">
              {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <WifiOff size={12} />}
              Bağlantıyı Kes
            </button>
          )}
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              activeTab === tab.id ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
            )}>
            <tab.icon size={11} />{tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* BAĞLANTI */}
        {activeTab === "connect" && (
          <motion.div key="connect" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {waState.status === "qr" && waState.qrDataUrl && (
              <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center gap-4">
                <p className="text-sm text-white/60">WhatsApp'ı aç → Bağlı Cihazlar → QR Kodu Tara</p>
                <div className="bg-white p-3 rounded-2xl">
                  <img src={waState.qrDataUrl} alt="WhatsApp QR" className="w-64 h-64 block" />
                </div>
                <p className="text-xs text-white/30 flex items-center gap-1.5">
                  <RefreshCw size={10} className="animate-spin" />QR kod her 20 saniyede yenilenir
                </p>
              </div>
            )}
            {waState.status === "connecting" && (
              <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
                <p className="text-sm text-white/50">WhatsApp bağlanıyor, lütfen bekleyin...</p>
              </div>
            )}
            {waState.status === "ready" && (
              <div className="bg-[#161616] border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
                  <CheckCircle size={24} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white">WhatsApp Bağlı</p>
                {waState.phone && <p className="text-xs text-white/40">+{waState.phone}</p>}
                <p className="text-xs text-white/30 text-center">Artık müşterilere otomatik mesaj gönderebilirsiniz.</p>
              </div>
            )}
            {waState.status === "disconnected" && (
              <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                  <WifiOff size={24} className="text-white/20" />
                </div>
                <p className="text-sm text-white/50">WhatsApp bağlı değil</p>
                <p className="text-xs text-white/30 text-center">Bağlan butonuna tıklayarak QR kodu görüntüleyin ve telefonunuzla tarayın.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* TOPLU MESAJ — sadece telefonu olan müşteriler */}
        {activeTab === "bulk" && (
          <motion.div key="bulk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {waState.status !== "ready" && (
              <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-xs text-amber-400">
                WhatsApp bağlı değil. Mesaj göndermek için önce bağlanın.
              </div>
            )}
            <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Müşteri Seç</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Sadece telefon numarası kayıtlı müşteriler listeleniyor</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedIds(new Set(customers.map((c) => c.id)))}
                    className="text-[10px] text-white/40 hover:text-white/70 cursor-pointer transition-colors">Tümünü Seç</button>
                  <span className="text-white/20">·</span>
                  <button onClick={() => setSelectedIds(new Set())}
                    className="text-[10px] text-white/40 hover:text-white/70 cursor-pointer transition-colors">Temizle</button>
                </div>
              </div>

              {customers.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-white/30">Telefon numarası kayıtlı müşteri bulunamadı</p>
                  <p className="text-[10px] text-white/20 mt-1">Müşteri profillerine telefon numarası ekleyin</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {customers.map((c) => (
                    <label key={c.id} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                      selectedIds.has(c.id) ? "bg-white/[0.06]" : "hover:bg-white/[0.03]")}>
                      <input type="checkbox" checked={selectedIds.has(c.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          if (e.target.checked) next.add(c.id); else next.delete(c.id);
                          setSelectedIds(next);
                        }}
                        className="accent-white w-3.5 h-3.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/80 truncate">{c.name}</p>
                        <p className="text-[10px] text-white/40 font-mono">{c.phone}</p>
                      </div>
                      {c.phoneVerified && <CheckCircle size={10} className="text-emerald-400 shrink-0" />}
                    </label>
                  ))}
                </div>
              )}

              <textarea value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Gönderilecek mesajı yazın..."
                rows={4}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors resize-none" />

              <button onClick={handleSendBulk}
                disabled={sending || selectedIds.size === 0 || !bulkMessage.trim() || waState.status !== "ready"}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? "Gönderiliyor..." : `${selectedIds.size} Kişiye Gönder`}
              </button>
            </div>

            {bulkResults && (
              <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5 space-y-2">
                <p className="text-xs font-medium text-white/50 mb-3">Sonuçlar</p>
                {bulkResults.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-xs">
                    {r.success ? <CheckCircle size={12} className="text-emerald-400 shrink-0" /> : <XCircle size={12} className="text-red-400 shrink-0" />}
                    <span className="text-white/70 flex-1">{r.name}</span>
                    <span className="text-white/30 font-mono">{r.phone || "—"}</span>
                    {!r.success && <span className="text-red-400/70">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TEKİL MESAJ + KİŞİ REHBERİ */}
        {activeTab === "single" && (
          <motion.div key="single" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {waState.status !== "ready" && (
              <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-xs text-amber-400">
                WhatsApp bağlı değil. Mesaj göndermek için önce bağlanın.
              </div>
            )}

            <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              {/* Kayıtlı kişilerden seç */}
              {contacts.length > 0 && (
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Kayıtlı Kişilerden Seç</label>
                  <select value={selectedContact}
                    onChange={(e) => handleContactSelect(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/25 transition-colors">
                    <option value="" className="bg-[#1c1c1c]">Kişi seçin veya manuel girin...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.phone} className="bg-[#1c1c1c]">{c.name} — {c.phone}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Manuel numara girişi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Ad (opsiyonel)</label>
                  <input value={singleName} onChange={(e) => setSingleName(e.target.value)}
                    placeholder="Kişi adı"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Telefon Numarası</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input value={singlePhone} onChange={(e) => { setSinglePhone(e.target.value); setSelectedContact(""); }}
                      placeholder="05xxxxxxxxx"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Kaydet butonu */}
              {singlePhone.trim() && !contacts.find((c) => c.phone === singlePhone) && (
                <button onClick={handleSaveContact} disabled={savingContact}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 cursor-pointer transition-colors disabled:opacity-40">
                  {savingContact ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  Bu numarayı rehbere kaydet
                </button>
              )}

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Mesaj</label>
                <textarea value={singleMessage} onChange={(e) => setSingleMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  rows={5}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors resize-none" />
              </div>

              <button onClick={handleSendSingle}
                disabled={sendingSingle || !singlePhone.trim() || !singleMessage.trim() || waState.status !== "ready"}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                {sendingSingle ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sendingSingle ? "Gönderiliyor..." : "Mesaj Gönder"}
              </button>
            </div>

            {/* Kişi rehberi listesi */}
            {contacts.length > 0 && (
              <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-xs font-medium text-white/50 mb-3">Kayıtlı Kişiler ({contacts.length})</p>
                <div className="space-y-1">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.03] group">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/70 truncate">{c.name}</p>
                        <p className="text-[10px] text-white/30 font-mono">{c.phone}</p>
                      </div>
                      <button onClick={() => handleDeleteContact(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 cursor-pointer transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* OTP GÖNDER */}
        {activeTab === "otp" && (
          <motion.div key="otp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              {waState.status !== "ready" && (
                <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-xs text-amber-400">
                  WhatsApp bağlı değil. OTP göndermek için önce bağlanın.
                </div>
              )}
              <p className="text-xs text-white/40">Müşteriye 6 haneli doğrulama kodu gönderir. Müşteri kodu girerek telefon numarasını doğrular.</p>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Müşteri</label>
                <select value={otpCustomerId}
                  onChange={(e) => {
                    setOtpCustomerId(e.target.value);
                    const c = customers.find((c) => c.id === e.target.value);
                    if (c?.phone) setOtpPhone(c.phone);
                  }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/25 transition-colors">
                  <option value="" className="bg-[#1c1c1c]">Müşteri seçin...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1c1c1c]">{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Telefon Numarası</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input value={otpPhone} onChange={(e) => setOtpPhone(e.target.value)}
                    placeholder="05xxxxxxxxx"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors" />
                </div>
              </div>
              <button onClick={handleSendOTP}
                disabled={sendingOtp || !otpCustomerId || !otpPhone.trim() || waState.status !== "ready"}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                {sendingOtp ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {sendingOtp ? "Gönderiliyor..." : "OTP Gönder"}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}