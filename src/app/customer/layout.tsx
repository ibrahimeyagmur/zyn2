"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, FileText, ShoppingBag, HeadphonesIcon,
  Plus, LogOut, Menu,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface CustomerInfo {
  id: string;
  ad: string;
  email: string;
  balance: number;
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, formatCurrency } = useTranslation();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === "/customer/login";

  useEffect(() => {
    if (isLoginPage) return;
    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.replace("/customer/login");
      return;
    }
    const info = localStorage.getItem("customer_info");
    if (info) {
      try { setCustomer(JSON.parse(info)); } catch { /* ignore */ }
    }
    fetch(`${API}/api/customer/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setCustomer(data);
          localStorage.setItem("customer_info", JSON.stringify(data));
        } else {
          localStorage.removeItem("customer_token");
          localStorage.removeItem("customer_info");
          router.replace("/customer/login");
        }
      })
      .catch(() => { /* offline durumda localStorage'dan devam et */ });
  }, [router, isLoginPage]);

  async function handleLogout() {
    try {
      await fetch(`${API}/api/customer/logout`, { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_info");
    router.replace("/customer/login");
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/customer/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { href: "/customer/invoices", icon: FileText, label: t("nav.invoices") },
    { href: "/customer/orders", icon: ShoppingBag, label: t("nav.orders") },
    { href: "/customer/support", icon: HeadphonesIcon, label: t("nav.support") },
    { href: "/customer/new-order", icon: Plus, label: t("nav.newOrder") },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
            <img src="/logo.webp" alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-sm font-semibold text-white">{t("app.name")}</span>
        </div>
      </div>

      {customer && (
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="bg-white/[0.03] rounded-xl px-3 py-3">
            <p className="text-xs font-medium text-white truncate">{customer.ad}</p>
            <p className="text-[10px] text-white/30 truncate mt-0.5">{customer.email}</p>
            <div className="mt-2 pt-2 border-t border-white/[0.05]">
              <p className="text-[10px] text-white/30">{t("dashboard.balance")}</p>
              <p className={cn("text-sm font-bold mt-0.5", customer.balance > 0 ? "text-emerald-400" : "text-white/50")}>
                {formatCurrency(customer.balance ?? 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              )}
            >
              <Icon size={16} className={active ? "text-white" : "text-white/30"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/[0.06] transition-all cursor-pointer"
        >
          <LogOut size={16} />
          {t("nav.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <aside className="hidden lg:flex w-60 shrink-0 bg-[#111] border-r border-white/[0.06] flex-col fixed left-0 top-0 h-full z-30">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 h-full w-64 z-50 bg-[#111] border-r border-white/[0.06] flex flex-col lg:hidden"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#111] border-b border-white/[0.06] flex items-center justify-between px-4 py-3">
        <button onClick={() => setMobileOpen(true)} className="text-white/40 hover:text-white/70 cursor-pointer">
          <Menu size={20} />
        </button>
        <span className="text-sm font-semibold text-white">{t("app.name")}</span>
        <div className="w-8" />
      </div>

      <main className="flex-1 lg:ml-60 min-h-screen">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}