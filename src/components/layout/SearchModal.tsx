"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const searchItems = [
  { label: "Genel Bakış", href: "/admin/dashboard", group: "Sayfalar" },
  { label: "Tüm Siparişler", href: "/admin/orders", group: "Sayfalar" },
  { label: "Aktif Siparişler", href: "/admin/orders/active", group: "Sayfalar" },
  { label: "Fatura Listesi", href: "/admin/invoices", group: "Sayfalar" },
  { label: "Fatura Oluştur", href: "/admin/invoices/new", group: "Sayfalar" },
  { label: "Kasa Durumu", href: "/admin/invoices/cashflow", group: "Sayfalar" },
  { label: "Müşteri Listesi", href: "/admin/customers", group: "Sayfalar" },
  { label: "Pazarlama", href: "/admin/customers/marketing", group: "Sayfalar" },
  { label: "Destek Talepleri", href: "/admin/support", group: "Sayfalar" },
  { label: "Hazır Cevaplar", href: "/admin/support/templates", group: "Sayfalar" },
  { label: "Ürün & Hizmetler", href: "/admin/services", group: "Sayfalar" },
  { label: "Genel Ayarlar", href: "/admin/settings", group: "Sayfalar" },
];

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? searchItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : searchItems.slice(0, 6);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-md -translate-x-1/2"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                <Search size={15} className="text-white/30 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Sayfa veya özellik ara..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
                />
                <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              {/* Sonuçlar */}
              <div className="py-2 max-h-72 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-center text-xs text-white/25 py-8">Sonuç bulunamadı</p>
                ) : (
                  filtered.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                      <ArrowRight size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center gap-3">
                <span className="text-[10px] text-white/20">ESC ile kapat</span>
                <span className="text-[10px] text-white/20">↵ ile git</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}