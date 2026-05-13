"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  // Gerçek alan adları
  customerName?: string;
  hizmetAd?: string;
  total?: number;
  status: string;
  date: string;
  // Eski alan adları (fallback)
  customer?: string;
  service?: string;
  amount?: number;
}

const statusMap: Record<string, { label: string; color: string }> = {
  devam: { label: "Devam Ediyor", color: "text-blue-400 bg-blue-400/10" },
  bekliyor: { label: "Bekliyor", color: "text-amber-400 bg-amber-400/10" },
  tamamlandi: { label: "Tamamlandı", color: "text-emerald-400 bg-emerald-400/10" },
  iptal: { label: "İptal", color: "text-red-400 bg-red-400/10" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function RecentActivity() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api.dashboard.getRecentOrders().then((data) => setOrders(data as Order[])).catch(() => setOrders([]));
  }, []);

  return (
    <div className="bg-[#161616] rounded-xl border border-white/[0.06] px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Son Siparişler</h3>
        <Link href="/admin/orders" className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer">
          Tümünü Gör
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left text-white/30 font-medium pb-2 pr-4">Müşteri</th>
              <th className="text-left text-white/30 font-medium pb-2 pr-4">Hizmet</th>
              <th className="text-left text-white/30 font-medium pb-2 pr-4">Durum</th>
              <th className="text-right text-white/30 font-medium pb-2">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {orders === null ? (
              <tr>
                <td colSpan={4} className="py-8 text-center">
                  <div className="flex flex-col items-center gap-2 text-white/20">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-white/20">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-xs">Henüz sipariş yok</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const s = statusMap[order.status] ?? { label: order.status, color: "text-white/40 bg-white/5" };
                const customerLabel = order.customerName ?? order.customer ?? "—";
                const serviceLabel = order.hizmetAd ?? order.service ?? "—";
                const amountVal = order.total ?? order.amount ?? 0;
                return (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pr-4">
                      <p className="text-white/80 font-medium truncate max-w-[120px]">{customerLabel}</p>
                      <p className="text-white/30 text-[10px]">{formatDate(order.date)}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-white/60 truncate max-w-[140px]">{serviceLabel}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap", s.color)}>
                        {s.label}
                      </span>
                    </td>
                    <td className="py-4 text-right text-white/70 font-medium whitespace-nowrap">
                      {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amountVal)} ₺
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}