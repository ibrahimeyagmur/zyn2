"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, HeadphonesIcon, ArrowRight, Check, Clock, AlertCircle, Ban } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  no: string;
  total: number;
  status: "bekliyor" | "odendi" | "gecikti" | "iptal";
  date: string;
}

interface Order { id: string; status: string; }
interface SupportTicket { id: string; konu: string; durum: string; createdAt: string; }
interface CustomerInfo { id: string; ad: string; email: string; balance: number; }

const STATUS_CONFIG = {
  bekliyor: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  odendi: { icon: Check, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  gecikti: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10" },
  iptal: { icon: Ban, color: "text-white/30", bg: "bg-white/5" },
};

export default function CustomerDashboardPage() {
  const { t, formatDate, formatCurrency } = useTranslation();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    const info = localStorage.getItem("customer_info");
    if (info) { try { setCustomer(JSON.parse(info)); } catch { /* ignore */ } }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customer/invoices`, { credentials: "include", headers: authHeaders() }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customer/orders`, { credentials: "include", headers: authHeaders() }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/customer/support`, { credentials: "include", headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([inv, ord, sup]) => {
        setInvoices(Array.isArray(inv) ? inv : []);
        setOrders(Array.isArray(ord) ? ord : []);
        setTickets(Array.isArray(sup) ? sup : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTickets = tickets.filter((tk) => tk.durum === "acik" || tk.durum === "bekliyor");

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-white">
          {t("dashboard.welcome")}{customer ? `, ${customer.ad.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-white/30 mt-0.5">{customer?.email}</p>
      </motion.div>

      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        {[
          { label: t("dashboard.balance"), value: formatCurrency(customer?.balance ?? 0), color: (customer?.balance ?? 0) > 0 ? "text-emerald-400" : "text-white/60" },
          { label: t("invoices.title"), value: invoices.length, color: "text-white" },
          { label: t("orders.title"), value: orders.length, color: "text-white" },
          { label: t("dashboard.openTickets"), value: openTickets.length, color: openTickets.length > 0 ? "text-amber-400" : "text-white/60" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#161616] border border-white/[0.06] rounded-2xl px-4 py-4">
            <p className="text-[10px] text-white/30 mb-1">{label}</p>
            <p className={cn("text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </motion.div>

      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><FileText size={14} className="text-white/30" />{t("dashboard.recentInvoices")}</h2>
          <Link href="/customer/invoices" className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">{t("dashboard.viewAll")} <ArrowRight size={12} /></Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><svg className="animate-spin w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>
        ) : invoices.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-white/20">{t("dashboard.noInvoices")}</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {invoices.slice(0, 3).map((inv) => {
              const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.bekliyor;
              return (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}><cfg.icon size={11} className={cfg.color} /></span>
                    <div>
                      <p className="text-xs font-medium text-white/70 font-mono">{inv.no}</p>
                      <p className="text-[10px] text-white/25">{formatDate(inv.date)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white/80">{formatCurrency(inv.total)}</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><HeadphonesIcon size={14} className="text-white/30" />{t("dashboard.openTickets")}</h2>
          <Link href="/customer/support" className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">{t("dashboard.viewAll")} <ArrowRight size={12} /></Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><svg className="animate-spin w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>
        ) : openTickets.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-white/20">{t("dashboard.noTickets")}</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {openTickets.slice(0, 3).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-xs font-medium text-white/70">{ticket.konu}</p>
                  <p className="text-[10px] text-white/25">{formatDate(ticket.createdAt)}</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">
                  {ticket.durum === "acik" ? t("support.status.acik") : t("support.status.bekliyor")}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}