"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { Eye, EyeOff } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import { useTranslation } from "@/lib/i18n";

export default function CustomerLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (token) router.replace("/customer/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      let data: { customer?: { ad: string; id: string; email: string; balance: number }; token?: string; message?: string } = {};
      try { data = await res.json(); } catch { /* ignore */ }

      if (!res.ok) {
        setError(data.message || t("login.error.invalid"));
        return;
      }

      if (data.token) localStorage.setItem("customer_token", data.token);
      if (data.customer) localStorage.setItem("customer_info", JSON.stringify(data.customer));

      router.replace("/customer/dashboard");
    } catch {
      setError(t("login.error.server"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <img src="/logo.webp" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
        </div>

        <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">{t("login.title")}</h1>
          <p className="text-sm text-white/30 mb-6">{t("login.subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">{t("login.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">{t("login.password")}</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-xs text-red-400">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? t("login.loading") : t("login.submit")}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}