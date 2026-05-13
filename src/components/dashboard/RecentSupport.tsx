"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  konu?: string;
  customerName?: string;
  oncelik?: string;
  durum?: string;
  createdAt?: string;
  subject?: string;
  customer?: string;
  priority?: string;
  status?: string;
  date?: string;
}

const priorityMap: Record<string, { label: string; color: string }> = {
  acil: { label: "Acil", color: "text-red-400 bg-red-400/10" },
  yuksek: { label: "Yüksek", color: "text-orange-400 bg-orange-400/10" },
  normal: { label: "Normal", color: "text-amber-400 bg-amber-400/10" },
  orta: { label: "Orta", color: "text-amber-400 bg-amber-400/10" },
  dusuk: { label: "Düşük", color: "text-emerald-400 bg-emerald-400/10" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function RecentSupport() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);

  useEffect(() => {
    api.dashboard.getRecentSupport().then((data) => setTickets(data as Ticket[])).catch(() => setTickets([]));
  }, []);

  return (
    <div className="bg-[#161616] rounded-xl border border-white/[0.06] px-5 py-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Destek Talepleri</h3>
        <Link href="/admin/support" className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer">
          Tümünü Gör
        </Link>
      </div>
      <div className="space-y-3">
        {tickets === null ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-white/20 py-10">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
            </svg>
            <span className="text-xs">Açık destek talebi yok</span>
          </div>
        ) : (
          tickets.map((ticket) => {
            const priorityKey = ticket.oncelik ?? ticket.priority ?? "";
            const p = priorityMap[priorityKey] ?? { label: priorityKey, color: "text-white/40 bg-white/5" };
            const subject = ticket.konu ?? ticket.subject ?? "—";
            const customer = ticket.customerName ?? ticket.customer ?? "—";
            const dateStr = ticket.createdAt ?? ticket.date ?? "";
            return (
              <div key={ticket.id} className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/75 font-medium truncate">{subject}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{customer}{dateStr ? ` · ${formatDate(dateStr)}` : ""}</p>
                </div>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0", p.color)}>
                  {p.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}