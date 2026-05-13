"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, Shield, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr";

export default function VerifyPhonePage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function authHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  function getCustomerId(): string {
    try {
      const token = localStorage.getItem("customer_token");
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload.customerId || "";
    } catch { return ""; }
  }

  async function handleSendOTP() {
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/whatsapp/send-otp`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ customerId: getCustomerId(), phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Kod gönderilemedi"); return; }
      setStep("otp");
    } catch { setError("Sunucuya bağlanılamadı"); } finally { setLoading(false); }
  }

  async function handleVerifyOTP() {
    if (!otp.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/whatsapp/verify-otp`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ customerId: getCustomerId(), phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Doğrulama başarısız"); return; }
      setStep("done");
      setTimeout(() => router.push("/customer/dashboard"), 2000);
    } catch { setError("Sunucuya bağlanılamadı"); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-8 space-y-6">
          {step === "done" ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <p className="text-white font-semibold text-lg">Doğrulandı!</p>
              <p className="text-white/40 text-sm text-center">Telefon numaranız başarıyla doğrulandı. Yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {step === "otp" && (
                  <button onClick={() => setStep("phone")} className="text-white/30 hover:text-white/70 cursor-pointer">
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div>
                  <h1 className="text-lg font-semibold text-white">
                    {step === "phone" ? "Telefon Doğrulama" : "Kodu Girin"}
                  </h1>
                  <p className="text-xs text-white/30 mt-0.5">
                    {step === "phone"
                      ? "WhatsApp üzerinden doğrulama kodu gönderilecek"
                      : `${phone} numarasına gönderilen 6 haneli kodu girin`}
                  </p>
                </div>
              </div>

              {step === "phone" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Telefon Numarası</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                        placeholder="05xxxxxxxxx"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                      />
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    onClick={handleSendOTP}
                    disabled={loading || !phone.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                    {loading ? "Gönderiliyor..." : "Kod Gönder"}
                  </button>
                </div>
              )}

              {step === "otp" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Doğrulama Kodu</label>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors text-center tracking-[0.5em] font-mono text-lg"
                    />
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    {loading ? "Doğrulanıyor..." : "Doğrula"}
                  </button>
                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full text-xs text-white/30 hover:text-white/60 cursor-pointer transition-colors py-1"
                  >
                    Kodu tekrar gönder
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}