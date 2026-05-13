"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Search, X, Check, Upload, Trash2,
  Download, FileText, Clock, CheckCircle, AlertCircle, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  hizmetId?: string;
  hizmetAd?: string;
  notlar?: string;
  status: "bekliyor" | "devam" | "tamamlandi" | "iptal";
  total?: number;
  date: string;
}

interface Delivery {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
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

const TUR_OPTIONS = ["Logo", "Sosyal Medya Afişi", "Kartvizit", "Broşür", "Afiş", "Sunum", "Ambalaj", "Diğer"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"hepsi" | Order["status"]>("hepsi");
  const [selected, setSelected] = useState<Order | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAd, setUploadAd] = useState("");
  const [uploadAciklama, setUploadAciklama] = useState("");
  const [uploadTur, setUploadTur] = useState("Logo");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`${API}/api/orders`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      showToast("Siparişler yüklenemedi", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDeliveries(orderId: string) {
    setLoadingDeliveries(true);
    try {
      const res = await fetch(`${API}/api/deliveries/order/${orderId}`);
      const data = await res.json();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch {
      setDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  useEffect(() => { fetchOrders(); }, []);

  function openDetail(order: Order) {
    setSelected(order);
    setUploadFile(null);
    setUploadAd("");
    setUploadAciklama("");
    setUploadTur("Logo");
    fetchDeliveries(order.id);
  }

  function closeDetail() {
    setSelected(null);
    setDeliveries([]);
  }

  async function handleStatusChange(orderId: string, status: Order["status"]) {
    try {
      await fetch(`${API}/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      if (selected?.id === orderId) setSelected((prev) => prev ? { ...prev, status } : prev);
      showToast("Durum güncellendi");
    } catch {
      showToast("Güncelleme başarısız", "error");
    }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadAd.trim() || !selected) {
      showToast("Dosya ve ad zorunludur", "error");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("dosya", uploadFile);
      formData.append("orderId", selected.id);
      formData.append("customerId", selected.customerId);
      formData.append("customerName", selected.customerName || "");
      formData.append("ad", uploadAd.trim());
      formData.append("aciklama", uploadAciklama.trim());
      formData.append("tur", uploadTur);

      const res = await fetch(`${API}/api/deliveries`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      await fetchDeliveries(selected.id);
      setUploadFile(null);
      setUploadAd("");
      setUploadAciklama("");
      setUploadTur("Logo");
      showToast("Dosya teslim edildi");
    } catch {
      showToast("Yükleme başarısız", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDelivery(id: string) {
    try {
      await fetch(`${API}/api/deliveries/${id}`, { method: "DELETE" });
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
      showToast("Dosya silindi");
    } catch {
      showToast("Silme başarısız", "error");
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch = (o.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.hizmetAd || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "hepsi" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Siparişler</h1>
          <p className="text-sm text-white/30 mt-0.5">{orders.length} sipariş</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri, sipariş no veya hizmet..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 flex-wrap">
          {(["hepsi", "bekliyor", "devam", "tamamlandi", "iptal"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                filterStatus === s ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              {s === "hepsi" ? "Hepsi" : STATUS_CONFIG[s as Order["status"]]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-white/20">
            <ShoppingBag size={32} strokeWidth={1.2} />
            <p className="text-sm">Sipariş bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left text-white/30 font-medium px-5 py-3">Sipariş No</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Müşteri</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Hizmet</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Tarih</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Durum</th>
                  <th className="text-right text-white/30 font-medium px-5 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((o) => {
                  const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.bekliyor;
                  return (
                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-mono text-white/60 font-medium">{o.id}</td>
                      <td className="px-4 py-4 text-white/70">{o.customerName || "—"}</td>
                      <td className="px-4 py-4 text-white/50">{o.hizmetAd || "—"}</td>
                      <td className="px-4 py-4 text-white/40">{formatDate(o.date)}</td>
                      <td className="px-4 py-4">
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit", cfg.color, cfg.bg)}>
                          <cfg.icon size={9} />{cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openDetail(o)}
                          className="text-[10px] text-white/30 hover:text-white/70 border border-white/[0.06] hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Detay Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDetail}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-[#111] border-l border-white/[0.06] flex flex-col"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-base font-semibold text-white font-mono">{selected.id}</h2>
                  <p className="text-xs text-white/30 mt-0.5">{selected.customerName}</p>
                </div>
                <button onClick={closeDetail} className="text-white/30 hover:text-white/70 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Sipariş Bilgileri */}
                <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/30">Hizmet</span>
                    <span className="text-white/70">{selected.hizmetAd || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/30">Tarih</span>
                    <span className="text-white/70">{formatDate(selected.date)}</span>
                  </div>
                  {selected.notlar && (
                    <div className="flex justify-between text-xs gap-4">
                      <span className="text-white/30 shrink-0">Not</span>
                      <span className="text-white/60 text-right">{selected.notlar}</span>
                    </div>
                  )}
                </div>

                {/* Durum */}
                <div>
                  <p className="text-xs font-medium text-white/40 mb-2">Durum Güncelle</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(STATUS_CONFIG) as [Order["status"], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(selected.id, key)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                          selected.status === key
                            ? `${cfg.color} ${cfg.bg} border-white/10`
                            : "text-white/30 border-white/[0.06] hover:border-white/15 hover:text-white/60"
                        )}
                      >
                        <cfg.icon size={10} />{cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teslim Edilen Dosyalar */}
                <div>
                  <p className="text-xs font-medium text-white/40 mb-3">Teslim Edilen Dosyalar</p>
                  {loadingDeliveries ? (
                    <div className="flex justify-center py-6">
                      <svg className="animate-spin w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    </div>
                  ) : deliveries.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-white/20 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <Package size={24} strokeWidth={1.2} />
                      <p className="text-xs">Henüz dosya teslim edilmedi</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deliveries.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3">
                          <FileText size={16} className="text-white/30 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white/70 truncate">{d.ad}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{d.tur} · {formatSize(d.dosyaBoyut)} · {formatDate(d.createdAt)}</p>
                            {d.aciklama && <p className="text-[10px] text-white/25 mt-0.5 truncate">{d.aciklama}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={`${API}${d.dosyaUrl}`}
                              download={d.dosyaAd}
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                            >
                              <Download size={12} />
                            </a>
                            <button
                              onClick={() => handleDeleteDelivery(d.id)}
                              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-red-500/10 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dosya Teslim Et */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 space-y-4">
                  <p className="text-xs font-semibold text-white/60">Dosya Teslim Et</p>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors",
                      uploadFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.08] hover:border-white/20"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium truncate max-w-[200px]">{uploadFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                          className="text-white/30 hover:text-white/70 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload size={18} className="text-white/20" />
                        <p className="text-xs text-white/30">Dosya seçmek için tıklayın</p>
                        <p className="text-[10px] text-white/15">PDF, AI, PSD, PNG, ZIP — maks. 200MB</p>
                      </div>
                    )}
                  </div>

                  <input
                    value={uploadAd}
                    onChange={(e) => setUploadAd(e.target.value)}
                    placeholder="Dosya adı (örn: Logo Final v2)"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={uploadTur}
                      onChange={(e) => setUploadTur(e.target.value)}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 transition-colors cursor-pointer"
                    >
                      {TUR_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-[#1a1a1a]">{t}</option>
                      ))}
                    </select>
                    <input
                      value={uploadAciklama}
                      onChange={(e) => setUploadAciklama(e.target.value)}
                      placeholder="Açıklama (opsiyonel)"
                      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadFile || !uploadAd.trim()}
                    className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <><Upload size={14} /> Teslim Et</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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