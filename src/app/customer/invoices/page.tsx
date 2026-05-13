"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Check, Clock, AlertCircle, Ban } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  no: string;
  total: number;
  subtotal: number;
  vatTotal: number;
  status: "bekliyor" | "odendi" | "gecikti" | "iptal";
  invoiceType?: "kurumsal" | "bireysel";
  date: string;
  dueDate?: string | null;
  notes?: string;
  items?: { id: string; name: string; qty: number; unitPrice: number; vatRate: number }[];
}

const STATUS_CONFIG = {
  bekliyor: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", key: "invoices.status.bekliyor" as const },
  odendi: { icon: Check, color: "text-emerald-400", bg: "bg-emerald-400/10", key: "invoices.status.odendi" as const },
  gecikti: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10", key: "invoices.status.gecikti" as const },
  iptal: { icon: Ban, color: "text-white/30", bg: "bg-white/5", key: "invoices.status.iptal" as const },
};

export default function CustomerInvoicesPage() {
  const { t, formatDate, formatCurrency } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"hepsi" | Invoice["status"]>("hepsi");
  const [selected, setSelected] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/customer/invoices`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInvoices(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter((i) => {
    const matchSearch = i.no.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "hepsi" || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-white">{t("invoices.title")}</h1>
        <p className="text-sm text-white/30 mt-0.5">{invoices.length} {t("invoices.subtitle")}</p>
      </motion.div>

      <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("invoices.search")}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {(["hepsi", "bekliyor", "odendi", "gecikti", "iptal"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                filterStatus === s ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              {s === "hepsi" ? t("invoices.filter.all") : t(STATUS_CONFIG[s as Invoice["status"]].key)}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {loading ? (
          <div className="flex justify-center py-16"><svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-white/20"><FileText size={32} strokeWidth={1.2} /><p className="text-sm">{t("invoices.empty")}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left text-white/30 font-medium px-5 py-3">{t("invoices.no")}</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">{t("invoices.date")}</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">{t("invoices.due")}</th>
                  <th className="text-right text-white/30 font-medium px-4 py-3">{t("invoices.amount")}</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">{t("invoices.status")}</th>
                  <th className="text-left text-white/30 font-medium px-5 py-3">{t("invoices.type")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.bekliyor;
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelected(inv)}>
                      <td className="px-5 py-4 font-mono text-white/70 font-medium">{inv.no}</td>
                      <td className="px-4 py-4 text-white/50">{formatDate(inv.date)}</td>
                      <td className="px-4 py-4 text-white/40">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                      <td className="px-4 py-4 text-right font-semibold text-white/80">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-4">
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit", cfg.color, cfg.bg)}>
                          <cfg.icon size={9} />{t(cfg.key)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {inv.invoiceType && (
                          <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium",
                            inv.invoiceType === "kurumsal" ? "text-blue-400/80 bg-blue-400/10" : "text-white/30 bg-white/[0.05]"
                          )}>
                            {t(inv.invoiceType === "kurumsal" ? "invoices.type.kurumsal" : "invoices.type.bireysel")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <motion.div className="relative bg-[#161616] border border-white/[0.08] rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono">{selected.no}</h3>
                <p className="text-[10px] text-white/30 mt-0.5">{formatDate(selected.date)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/70 cursor-pointer text-lg leading-none">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {selected.items && selected.items.length > 0 && (
                <div className="bg-white/[0.03] rounded-xl overflow-hidden">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div>
                        <p className="text-xs text-white/70">{item.name}</p>
                        <p className="text-[10px] text-white/25">{item.qty} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <p className="text-xs font-medium text-white/60">{formatCurrency(item.qty * item.unitPrice)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-white/40"><span>Ara Toplam</span><span>{formatCurrency(selected.subtotal ?? 0)}</span></div>
                <div className="flex justify-between text-xs text-white/40"><span>KDV</span><span>{formatCurrency(selected.vatTotal ?? 0)}</span></div>
                <div className="flex justify-between text-sm font-bold text-white border-t border-white/[0.06] pt-2"><span>{t("invoices.amount")}</span><span>{formatCurrency(selected.total)}</span></div>
              </div>
              {selected.notes && (
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <p className="text-[10px] text-white/30 mb-1">Not</p>
                  <p className="text-xs text-white/50">{selected.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}