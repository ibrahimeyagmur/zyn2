"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipler ───────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ─── Stil haritası ────────────────────────────────────────────────────────────
const STYLES: Record<ToastType, { icon: React.ElementType; bar: string; iconColor: string }> = {
  success: { icon: CheckCircle2, bar: "bg-emerald-500", iconColor: "text-emerald-400" },
  error:   { icon: XCircle,      bar: "bg-red-500",     iconColor: "text-red-400" },
  warning: { icon: AlertCircle,  bar: "bg-amber-500",   iconColor: "text-amber-400" },
  info:    { icon: Info,         bar: "bg-blue-500",    iconColor: "text-blue-400" },
};

// ─── Tek toast bileşeni ───────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const { icon: Icon, bar, iconColor } = STYLES[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="relative flex items-start gap-3 bg-[#1c1c1c] border border-white/[0.08] rounded-2xl px-4 py-3.5 shadow-2xl w-80 overflow-hidden"
    >
      {/* Sol renk çubuğu */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl", bar)} />

      {/* İkon */}
      <Icon size={16} className={cn("shrink-0 mt-0.5", iconColor)} />

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white leading-snug">{toast.title}</p>
        {toast.message && <p className="text-xs text-white/40 mt-0.5 leading-snug">{toast.message}</p>}
      </div>

      {/* Kapat */}
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/20 hover:text-white/60 transition-colors cursor-pointer shrink-0 mt-0.5"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: "error",   title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: "warning", title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: "info",    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* Toast container — sağ üst */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}