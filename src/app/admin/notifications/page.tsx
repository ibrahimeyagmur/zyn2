"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, X, Phone, Save, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

const TYPE_COLORS: Record<string, string> = {
  siparis: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  destek: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  bakiye: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  fatura: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  musteri: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  genel: "bg-white/[0.06] text-white/40 border-white/10",
};

const TYPE_LABELS: Record<string, string> = {
  siparis: "Sipariş",
  destek: "Destek",
  bakiye: "Bakiye",
  fatura: "Fatura",
  musteri: "Müşteri",
  genel: "Genel",
};

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"hepsi" | "okunmamis" | "okunmus">("hepsi");
  const [typeFilter, setTypeFilter] = useState<string>("hepsi");

  // Settings
  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [waStatus, setWaStatus] = useState<string>("disconnected");

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchNotifs() {
    try {
      const r = await fetch(`${API}/api/notifications`);
      const d = await r.json();
      setNotifs(Array.isArray(d) ? d : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function fetchSettings() {
    try {
      const r = await fetch(`${API}/api/notifications/settings`);
      const d = await r.json();
      setPhone(d.notificationPhone || "");
    } catch { /* ignore */ }
  }

  async function fetchWaStatus() {
    try {
      const r = await fetch(`${API}/api/whatsapp/status`);
      const d = await r.json();
      setWaStatus(d.status || "disconnected");
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNotifs();
    fetchSettings();
    fetchWaStatus();
    const iv = setInterval(fetchNotifs, 15000);
    return () => clearInterval(iv);
  }, []);

  async function savePhone() {
    setPhoneSaving(true);
    try {
      await fetch(`${API}/api/notifications/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPhone: phone }),
      });
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 2000);
      showToast("Bildirim numarası kaydedildi");
    } catch {
      showToast("Kayıt başarısız", "error");
    } finally {
      setPhoneSaving(false);
    }
  }

  async function markAllRead() {
    await fetch(`${API}/api/notifications/read-all`, { method: "PUT" });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("Tümü okundu işaretlendi");
  }

  async function clearAll() {
    await fetch(`${API}/api/notifications/clear-all`, { method: "DELETE" });
    setNotifs([]);
    showToast("Tüm bildirimler temizlendi");
  }

  async function deleteNotif(id: string) {
    await fetch(`${API}/api/notifications/${id}`, { method: "DELETE" });
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  async function markRead(id: string) {
    await fetch(`${API}/api/notifications/${id}/read`, { method: "PUT" });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const types = ["hepsi", ...Array.from(new Set(notifs.map((n) => n.type)))];

  const filtered = notifs.filter((n) => {
    const matchRead = filter === "hepsi" || (filter === "okunmamis" ? !n.read : n.read);
    const matchType = typeFilter === "hepsi" || n.type === typeFilter;
    return matchRead && matchType;
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  const waStatusColor = waStatus === "ready" ? "text-emerald-400" : waStatus === "qr" || waStatus === "connecting" ? "text-amber-400" : "text-white/30";
  const waStatusLabel = waStatus === "ready" ? "Bağlı" : waStatus === "qr" ? "QR Bekleniyor" : waStatus === "connecting" ? "Bağlanıyor" : "Bağlı Değil";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Bildirimler</h1>
        <p className="text-sm text-white/30 mt-0.5">{notifs.length} bildirim, {unreadCount} okunmamış</p>
      </div>

      {/* WhatsApp Bildirim Ayarı */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <MessageCircle size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">WhatsApp Bildirim Numarası</p>
            <p className="text-xs text-white/30 mt-0.5">
              Yeni sipariş, destek talebi ve bakiye işlemlerinde bu numaraya WhatsApp mesajı gönderilir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", waStatusColor,
            waStatus === "ready" ? "bg-emerald-500/10 border-emerald-500/20" :
            waStatus === "connecting" || waStatus === "qr" ? "bg-amber-500/10 border-amber-500/20" :
            "bg-white/[0.04] border-white/10"
          )}>
            WA: {waStatusLabel}
          </div>
          {waStatus !== "ready" && (
            <a href="/admin/whatsapp" className="text-[10px] text-white/30 hover:text-white/60 underline transition-colors">
              WhatsApp bağla →
            </a>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="905xxxxxxxxx (ülke kodu dahil)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
            />
          </div>
          <button
            onClick={savePhone}
            disabled={phoneSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {phoneSaved ? <Check size={14} /> : <Save size={14} />}
            {phoneSaved ? "Kaydedildi" : "Kaydet"}
          </button>
        </div>
        <p className="text-[10px] text-white/20 mt-2">
          Örnek: 905321234567 — Başında + veya 0 olmadan, ülke kodu dahil yazın.
        </p>
      </div>

      {/* Filtreler + Aksiyonlar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {(["hepsi", "okunmamis", "okunmus"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                filter === f ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              {f === "hepsi" ? "Hepsi" : f === "okunmamis" ? `Okunmamış (${unreadCount})` : "Okunmuş"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize",
                typeFilter === t ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              {t === "hepsi" ? "Tüm Tipler" : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <Check size={12} /> Tümünü Oku
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={12} /> Tümünü Temizle
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-white/20">
            <Bell size={28} strokeWidth={1.2} />
            <p className="text-sm">Bildirim yok</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            <AnimatePresence initial={false}>
              {filtered.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 group transition-colors",
                    !n.read ? "bg-white/[0.02]" : "hover:bg-white/[0.01]"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 mt-0.5 uppercase",
                    TYPE_COLORS[n.type] || TYPE_COLORS.genel
                  )}>
                    {TYPE_LABELS[n.type] || n.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", n.read ? "text-white/50" : "text-white/80")}>
                      {n.title}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-white/20 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                        title="Okundu işaretle"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif(n.id)}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-red-500/10 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={cn(
              "fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl",
              toast.type === "success"
                ? "bg-[#161616] border-emerald-500/20 text-emerald-400"
                : "bg-[#161616] border-red-500/20 text-red-400"
            )}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          >
            {toast.type === "success" ? <Check size={14} /> : <X size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}