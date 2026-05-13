"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const notes = [
      { freq: 1046.5, start: 0,   dur: 0.08 },
      { freq: 1318.5, start: 0.1, dur: 0.12 },
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    });
  } catch { /* tarayıcı desteklemiyorsa sessiz geç */ }
}

export default function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevUnreadRef = useRef<number | null>(null);

  // Aktif sayfa heartbeat — 10 saniyede bir backend'e gönder
  useEffect(() => {
    function sendHeartbeat() {
      fetch(`${API}/api/notifications/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pathname }),
      }).catch(() => {});
    }
    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 10000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [pathname]);

  async function fetchCount() {
    try {
      const r = await fetch(`${API}/api/notifications/unread-count`);
      const d = await r.json();
      const count = d.count || 0;
      if (prevUnreadRef.current !== null && count > prevUnreadRef.current) {
        playNotificationSound();
      }
      prevUnreadRef.current = count;
      setUnread(count);
    } catch { /* ignore */ }
  }

  async function fetchAll() {
    try {
      const r = await fetch(`${API}/api/notifications`);
      const d = await r.json();
      setNotifs(Array.isArray(d) ? d.slice(0, 50) : []);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchCount();
    pollRef.current = setInterval(fetchCount, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (open) fetchAll();
  }, [open]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function markAllRead() {
    await fetch(`${API}/api/notifications/read-all`, { method: "PUT" });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  async function markRead(id: string) {
    await fetch(`${API}/api/notifications/${id}/read`, { method: "PUT" });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function deleteNotif(id: string, wasRead: boolean) {
    await fetch(`${API}/api/notifications/${id}`, { method: "DELETE" });
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    if (!wasRead) setUnread((c) => Math.max(0, c - 1));
  }

  async function clearAll() {
    await fetch(`${API}/api/notifications/clear-all`, { method: "DELETE" });
    setNotifs([]);
    setUnread(0);
  }

  function handleClick(notif: Notif) {
    if (!notif.read) markRead(notif.id);
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-[360px] bg-[#111] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">Bildirimler</p>
                {unread > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
                    {unread} yeni
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
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
                  onClick={() => { setOpen(false); router.push("/admin/notifications"); }}
                  className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Settings size={10} /> Ayarlar
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-white/20">
                  <Bell size={24} strokeWidth={1.2} />
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
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 mt-0.5",
                      TYPE_COLORS[n.type] || TYPE_COLORS.genel
                    )}>
                      {n.type.toUpperCase().slice(0, 3)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium leading-tight", n.read ? "text-white/50" : "text-white/80")}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-white/20 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif(n.id, n.read); }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-white/20 hover:text-red-400 transition-all cursor-pointer shrink-0"
                    >
                      <X size={11} />
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
    </div>
  );
}