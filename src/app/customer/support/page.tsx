"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeadphonesIcon, Plus, X, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  konu: string;
  mesaj: string;
  oncelik: string;
  durum: string;
  createdAt: string;
  updatedAt: string;
  mesajlar?: { id: string }[];
}

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  dusuk: { color: "text-white/40", bg: "bg-white/5" },
  normal: { color: "text-blue-400", bg: "bg-blue-400/10" },
  yuksek: { color: "text-amber-400", bg: "bg-amber-400/10" },
  acil: { color: "text-red-400", bg: "bg-red-400/10" },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  acik: { color: "text-emerald-400", bg: "bg-emerald-400/10" },
  bekliyor: { color: "text-amber-400", bg: "bg-amber-400/10" },
  kapali: { color: "text-white/30", bg: "bg-white/5" },
  cozumlendi: { color: "text-blue-400", bg: "bg-blue-400/10" },
};

export default function CustomerSupportPage() {
  const { t, formatDate } = useTranslation();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [konu, setKonu] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [oncelik, setOncelik] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function authHeaders(extra?: Record<string, string>): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customer/support`, {
      credentials: "include",
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((d) => setTickets(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customer/support`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ konu, mesaj, oncelik }),
      });
      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) {
        setFormError((data.message as string) || `Hata ${res.status}: ${t("support.error")}`);
        return;
      }
      setTickets((prev) => [data as unknown as SupportTicket, ...prev]);
      setKonu(""); setMesaj(""); setOncelik("normal"); setShowForm(false);
      if (data.id) router.push(`/customer/support/${data.id}`);
    } catch {
      setFormError(t("support.error"));
    } finally {
      setSubmitting(false);
    }
  }

  const priorities = [
    { value: "dusuk", label: t("support.priority.dusuk") },
    { value: "normal", label: t("support.priority.normal") },
    { value: "yuksek", label: t("support.priority.yuksek") },
    { value: "acil", label: t("support.priority.acil") },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("support.title")}</h1>
          <p className="text-sm text-white/30 mt-0.5">{tickets.length} {t("support.subtitle")}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer">
          <Plus size={14} />{t("support.new")}
        </button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div className="bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">{t("support.form.title")}</h2>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">{t("support.subject")}</label>
                <input value={konu} onChange={(e) => setKonu(e.target.value)} placeholder={t("support.form.subjectPlaceholder")} required className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">{t("support.priority")}</label>
                <div className="flex gap-2 flex-wrap">
                  {priorities.map((p) => {
                    const cfg = PRIORITY_CONFIG[p.value] ?? PRIORITY_CONFIG.normal;
                    return (
                      <button key={p.value} type="button" onClick={() => setOncelik(p.value)} className={cn("px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer", oncelik === p.value ? `border-white/20 ${cfg.bg} ${cfg.color}` : "border-white/[0.06] text-white/30 hover:border-white/10 hover:text-white/50")}>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">{t("support.message")}</label>
                <textarea value={mesaj} onChange={(e) => setMesaj(e.target.value)} placeholder={t("support.form.messagePlaceholder")} required rows={4} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors resize-none" />
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">{t("common.cancel")}</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50">{submitting ? t("support.submitting") : t("support.submit")}</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {loading ? (
          <div className="flex justify-center py-16"><svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-white/20">
            <HeadphonesIcon size={32} strokeWidth={1.2} />
            <p className="text-sm">{t("support.empty")}</p>
            <button onClick={() => setShowForm(true)} className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2 cursor-pointer">{t("support.new")}</button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {tickets.map((ticket) => {
              const statusCfg = STATUS_CONFIG[ticket.durum] ?? STATUS_CONFIG.acik;
              const priorityCfg = PRIORITY_CONFIG[ticket.oncelik] ?? PRIORITY_CONFIG.normal;
              const msgCount = ticket.mesajlar?.length ?? 0;
              return (
                <button
                  key={ticket.id}
                  onClick={() => router.push(`/customer/support/${ticket.id}`)}
                  className="w-full px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{ticket.konu}</p>
                      <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{ticket.mesaj}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[10px] text-white/20">{formatDate(ticket.updatedAt || ticket.createdAt)}</p>
                        {msgCount > 0 && (
                          <p className="text-[10px] text-white/20">{msgCount} {t("support.subtitle")}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium", priorityCfg.color, priorityCfg.bg)}>
                        {priorities.find((p) => p.value === ticket.oncelik)?.label ?? ticket.oncelik}
                      </span>
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium", statusCfg.color, statusCfg.bg)}>
                        {ticket.durum === "acik" ? t("support.status.acik")
                          : ticket.durum === "kapali" ? t("support.status.kapali")
                          : ticket.durum === "cozumlendi" ? t("support.status.cozumlendi")
                          : t("support.status.bekliyor")}
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