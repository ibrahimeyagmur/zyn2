"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface Customer {
  id: string;
  ad: string;
  email: string;
  sirket?: string;
}

interface LineItem {
  id: string;
  name: string;
  qty: string;
  unitPrice: string;
  vatRate: 0 | 20;
}

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors";

function newLine(): LineItem {
  return { id: `line-${Date.now()}-${Math.random()}`, name: "", qty: "1", unitPrice: "", vatRate: 0 };
}

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(n);
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function NewInvoicePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [invoiceType, setInvoiceType] = useState<"kurumsal" | "bireysel">("bireysel");
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/customers`)
      .then((r) => r.json())
      .then((d) => setCustomers(d as Customer[]))
      .catch(console.error);
  }, []);

  // Tip değişince KDV oranlarını güncelle
  function handleTypeChange(type: "kurumsal" | "bireysel") {
    setInvoiceType(type);
    setLines((prev) =>
      prev.map((l) => ({ ...l, vatRate: type === "bireysel" ? 0 : 20 }))
    );
  }

  // ─── Hesaplamalar ──────────────────────────────────────────────────────────
  const computed = lines.map((l) => {
    const qty = parseFloat(l.qty) || 0;
    const unit = parseFloat(l.unitPrice) || 0;
    const lineTotal = qty * unit;
    const vat = lineTotal * (l.vatRate / 100);
    return { lineTotal, vat, total: lineTotal + vat };
  });
  const subtotal = computed.reduce((s, c) => s + c.lineTotal, 0);
  const vatTotal = computed.reduce((s, c) => s + c.vat, 0);
  const total = subtotal + vatTotal;

  // ─── Satır işlemleri ──────────────────────────────────────────────────────
  function updateLine(id: string, key: keyof LineItem, value: string | number) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
  }

  // ─── Kaydet ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) { toastError("Hata", "Müşteri seçin"); return; }
    if (lines.some((l) => !l.name.trim() || !l.unitPrice)) { toastError("Hata", "Tüm kalemleri doldurun"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.ad,
          customerEmail: selectedCustomer.email,
          invoiceType,
          items: lines.map((l) => ({
            id: l.id,
            name: l.name,
            qty: parseFloat(l.qty) || 1,
            unitPrice: parseFloat(l.unitPrice) || 0,
            vatRate: l.vatRate,
          })),
          subtotal,
          vatTotal,
          total,
          dueDate: dueDate || null,
          notes,
        }),
      });
      if (!res.ok) { toastError("Hata", "Fatura oluşturulamadı"); return; }
      success("Fatura oluşturuldu", `${selectedCustomer.ad} için fatura kaydedildi`);
      router.push("/admin/invoices");
    } catch {
      toastError("Hata", "Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return c.ad.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Başlık ── */}
        <motion.div className="flex items-center gap-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/80 hover:border-white/15 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">Yeni Fatura</h1>
            <p className="text-sm text-white/30 mt-0.5">Fatura bilgilerini doldurun ve kaydedin</p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-5 gap-6">

            {/* ── Sol: Müşteri + Fatura Tipi + Kalemler ── */}
            <div className="col-span-3 space-y-5">

              {/* Müşteri Seçimi */}
              <motion.section
                className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              >
                <h3 className="text-sm font-semibold text-white mb-4">Müşteri</h3>
                <div className="relative">
                  <input
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowDropdown(true); setSelectedCustomer(null); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Müşteri adı veya e-posta ara..."
                    className={inputCls}
                  />
                  <AnimatePresence>
                    {showDropdown && filteredCustomers.length > 0 && (
                      <motion.div
                        className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-white/[0.08] rounded-xl overflow-hidden z-20 shadow-2xl"
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        {filteredCustomers.slice(0, 6).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => { setSelectedCustomer(c); setCustomerSearch(c.ad); setShowDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left cursor-pointer border-b border-white/[0.04] last:border-0"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 text-xs font-semibold text-white/40">
                              {c.ad.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white/80">{c.ad}</p>
                              <p className="text-xs text-white/30">{c.email}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {selectedCustomer && (
                  <motion.div
                    className="mt-3 flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3"
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 text-sm font-semibold text-white/50">
                      {selectedCustomer.ad.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{selectedCustomer.ad}</p>
                      <p className="text-xs text-white/30">{selectedCustomer.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                      className="ml-auto text-white/20 hover:text-white/50 transition-colors cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </motion.section>

              {/* Fatura Tipi */}
              <motion.section
                className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              >
                <h3 className="text-sm font-semibold text-white mb-4">Fatura Tipi</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("kurumsal")}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-xl border transition-all cursor-pointer text-left",
                      invoiceType === "kurumsal"
                        ? "border-blue-500/30 bg-blue-500/[0.08]"
                        : "border-white/[0.06] hover:border-white/12 hover:bg-white/[0.02]"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      invoiceType === "kurumsal" ? "bg-blue-500/20" : "bg-white/[0.05]"
                    )}>
                      <Building2 size={16} className={invoiceType === "kurumsal" ? "text-blue-400" : "text-white/25"} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", invoiceType === "kurumsal" ? "text-white" : "text-white/40")}>Kurumsal</p>
                      <p className="text-xs text-white/25 mt-0.5">%20 KDV · Resmi fatura</p>
                    </div>
                    {invoiceType === "kurumsal" && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange("bireysel")}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-xl border transition-all cursor-pointer text-left",
                      invoiceType === "bireysel"
                        ? "border-white/20 bg-white/[0.04]"
                        : "border-white/[0.06] hover:border-white/12 hover:bg-white/[0.02]"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      invoiceType === "bireysel" ? "bg-white/10" : "bg-white/[0.05]"
                    )}>
                      <User size={16} className={invoiceType === "bireysel" ? "text-white/70" : "text-white/25"} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", invoiceType === "bireysel" ? "text-white" : "text-white/40")}>Bireysel</p>
                      <p className="text-xs text-white/25 mt-0.5">%0 KDV · Resmi değil</p>
                    </div>
                    {invoiceType === "bireysel" && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-white/30 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                </div>
              </motion.section>

              {/* Kalemler */}
              <motion.section
                className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
              >
                <h3 className="text-sm font-semibold text-white mb-5">Kalemler</h3>

                <div className="space-y-3">
                  {lines.map((line, idx) => (
                    <motion.div
                      key={line.id}
                      className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">Kalem {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => lines.length > 1 && setLines((p) => p.filter((l) => l.id !== line.id))}
                          disabled={lines.length === 1}
                          className="text-white/20 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Ürün adı */}
                      <input
                        value={line.name}
                        onChange={(e) => updateLine(line.id, "name", e.target.value)}
                        placeholder="Ürün veya hizmet adı"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors mb-3"
                        required
                      />

                      {/* Adet + Fiyat + KDV */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-white/30 mb-1.5 block">Adet</label>
                          <input
                            type="number" min="1" step="1"
                            value={line.qty}
                            onChange={(e) => updateLine(line.id, "qty", e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors text-center"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/30 mb-1.5 block">Birim Fiyat (₺)</label>
                          <input
                            type="number" min="0" step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(line.id, "unitPrice", e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors text-right"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/30 mb-1.5 block">KDV</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {([0, 20] as const).map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => updateLine(line.id, "vatRate", rate)}
                                className={cn(
                                  "py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                                  line.vatRate === rate
                                    ? "bg-white/10 border-white/20 text-white"
                                    : "bg-transparent border-white/[0.06] text-white/30 hover:border-white/12"
                                )}
                              >
                                %{rate}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Satır toplamı */}
                      {parseFloat(line.unitPrice) > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/[0.05] flex justify-between text-xs text-white/30">
                          <span>Satır toplamı</span>
                          <span className="text-white/60 font-medium">{fmt(computed[idx]?.total ?? 0)}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setLines((p) => [...p, { ...newLine(), vatRate: invoiceType === "bireysel" ? 0 : 20 }])}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/[0.08] text-sm text-white/30 hover:text-white/60 hover:border-white/15 transition-all cursor-pointer"
                >
                  <Plus size={14} />Kalem Ekle
                </button>
              </motion.section>
            </div>

            {/* ── Sağ: Özet + Ayarlar + Kaydet ── */}
            <div className="col-span-2 space-y-5">

              {/* Özet */}
              <motion.section
                className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              >
                <h3 className="text-sm font-semibold text-white mb-5">Özet</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-white/50">
                    <span>Ara Toplam</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/50">
                    <span>KDV ({invoiceType === "bireysel" ? "%0" : "%20"})</span>
                    <span>{fmt(vatTotal)}</span>
                  </div>
                  <div className="h-px bg-white/[0.06] my-1" />
                  <div className="flex justify-between text-base font-bold text-white">
                    <span>Toplam</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
              </motion.section>

              {/* Ayarlar */}
              <motion.section
                className="bg-[#161616] border border-white/[0.06] rounded-2xl p-6 space-y-5"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              >
                <h3 className="text-sm font-semibold text-white">Ayarlar</h3>

                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block">Vade Tarihi</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block">Notlar</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Fatura notu veya açıklama..."
                    className={cn(inputCls, "resize-none h-24")}
                  />
                </div>
              </motion.section>

              {/* Kaydet */}
              <motion.button
                type="submit"
                disabled={loading || !selectedCustomer}
                className="w-full py-4 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}
              >
                {loading ? "Kaydediliyor..." : "Fatura Oluştur"}
              </motion.button>

              {!selectedCustomer && (
                <p className="text-center text-xs text-white/25">Devam etmek için müşteri seçin</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
