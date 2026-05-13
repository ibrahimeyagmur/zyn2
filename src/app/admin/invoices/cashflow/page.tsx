"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, Plus, Trash2, X,
  ArrowUpRight, ArrowDownRight, BadgePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface CashflowEntry {
  id: string;
  type: "gelir" | "gider";
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface CashflowData {
  totalIncome: number;
  totalExpense: number;
  net: number;
  months: { month: string; gelir: number; gider: number }[];
  entries: CashflowEntry[];
}

type EntryForm = {
  type: "gelir" | "gider";
  amount: string;
  category: string;
  description: string;
  date: string;
};

const GELIR_CATS = ["Hizmet Geliri", "Ürün Geliri", "Danışmanlık", "Diğer Gelir"];
const GIDER_CATS = ["Kira", "Maaş", "Vergi", "Yazılım/Araç", "Pazarlama", "Diğer Gider"];

const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Özel Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] text-white/40 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className={cn("w-2 h-2 rounded-full", p.name === "gelir" ? "bg-emerald-400" : "bg-red-400")} />
          <span className="text-white/50">{p.name === "gelir" ? "Gelir" : "Gider"}:</span>
          <span className="text-white font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── İşlem Ekleme Dialog ──────────────────────────────────────────────────────
function AddEntryDialog({ onClose, onAdded }: {
  onClose: () => void;
  onAdded: (entry: CashflowEntry) => void;
}) {
  const [form, setForm] = useState<EntryForm>({
    type: "gelir", amount: "", category: GELIR_CATS[0],
    description: "", date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { success, error: toastError } = useToast();

  function set<K extends keyof EntryForm>(key: K, value: EntryForm[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "type") next.category = value === "gelir" ? GELIR_CATS[0] : GIDER_CATS[0];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Geçerli bir tutar girin"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/invoices/cashflow/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Hata"); return; }
      onAdded(data as CashflowEntry);
      success("İşlem eklendi", `${form.type === "gelir" ? "Gelir" : "Gider"}: ${formatCurrency(parseFloat(form.amount))}`);
      onClose();
    } catch {
      toastError("Hata", "Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }

  const cats = form.type === "gelir" ? GELIR_CATS : GIDER_CATS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-[#161616] border border-white/[0.08] rounded-2xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">İşlem Ekle</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tip */}
          <div>
            <label className="text-xs font-medium text-white/40 mb-2 block">İşlem Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              {(["gelir", "gider"] as const).map((t) => (
                <button key={t} type="button" onClick={() => set("type", t)}
                  className={cn("flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                    form.type === t
                      ? t === "gelir" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"
                      : "border-white/[0.06] text-white/30 hover:border-white/10"
                  )}>
                  {t === "gelir" ? <><TrendingUp size={13} /> Gelir</> : <><TrendingDown size={13} /> Gider</>}
                </button>
              ))}
            </div>
          </div>

          {/* Tutar */}
          <div>
            <label className="text-xs font-medium text-white/40 mb-1.5 block">Tutar (₺) *</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.amount}
              onChange={(e) => set("amount", e.target.value)} placeholder="0.00" required />
          </div>

          {/* Kategori */}
          <div>
            <label className="text-xs font-medium text-white/40 mb-1.5 block">Kategori</label>
            <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Açıklama */}
          <div>
            <label className="text-xs font-medium text-white/40 mb-1.5 block">Açıklama</label>
            <input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="İşlem açıklaması..." />
          </div>

          {/* Tarih */}
          <div>
            <label className="text-xs font-medium text-white/40 mb-1.5 block">Tarih</label>
            <input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">İptal</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50">
              {loading ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function CashflowPage() {
  const { error: toastError } = useToast();
  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState<"hepsi" | "gelir" | "gider">("hepsi");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/invoices/cashflow`)
      .then((r) => r.json())
      .then((d) => setData(d as CashflowData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleAdded(entry: CashflowEntry) {
    setData((prev) => {
      if (!prev) return prev;
      const entries = [entry, ...prev.entries];
      const totalIncome = prev.totalIncome + (entry.type === "gelir" ? entry.amount : 0);
      const totalExpense = prev.totalExpense + (entry.type === "gider" ? entry.amount : 0);
      return { ...prev, entries, totalIncome, totalExpense, net: totalIncome - totalExpense };
    });
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr"}/api/invoices/cashflow/entries/${id}`, { method: "DELETE" });
      setData((prev) => {
        if (!prev) return prev;
        const removed = prev.entries.find((e) => e.id === id);
        const entries = prev.entries.filter((e) => e.id !== id);
        const totalIncome = prev.totalIncome - (removed?.type === "gelir" ? removed.amount : 0);
        const totalExpense = prev.totalExpense - (removed?.type === "gider" ? removed.amount : 0);
        return { ...prev, entries, totalIncome, totalExpense, net: totalIncome - totalExpense };
      });
    } catch {
      toastError("Hata", "Silme başarısız");
    }
  }

  const filteredEntries = (data?.entries ?? []).filter((e) =>
    filterType === "hepsi" || e.type === filterType
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Başlık */}
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white">Kasa Durumu</h1>
          <p className="text-sm text-white/30 mt-0.5">Gelir, gider ve nakit akışı</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer"
        >
          <Plus size={15} />İşlem Ekle
        </button>
      </motion.div>

      {/* Özet kartlar */}
      <motion.div className="grid grid-cols-3 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40">Toplam Gelir</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data?.totalIncome ?? 0)}</p>
          <p className="text-[10px] text-white/25 mt-1">Fatura gelirleri dahil</p>
        </div>
        <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40">Toplam Gider</p>
            <div className="w-8 h-8 rounded-xl bg-red-400/10 flex items-center justify-center">
              <TrendingDown size={14} className="text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(data?.totalExpense ?? 0)}</p>
          <p className="text-[10px] text-white/25 mt-1">Manuel giderler</p>
        </div>
        <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40">Net Bakiye</p>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", (data?.net ?? 0) >= 0 ? "bg-blue-400/10" : "bg-red-400/10")}>
              <Wallet size={14} className={(data?.net ?? 0) >= 0 ? "text-blue-400" : "text-red-400"} />
            </div>
          </div>
          <p className={cn("text-2xl font-bold", (data?.net ?? 0) >= 0 ? "text-blue-400" : "text-red-400")}>
            {formatCurrency(data?.net ?? 0)}
          </p>
          <p className="text-[10px] text-white/25 mt-1">Gelir − Gider</p>
        </div>
      </motion.div>

      {/* Grafik */}
      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Son 6 Ay</h3>
          <div className="flex items-center gap-4 text-[10px] text-white/40">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Gelir</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Gider</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data?.months ?? []} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="gelir" fill="rgba(52,211,153,0.7)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gider" fill="rgba(248,113,113,0.7)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* İşlem listesi */}
      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">İşlemler</h3>
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
            {(["hepsi", "gelir", "gider"] as const).map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  filterType === t ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
                )}>
                {t === "hepsi" ? "Hepsi" : t === "gelir" ? "Gelir" : "Gider"}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-white/20">
            <Wallet size={32} strokeWidth={1.2} />
            <p className="text-sm">Henüz işlem yok</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredEntries.map((entry) => {
              const isBalanceTopup = entry.category === "Bakiye Ekleme Geliri";
              return (
                <div key={entry.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    isBalanceTopup
                      ? "bg-blue-400/10"
                      : entry.type === "gelir" ? "bg-emerald-400/10" : "bg-red-400/10"
                  )}>
                    {isBalanceTopup
                      ? <BadgePlus size={14} className="text-blue-400" />
                      : entry.type === "gelir"
                        ? <ArrowUpRight size={14} className="text-emerald-400" />
                        : <ArrowDownRight size={14} className="text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-white/80 truncate">{entry.description || entry.category}</p>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full shrink-0",
                        isBalanceTopup
                          ? "bg-blue-400/10 text-blue-400/70"
                          : "bg-white/[0.05] text-white/30"
                      )}>
                        {entry.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5">{formatDate(entry.date)}</p>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold shrink-0",
                    isBalanceTopup
                      ? "text-blue-400"
                      : entry.type === "gelir" ? "text-emerald-400" : "text-red-400"
                  )}>
                    {entry.type === "gelir" ? "+" : "−"}{formatCurrency(entry.amount)}
                  </p>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-white/0 group-hover:text-white/25 hover:!text-red-400 transition-colors cursor-pointer p-1 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {showAdd && <AddEntryDialog onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
    </div>
  );
}