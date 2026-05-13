"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeadphonesIcon, Search, ChevronRight, Clock, Check, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  konu: string;
  mesaj: string;
  oncelik: string;
  durum: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  mesajlar?: { id: string; gonderen: string }[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  dusuk: { label: "Düşük", color: "text-white/40", bg: "bg-white/5" },
  normal: { label: "Normal", color: "text-blue-400", bg: "bg-blue-400/10" },
  yuksek: { label: "Yüksek", color: "text-amber-400", bg: "bg-amber-400/10" },
  acil: { label: "Acil", color: "text-red-400", bg: "bg-red-400/10" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  acik: { label: "Açık", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: Check },
  bekliyor: { label: "Bekliyor", color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
  kapali: { label: "Kapalı", color: "text-white/30", bg: "bg-white/5", icon: AlertCircle },
  cozumlendi: { label: "Çözümlendi", color: "text-blue-400", bg: "bg-blue-400/10", icon: Check },
};

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"hepsi" | "acik" | "bekliyor" | "kapali" | "cozumlendi">("hepsi");
  const [filterPriority, setFilterPriority] = useState<string>("hepsi");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/support`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTickets(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    const matchSearch = t.konu.toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.customerEmail || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "hepsi" || t.durum === filterStatus;
    const matchPriority = filterPriority === "hepsi" || t.oncelik === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  // "Bekliyor" = açık olan ve son mesajı müşteriden gelen (admin henüz yanıt vermemiş)
  function isPending(t: SupportTicket) {
    if (t.durum !== "acik" && t.durum !== "bekliyor") return false;
    const msgs = t.mesajlar ?? [];
    if (msgs.length === 0) return true;
    return msgs[msgs.length - 1].gonderen === "musteri";
  }

  const counts = {
    acik: tickets.filter((t) => t.durum === "acik" || t.durum === "bekliyor").length,
    bekliyor: tickets.filter(isPending).length,
    kapali: tickets.filter((t) => t.durum === "kapali").length,
    cozumlendi: tickets.filter((t) => t.durum === "cozumlendi").length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-white">Destek Talepleri</h1>
        <p className="text-sm text-white/30 mt-0.5">{tickets.length} toplam talep</p>
      </motion.div>

      {/* Özet kartlar */}
      <motion.div className="grid grid-cols-4 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        {(["acik", "bekliyor", "cozumlendi", "kapali"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "hepsi" : s)}
              className={cn("bg-[#161616] border rounded-2xl px-4 py-4 text-left transition-all cursor-pointer", filterStatus === s ? "border-white/20" : "border-white/[0.06] hover:border-white/10")}
            >
              <div className="flex items-center gap-2 mb-1">
                <cfg.icon size={12} className={cfg.color} />
                <p className="text-[10px] text-white/30">{cfg.label}</p>
              </div>
              <p className={cn("text-2xl font-bold", cfg.color)}>{counts[s]}</p>
            </button>
          );
        })}
      </motion.div>

      {/* Filtreler */}
      <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Konu, müşteri adı veya email..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {(["hepsi", "dusuk", "normal", "yuksek", "acil"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                filterPriority === p ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              {p === "hepsi" ? "Tümü" : PRIORITY_CONFIG[p]?.label ?? p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Liste */}
      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {loading ? (
          <div className="flex justify-center py-16"><svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-white/20"><HeadphonesIcon size={32} strokeWidth={1.2} /><p className="text-sm">Destek talebi bulunamadı</p></div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((ticket) => {
              const statusCfg = STATUS_CONFIG[ticket.durum] ?? STATUS_CONFIG.acik;
              const priorityCfg = PRIORITY_CONFIG[ticket.oncelik] ?? PRIORITY_CONFIG.normal;
              const msgCount = ticket.mesajlar?.length ?? 0;
              const lastMsg = ticket.mesajlar?.[ticket.mesajlar.length - 1];
              const hasNewFromCustomer = lastMsg?.gonderen === "musteri" && (ticket.durum === "acik" || ticket.durum === "bekliyor");

              return (
                <button
                  key={ticket.id}
                  onClick={() => router.push(`/admin/support/${ticket.id}`)}
                  className="w-full px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white/80 truncate">{ticket.konu}</p>
                        {hasNewFromCustomer && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <p className="text-xs text-white/30 mt-0.5 truncate">{ticket.customerName} · {ticket.customerEmail}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[10px] text-white/20">{formatDate(ticket.updatedAt || ticket.createdAt)}</p>
                        {msgCount > 0 && <p className="text-[10px] text-white/20">{msgCount} mesaj</p>}
                        <p className="text-[10px] text-white/20 font-mono">{ticket.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium", priorityCfg.color, priorityCfg.bg)}>{priorityCfg.label}</span>
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1", statusCfg.color, statusCfg.bg)}>
                        <statusCfg.icon size={8} />{statusCfg.label}
                      </span>
                      <ChevronRight size={14} className="text-white/20" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}