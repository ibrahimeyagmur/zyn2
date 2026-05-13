"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check, X, ChevronRight, Tag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface EkBilgiAlani {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
}

interface Service {
  id: string;
  ad: string;
  aciklama: string;
  fiyat: number;
  birim: string;
  kategori: string;
  ekBilgiler?: EkBilgiAlani[];
}

interface CouponResult {
  valid: true;
  couponId: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  discount: number;
  finalTotal: number;
  description: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(n);
}

export default function CustomerNewOrderPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);
  const [notlar, setNotlar] = useState("");
  const [ekBilgiValues, setEkBilgiValues] = useState<Record<string, string>>({});
  const [digerValues, setDigerValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Kupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function getCustomerInfo() {
    const infoRaw = typeof window !== "undefined" ? localStorage.getItem("customer_info") : null;
    return infoRaw ? JSON.parse(infoRaw) : {};
  }

  useEffect(() => {
    fetch(`${API}/api/services/active`)
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  function selectService(s: Service) {
    if (selected?.id === s.id) {
      setSelected(null);
    } else {
      setSelected(s);
    }
    setEkBilgiValues({});
    setDigerValues({});
    // Hizmet değişince kuponu sıfırla
    setCouponCode("");
    setCouponResult(null);
    setCouponError(null);
  }

  function setEkBilgi(alanId: string, value: string) {
    setEkBilgiValues((prev) => ({ ...prev, [alanId]: value }));
    if (value !== "Diğer") {
      setDigerValues((prev) => { const n = { ...prev }; delete n[alanId]; return n; });
    }
  }

  function validateEkBilgiler(): boolean {
    if (!selected?.ekBilgiler) return true;
    for (const alan of selected.ekBilgiler) {
      if (!alan.required) continue;
      const val = ekBilgiValues[alan.id] || "";
      if (!val.trim()) return false;
      if (val === "Diğer" && !(digerValues[alan.id] || "").trim()) return false;
    }
    return true;
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim() || !selected) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponResult(null);
    try {
      const info = getCustomerInfo();
      const res = await fetch(`${API}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          code: couponCode.trim(),
          customerId: info.id || "",
          orderTotal: selected.fiyat,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.message || "Kupon geçersiz");
      } else {
        setCouponResult(data as CouponResult);
      }
    } catch {
      setCouponError("Kupon doğrulanamadı, lütfen tekrar deneyin");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setCouponCode("");
    setCouponResult(null);
    setCouponError(null);
  }

  async function handleSubmit() {
    if (!selected) return;
    if (!validateEkBilgiler()) {
      setToast("Lütfen zorunlu alanları doldurun");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSubmitting(true);
    try {
      const info = getCustomerInfo();

      const ekBilgilerDolu: Record<string, string> = {};
      if (selected.ekBilgiler) {
        for (const alan of selected.ekBilgiler) {
          const val = ekBilgiValues[alan.id] || "";
          if (val === "Diğer") {
            ekBilgilerDolu[alan.label] = digerValues[alan.id] || "Diğer";
          } else if (val) {
            ekBilgilerDolu[alan.label] = val;
          }
        }
      }

      const finalTotal = couponResult ? couponResult.finalTotal : selected.fiyat;

      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({
          customerId: info.id || "",
          customerName: info.ad || "",
          hizmetId: selected.id,
          hizmetAd: selected.ad,
          notlar: notlar.trim(),
          ekBilgilerDolu,
          status: "bekliyor",
          total: selected.fiyat,
          ...(couponResult
            ? {
                couponId: couponResult.couponId,
                couponCode: couponResult.code,
                discount: couponResult.discount,
                finalTotal,
              }
            : {}),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { message?: string }).message || "Sipariş oluşturulamadı");
      }
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sipariş oluşturulamadı";
      setToast(msg);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  const categories = [...new Set(services.map((s) => s.kategori))];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="text-center max-w-sm"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Sipariş Alındı</h2>
          <p className="text-sm text-white/40 mb-6">
            <span className="text-white/70 font-medium">{selected?.ad}</span> siparişiniz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecek.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/customer/orders")}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer"
            >
              Siparişlerim
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setSelected(null);
                setNotlar("");
                setEkBilgiValues({});
                setDigerValues({});
                setCouponCode("");
                setCouponResult(null);
                setCouponError(null);
              }}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer"
            >
              Yeni Sipariş
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Sipariş Ver</h1>
        <p className="text-sm text-white/30 mt-0.5">Hizmet kataloğundan seçim yapın</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/20">
          <ShoppingBag size={32} strokeWidth={1.2} />
          <p className="text-sm">Henüz hizmet eklenmedi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((kat) => (
            <div key={kat}>
              <p className="text-xs font-medium text-white/30 mb-3 uppercase tracking-wider">{kat}</p>
              <div className="space-y-2">
                {services.filter((s) => s.kategori === kat).map((s) => (
                  <motion.button
                    key={s.id}
                    onClick={() => selectService(s)}
                    className={cn(
                      "w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all cursor-pointer",
                      selected?.id === s.id
                        ? "bg-white/[0.06] border-white/20"
                        : "bg-[#161616] border-white/[0.06] hover:border-white/12 hover:bg-white/[0.03]"
                    )}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80">{s.ad}</p>
                      {s.aciklama && <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{s.aciklama}</p>}
                      {s.ekBilgiler && s.ekBilgiler.length > 0 && (
                        <p className="text-[10px] text-blue-400/70 mt-1">
                          {s.ekBilgiler.length} ek bilgi gerekli
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white/70">{formatCurrency(s.fiyat)}</p>
                      <p className="text-[10px] text-white/25">/ {s.birim}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      selected?.id === s.id ? "border-white bg-white" : "border-white/20"
                    )}>
                      {selected?.id === s.id && <Check size={10} className="text-black" />}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}

          <AnimatePresence>
            {selected && (
              <motion.div
                className="bg-[#161616] border border-white/[0.06] rounded-2xl p-5 space-y-4"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              >
                {/* Başlık + fiyat */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{selected.ad}</p>
                  <div className="text-right">
                    {couponResult ? (
                      <>
                        <p className="text-xs text-white/30 line-through">{formatCurrency(selected.fiyat)}</p>
                        <p className="text-sm font-bold text-emerald-400">{formatCurrency(couponResult.finalTotal)}</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-white">{formatCurrency(selected.fiyat)}</p>
                    )}
                  </div>
                </div>

                {/* ─── Ek Bilgi Alanları ─────────────────────────────── */}
                {selected.ekBilgiler && selected.ekBilgiler.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs font-medium text-white/40 border-t border-white/[0.06] pt-3">Sipariş Bilgileri</p>
                    {selected.ekBilgiler.map((alan) => {
                      const val = ekBilgiValues[alan.id] || "";
                      const isDigerSelected = val === "Diğer";
                      return (
                        <div key={alan.id}>
                          <label className="text-xs font-medium text-white/50 mb-1.5 block">
                            {alan.label}
                            {alan.required && <span className="text-red-400 ml-1">*</span>}
                          </label>

                          {alan.type === "text" && (
                            <input
                              value={val}
                              onChange={(e) => setEkBilgi(alan.id, e.target.value)}
                              placeholder={`${alan.label} girin...`}
                              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                            />
                          )}

                          {alan.type === "textarea" && (
                            <textarea
                              value={val}
                              onChange={(e) => setEkBilgi(alan.id, e.target.value)}
                              placeholder={`${alan.label} girin...`}
                              rows={3}
                              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors resize-none"
                            />
                          )}

                          {alan.type === "select" && (
                            <div className="space-y-2">
                              <select
                                value={val}
                                onChange={(e) => setEkBilgi(alan.id, e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-white/25 transition-colors cursor-pointer"
                              >
                                <option value="" className="bg-[#1a1a1a]">Seçin...</option>
                                {(alan.options || []).map((opt) => (
                                  <option key={opt} value={opt} className="bg-[#1a1a1a]">{opt}</option>
                                ))}
                              </select>
                              <AnimatePresence>
                                {isDigerSelected && (
                                  <motion.input
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    value={digerValues[alan.id] || ""}
                                    onChange={(e) => setDigerValues((prev) => ({ ...prev, [alan.id]: e.target.value }))}
                                    placeholder="Lütfen belirtin..."
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Notlar */}
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1.5 block">Ek Notlar (opsiyonel)</label>
                  <textarea
                    value={notlar}
                    onChange={(e) => setNotlar(e.target.value)}
                    placeholder="Eklemek istediğiniz başka bir şey var mı?"
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors resize-none"
                  />
                </div>

                {/* ─── Kupon Alanı ──────────────────────────────────── */}
                <div className="border-t border-white/[0.06] pt-4">
                  <p className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1.5">
                    <Tag size={11} /> Kupon Kodu
                  </p>

                  {couponResult ? (
                    /* Kupon uygulandı */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-400">{couponResult.code}</p>
                          <p className="text-[11px] text-emerald-400/70">
                            {couponResult.description} — {formatCurrency(couponResult.discount)} tasarruf
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-white/30 hover:text-white/60 transition-colors cursor-pointer ml-2"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ) : (
                    /* Kupon giriş alanı */
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleApplyCoupon(); }}
                          placeholder="KUPON25, YENIYIL vb."
                          className={cn(
                            "flex-1 bg-white/[0.04] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-colors font-mono tracking-wider",
                            couponError ? "border-red-500/40 focus:border-red-500/60" : "border-white/[0.08] focus:border-white/25"
                          )}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm text-white/70 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          {couponLoading ? <Loader2 size={13} className="animate-spin" /> : <Tag size={13} />}
                          Uygula
                        </button>
                      </div>
                      <AnimatePresence>
                        {couponError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[11px] text-red-400 flex items-center gap-1 pl-1"
                          >
                            <X size={10} /> {couponError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* ─── Fiyat Özeti ──────────────────────────────────── */}
                {couponResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/[0.03] rounded-xl px-4 py-3 space-y-1.5 text-xs"
                  >
                    <div className="flex justify-between text-white/40">
                      <span>Hizmet Tutarı</span>
                      <span>{formatCurrency(selected.fiyat)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Kupon İndirimi ({couponResult.description})</span>
                      <span>−{formatCurrency(couponResult.discount)}</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold border-t border-white/[0.06] pt-1.5 mt-1">
                      <span>Ödenecek Tutar</span>
                      <span>{formatCurrency(couponResult.finalTotal)}</span>
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <><ChevronRight size={15} /> Sipariş Ver — {formatCurrency(couponResult ? couponResult.finalTotal : selected.fiyat)}</>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border bg-[#161616] border-red-500/20 text-red-400 text-sm font-medium shadow-2xl"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          >
            <X size={14} />{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}