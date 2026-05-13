"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Save, Loader2, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SettingsPage() {
  const toast = useToast();

  const [notificationPhone, setNotificationPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [waStatus, setWaStatus] = useState<"disconnected" | "qr" | "connecting" | "ready">("disconnected");
  const [waPhone, setWaPhone] = useState<string | null>(null);

  useEffect(() => {
    // Mevcut ayarları yükle
    fetch(`${API}/api/notifications/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.notificationPhone) setNotificationPhone(d.notificationPhone); })
      .catch(() => {});

    // WhatsApp durumunu al
    fetch(`${API}/api/whatsapp/status`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setWaStatus(d.status); setWaPhone(d.phone); })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/notifications/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notificationPhone }),
      });
      if (res.ok) toast.success("Ayarlar kaydedildi");
      else toast.error("Kaydedilemedi");
    } catch { toast.error("Sunucuya bağlanılamadı"); } finally { setSaving(false); }
  }

  const waConnected = waStatus === "ready";

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-white">Genel Ayarlar</h1>
        <p className="text-sm text-white/30 mt-0.5">Sistem tercihlerinizi buradan yapılandırın.</p>
      </motion.div>

      {/* WhatsApp Bildirim Ayarı */}
      <motion.div
        className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 space-y-5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <MessageCircle size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">WhatsApp Bildirimleri</p>
              <p className="text-xs text-white/35 mt-0.5">Yeni sipariş, destek mesajı gibi bildirimleri bu numaraya WhatsApp mesajı olarak gönder</p>
            </div>
          </div>
          {/* WA durum badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 ${waConnected ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
            {waConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {waConnected ? `Bağlı${waPhone ? ` · +${waPhone}` : ""}` : "Bağlı Değil"}
          </div>
        </div>

        {!waConnected && (
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-xs text-amber-400">
            WhatsApp bağlı değil. Bildirim göndermek için{" "}
            <a href="/admin/whatsapp" className="underline hover:text-amber-300 cursor-pointer">WhatsApp sayfasından</a>
            {" "}bağlanın.
          </div>
        )}

        <div>
          <label className="text-xs text-white/40 mb-1.5 block">Admin WhatsApp Numarası</label>
          <div className="relative">
            <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={notificationPhone}
              onChange={(e) => setNotificationPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="05xxxxxxxxx veya +905xxxxxxxxx"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
            />
          </div>
          <p className="text-[10px] text-white/25 mt-1.5">
            Bu numaraya her yeni bildirimde otomatik WhatsApp mesajı gönderilir. WhatsApp bağlı olmalıdır.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </motion.div>

      {/* Bildirim Hakkında Bilgi */}
      <motion.div
        className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 space-y-3"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <CheckCircle size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Anlık Bildirimler</p>
            <p className="text-xs text-white/35 mt-0.5">Admin paneli her 3 saniyede yeni bildirimleri kontrol eder</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 shrink-0" />
            Yeni sipariş oluşturulduğunda
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
            Destek talebine müşteri mesaj gönderdiğinde
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0" />
            Müşteri bakiyesi değiştiğinde
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 shrink-0" />
            Fatura oluşturulduğunda / durumu değiştiğinde
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400/60 shrink-0" />
            Yeni müşteri kaydolduğunda
          </div>
        </div>
      </motion.div>
    </div>
  );
}