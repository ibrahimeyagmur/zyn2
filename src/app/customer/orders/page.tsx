"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, X, Download, FileText, Clock,
  CheckCircle, AlertCircle, Package, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  hizmetAd?: string;
  notlar?: string;
  status: "bekliyor" | "devam" | "tamamlandi" | "iptal";
  total?: number;
  date: string;
}

interface Delivery {
  id: string;
  orderId: string;
  ad: string;
  aciklama: string;
  tur: string;
  dosyaUrl: string;
  dosyaAd: string;
  dosyaBoyut: number;
  dosyaTip: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  bekliyor: { label: "Bekliyor", color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
  devam: { label: "Devam Ediyor", color: "text-blue-400", bg: "bg-blue-400/10", icon: AlertCircle },
  tamamlandi: { label: "Tamamlandı", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle },
  iptal: { label: "İptal", color: "text-white/30", bg: "bg-white/5", icon: X },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(n);
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveriesMap, setDeliveriesMap] = useState<Record<string, Delivery[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState<string | null>(null);

  function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    const infoRaw = typeof window !== "undefined" ? localStorage.getItem("customer_info") : null;
    const info = infoRaw ? JSON.parse(infoRaw) : {};
    if (!info.id) { setLoading(false); return; }

    fetch(`${API}/api/orders`, { credentials: "include", headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        setOrders(all.filter((o: Order) => o.customerId === info.id));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  async function toggleExpand(orderId: string) {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    if (deliveriesMap[orderId]) return;
    setLoadingDeliveries(orderId);
    try {
      const res = await fetch(`${API}/api/deliveries/order/${orderId}`, { credentials: "include", headers: authHeaders() });
      const data = await res.json();
      setDeliveriesMap((prev) => ({ ...prev, [orderId]: Array.isArray(data) ? data : [] }));
    } catch {
      setDeliveriesMap((prev) => ({ ...prev, [orderId]: [] }));
    } finally {
      setLoadingDeliveries(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Siparişlerim</h1>
        <p className="text-sm text-white/30 mt-0.5">{orders.length} sipariş</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/20">
          <ShoppingBag size={32} strokeWidth={1.2} />
          <p className="text-sm">Henüz sipariş yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.bekliyor;
            const isExpanded = expanded === o.id;
            const deliveries = deliveriesMap[o.id] || [];
            const isLoadingDlv = loadingDeliveries === o.id;

            return (
              <motion.div
                key={o.id}
                className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              >
                {/* Sipariş satırı */}
                <button
                  onClick={() => toggleExpand(o.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white/80">{o.hizmetAd || "Sipariş"}</span>
                      <span className="font-mono text-[10px] text-white/25">{o.id}</span>
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{formatDate(o.date)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {o.total && (
                      <span className="text-sm font-semibold text-white/60">{formatCurrency(o.total)}</span>
                    )}
                    <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1", cfg.color, cfg.bg)}>
                      <cfg.icon size={9} />{cfg.label}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-white/25" /> : <ChevronDown size={14} className="text-white/25" />}
                  </div>
                </button>

                {/* Genişletilmiş içerik */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-white/[0.04] space-y-4">
                        {o.notlar && (
                          <div className="bg-white/[0.02] rounded-xl px-4 py-3">
                            <p className="text-[10px] text-white/30 mb-1">Notlar</p>
                            <p className="text-xs text-white/50">{o.notlar}</p>
                          </div>
                        )}

                        {/* Teslim edilen dosyalar */}
                        <div>
                          <p className="text-xs font-medium text-white/30 mb-2">Teslim Edilen Dosyalar</p>
                          {isLoadingDlv ? (
                            <div className="flex justify-center py-4">
                              <svg className="animate-spin w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            </div>
                          ) : deliveries.length === 0 ? (
                            <div className="flex items-center gap-2 py-3 text-white/20">
                              <Package size={16} strokeWidth={1.2} />
                              <p className="text-xs">Henüz dosya teslim edilmedi</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {deliveries.map((d) => (
                                <div key={d.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3">
                                  <FileText size={15} className="text-white/30 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white/70 truncate">{d.ad}</p>
                                    <p className="text-[10px] text-white/30 mt-0.5">{d.tur} · {formatSize(d.dosyaBoyut)}</p>
                                    {d.aciklama && <p className="text-[10px] text-white/25 mt-0.5 truncate">{d.aciklama}</p>}
                                  </div>
                                  <a
                                    href={`${API}${d.dosyaUrl}`}
                                    download={d.dosyaAd}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white text-xs font-medium transition-colors shrink-0"
                                  >
                                    <Download size={11} /> İndir
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}