"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Plus, Search, FileText, X, Check, Clock, Ban, AlertCircle,
  Trash2, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr";

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  vatRate: number;
}

interface Invoice {
  id: string;
  no: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  items: InvoiceItem[];
  subtotal: number;
  vatTotal: number;
  total: number;
  status: "bekliyor" | "odendi" | "iptal" | "gecikti";
  invoiceType?: "kurumsal" | "bireysel";
  dueDate: string | null;
  notes: string;
  date: string;
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CONFIG = {
  bekliyor: { label: "Bekliyor", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  odendi: { label: "Ödendi", icon: Check, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  iptal: { label: "İptal", icon: Ban, color: "text-white/30", bg: "bg-white/5" },
  gecikti: { label: "Gecikti", icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10" },
};

// ─── Silme Onay Dialog ────────────────────────────────────────────────────────
function DeleteInvoiceDialog({ invoice, onConfirm, onClose }: {
  invoice: Invoice;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-[#161616] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      >
        <h3 className="text-sm font-semibold text-white mb-2">Faturayı Sil</h3>
        <p className="text-xs text-white/40 mb-5">
          <span className="text-white/70 font-medium font-mono">{invoice.no}</span> numaralı{" "}
          <span className="text-white/70 font-medium">{invoice.customerName}</span> faturasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">İptal</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500/90 text-white text-sm font-semibold hover:bg-red-500 transition-colors cursor-pointer">Sil</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Detay Drawer ─────────────────────────────────────────────────────────────
function InvoiceDrawer({ invoice, onClose, onStatusChange, onRequestDelete, changingRef }: {
  invoice: Invoice;
  onClose: () => void;
  onStatusChange: (id: string, status: Invoice["status"]) => void;
  onRequestDelete: (inv: Invoice) => void;
  changingRef: React.MutableRefObject<boolean>;
}) {
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    setPendingStatus(null);
    changingRef.current = false;
  }, [invoice.id]);

  async function changeStatus(status: Invoice["status"]) {
    if (changingRef.current || invoice.status === status) return;
    changingRef.current = true;
    setPendingStatus(status);
    try {
      const res = await fetch(`${API}/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      let data: unknown = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) {
        toastError("Hata", (data as { message?: string }).message || "Durum güncellenemedi");
        setPendingStatus(null);
        changingRef.current = false;
        return;
      }
      onStatusChange(invoice.id, status);
      success("Durum güncellendi", STATUS_CONFIG[status].label);
      setPendingStatus(null);
      changingRef.current = false;
    } catch (err) {
      console.error("changeStatus error:", err);
      setPendingStatus(null);
      changingRef.current = false;
      toastError("Hata", "Sunucuya bağlanılamadı");
    }
  }

  const cfg = STATUS_CONFIG[invoice.status];

  return (
    <motion.div
      className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-[#111] border-l border-white/[0.06] flex flex-col"
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white font-mono">{invoice.no}</h2>
            <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1", cfg.color, cfg.bg)}>
              <cfg.icon size={9} />{cfg.label}
            </span>
          </div>
          <p className="text-xs text-white/30 mt-0.5">{invoice.customerName}</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] text-white/30 mb-1">Müşteri</p>
            <p className="text-xs font-medium text-white">{invoice.customerName}</p>
            {invoice.customerEmail && <p className="text-[10px] text-white/30 mt-0.5">{invoice.customerEmail}</p>}
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] text-white/30 mb-1">Tarihler</p>
            <p className="text-xs text-white">{formatDate(invoice.date)}</p>
            {invoice.dueDate && <p className="text-[10px] text-white/30 mt-0.5">Vade: {formatDate(invoice.dueDate)}</p>}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-white/40 mb-2">Kalemler</p>
          <div className="bg-white/[0.03] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left text-white/30 font-medium px-4 py-2.5">Ürün/Hizmet</th>
                  <th className="text-right text-white/30 font-medium px-3 py-2.5">Adet</th>
                  <th className="text-right text-white/30 font-medium px-3 py-2.5">Birim</th>
                  <th className="text-right text-white/30 font-medium px-4 py-2.5">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5">
                      <p className="text-white/80">{item.name}</p>
                      {item.vatRate > 0 && <p className="text-[10px] text-white/25">KDV %{item.vatRate}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-white/50">{item.qty}</td>
                    <td className="px-3 py-2.5 text-right text-white/50">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right text-white/80">{formatCurrency(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs text-white/50">
            <span>Ara Toplam</span><span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>KDV</span><span>{formatCurrency(invoice.vatTotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-white border-t border-white/[0.06] pt-2 mt-2">
            <span>Genel Toplam</span><span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] text-white/30 mb-1">Notlar</p>
            <p className="text-xs text-white/60">{invoice.notes}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-white/40 mb-2">Durum Güncelle</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(STATUS_CONFIG) as [Invoice["status"], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, c]) => (
              <button
                key={key}
                onClick={() => changeStatus(key)}
                disabled={!!pendingStatus || invoice.status === key}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer disabled:opacity-40",
                  invoice.status === key
                    ? `border-white/15 ${c.bg} ${c.color}`
                    : "border-white/[0.06] text-white/30 hover:border-white/10 hover:text-white/60"
                )}
              >
                <c.icon size={12} />{c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
        <button
          onClick={() => onRequestDelete(invoice)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 size={13} />Sil
        </button>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/60 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer">Kapat</button>
      </div>
    </motion.div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const router = useRouter();
  const { success: _success, error: toastError } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<{ id: string; ad: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"hepsi" | Invoice["status"]>("hepsi");
  const [filterType, setFilterType] = useState<"hepsi" | "kurumsal" | "bireysel">("hepsi");
  const [filterCustomer, setFilterCustomer] = useState<string>("hepsi");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const statusChangingRef = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/invoices`).then((r) => r.json()),
      fetch(`${API}/api/customers`).then((r) => r.json()),
    ]).then(([inv, cust]) => {
      setInvoices(inv as Invoice[]);
      setCustomers((cust as { id: string; ad: string }[]).map((c) => ({ id: c.id, ad: c.ad })));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function handleStatusChange(id: string, status: Invoice["status"]) {
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    if (selectedInvoice?.id === id) setSelectedInvoice((p) => p ? { ...p, status } : p);
  }

  async function confirmDelete(inv: Invoice) {
    setDeleteTarget(null);
    setSelectedInvoice(null);
    try {
      await fetch(`${API}/api/invoices/${inv.id}`, { method: "DELETE" });
      setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
      toastError("Fatura silindi", "");
    } catch {
      toastError("Hata", "Silme başarısız");
    }
  }

  const filtered = invoices.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = i.no.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q);
    const matchStatus = filterStatus === "hepsi" || i.status === filterStatus;
    const matchType = filterType === "hepsi" || i.invoiceType === filterType;
    const matchCustomer = filterCustomer === "hepsi" || i.customerId === filterCustomer;
    return matchSearch && matchStatus && matchType && matchCustomer;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "odendi").reduce((s, i) => s + i.total, 0),
    pending: invoices.filter((i) => i.status === "bekliyor").reduce((s, i) => s + i.total, 0),
    overdue: invoices.filter((i) => i.status === "gecikti").length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Başlık */}
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white">Faturalar</h1>
          <p className="text-sm text-white/30 mt-0.5">{invoices.length} fatura kayıtlı</p>
        </div>
        <button
          onClick={() => router.push("/admin/invoices/new")}
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer"
        >
          <Plus size={15} />Yeni Fatura
        </button>
      </motion.div>

      {/* İstatistikler */}
      <motion.div className="grid grid-cols-4 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        {[
          { label: "Toplam Fatura", value: stats.total, color: "text-white" },
          { label: "Tahsil Edilen", value: formatCurrency(stats.paid), color: "text-emerald-400" },
          { label: "Bekleyen", value: formatCurrency(stats.pending), color: "text-amber-400" },
          { label: "Gecikmiş", value: stats.overdue, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#161616] border border-white/[0.06] rounded-2xl px-5 py-4">
            <p className="text-[10px] text-white/30 mb-1">{label}</p>
            <p className={cn("text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </motion.div>

      {/* Filtreler */}
      <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Fatura no veya müşteri ara..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors" />
          </div>
          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/15 transition-colors cursor-pointer"
          >
            <option value="hepsi">Tüm Müşteriler</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
            {(["hepsi", "bekliyor", "odendi", "gecikti", "iptal"] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  filterStatus === s ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
                )}>
                {s === "hepsi" ? "Hepsi" : STATUS_CONFIG[s as Invoice["status"]]?.label ?? s}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
            {(["hepsi", "kurumsal", "bireysel"] as const).map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  filterType === t
                    ? t === "kurumsal" ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white"
                    : "text-white/35 hover:text-white/60"
                )}>
                {t === "hepsi" ? "Tüm Tipler" : t === "kurumsal" ? "Kurumsal" : "Bireysel"}
              </button>
            ))}
          </div>
          <span className="text-xs text-white/25">{filtered.length} sonuç</span>
        </div>
      </motion.div>

      {/* Tablo */}
      <motion.div className="bg-[#161616] rounded-xl border border-white/[0.06] overflow-hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-white/20">
            <FileText size={36} strokeWidth={1.2} />
            <p className="text-sm">{search || filterStatus !== "hepsi" ? "Sonuç bulunamadı" : "Henüz fatura yok"}</p>
            {!search && filterStatus === "hepsi" && (
              <button onClick={() => router.push("/admin/invoices/new")} className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2 cursor-pointer">İlk faturayı oluştur</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="w-1 py-3"></th>
                  <th className="text-left text-white/30 font-medium px-5 py-3">Fatura No</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Müşteri</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Tarih</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Vade</th>
                  <th className="text-right text-white/30 font-medium px-4 py-3">Tutar</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Durum</th>
                  <th className="text-right text-white/30 font-medium px-5 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((inv) => {
                  const c = STATUS_CONFIG[inv.status];
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pl-0 pr-0 w-0.5">
                        <div className={cn("w-0.5 h-8 rounded-full mx-auto",
                          inv.invoiceType === "kurumsal" ? "bg-blue-500/50" :
                          inv.invoiceType === "bireysel" ? "bg-white/15" : "bg-transparent"
                        )} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-white/70 font-medium">{inv.no}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-white/80 font-medium">{inv.customerName}</p>
                          {inv.invoiceType && (
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
                              inv.invoiceType === "kurumsal"
                                ? "text-blue-400/80 bg-blue-400/10"
                                : "text-white/30 bg-white/[0.05]"
                            )}>
                              {inv.invoiceType === "kurumsal" ? "Kurumsal" : "Bireysel"}
                            </span>
                          )}
                        </div>
                        {inv.customerEmail && <p className="text-white/30 text-[10px] mt-0.5">{inv.customerEmail}</p>}
                      </td>
                      <td className="px-4 py-4 text-white/50">{formatDate(inv.date)}</td>
                      <td className="px-4 py-4 text-white/40">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                      <td className="px-4 py-4 text-right font-medium text-white/80">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-4">
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit", c.color, c.bg)}>
                          <c.icon size={9} />{c.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedInvoice(inv)} className="text-white/25 hover:text-white/70 transition-colors cursor-pointer p-1">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(inv)} className="text-white/25 hover:text-red-400 transition-colors cursor-pointer p-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
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
        {selectedInvoice && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInvoice(null)} />
            <InvoiceDrawer
              invoice={selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
              onStatusChange={handleStatusChange}
              onRequestDelete={(inv) => setDeleteTarget(inv)}
              changingRef={statusChangingRef}
            />
          </>
        )}
      </AnimatePresence>

      {/* Silme Onay Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteInvoiceDialog
            invoice={deleteTarget}
            onConfirm={() => confirmDelete(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}