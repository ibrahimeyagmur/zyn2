"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.berilisdesign.com.tr";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

const TYPE_COLORS: Record<string, string> = {
  siparis: "bg-blue-500/15 text-blue-400",
  destek: "bg-amber-500/15 text-amber-400",
  bakiye: "bg-emerald-500/15 text-emerald-400",
  fatura: "bg-purple-500/15 text-purple-400",
  musteri: "bg-pink-500/15 text-pink-400",
  genel: "bg-white/10 text-white/50",
};

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export default function NotificationsPanel({ open, onClose, onUnreadChange }: NotificationsPanelProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchAll() {
    try {
      const r = await fetch(`${API}/api/notifications`);
      const d = await r.json();
      const list: Notif[] = Array.isArray(d) ? d.slice(0, 50) : [];
      setNotifs(list);
      onUnreadChange?.(list.filter((n) => !n.read).length);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(fetchAll, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  async function markAllRead() {
    await fetch(`${API}/api/notifications/read-all`, { method: "PUT" });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    onUnreadChange?.(0);
  }

  async function markRead(id: string) {
    await fetch(`${API}/api/notifications/${id}/read`, { method: "PUT" });
    setNotifs((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      onUnreadChange?.(updated.filter((n) => !n.read).length);
      return updated;
    });
  }

  async function deleteNotif(id: string) {
    await fetch(`${API}/api/notifications/${id}`, { method: "DELETE" });
    setNotifs((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      onUnreadChange?.(updated.filter((n) => !n.read).length);
      return updated;
    });
  }

  async function clearAll() {
    await fetch(`${API}/api/notifications/clear-all`, { method: "DELETE" });
    setNotifs([]);
    onUnreadChange?.(0);
  }

  function handleClick(notif: Notif) {
    if (!notif.read) markRead(notif.id);
    if (notif.link) {
      onClose();
      router.push(notif.link);
    }
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.16 }}
          className="absolute bottom-full left-0 mb-2 w-80 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Bildirimler</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
                  {unreadCount} yeni
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check size={10} /> Tümünü oku
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-white/30 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={10} /> Temizle
                </button>
              )}
              <button
                onClick={() => { onClose(); router.push("/admin/notifications"); }}
                className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Settings size={10} />
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-white/20">
                <Bell size={22} strokeWidth={1.2} />
                <p className="text-xs">Bildirim yok</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] group transition-colors",
                    !n.read ? "bg-white/[0.03]" : "hover:bg-white/[0.02]",
                    n.link ? "cursor-pointer" : ""
                  )}
                  onClick={() => handleClick(n)}
                >
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 mt-0.5 uppercase",
                    TYPE_COLORS[n.type] || TYPE_COLORS.genel
                  )}>
                    {n.type.slice(0, 3)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium leading-tight", n.read ? "text-white/50" : "text-white/80")}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-white/30 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-white/20 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md hover:bg-red-500/10 flex items-center justify-center text-white/20 hover:text-red-400 transition-all cursor-pointer shrink-0"
                  >
                    <X size={10} />
                  </button>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}