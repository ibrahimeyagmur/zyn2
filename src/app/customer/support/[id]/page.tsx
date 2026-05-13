"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Paperclip, Send, X, Download, ZoomIn, Clock, Check, AlertCircle, MessageCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface Message {
  id: string;
  gonderen: "musteri" | "admin";
  mesaj: string;
  dosyalar: FileAttachment[];
  tarih: string;
  gizli?: boolean;
}

interface Ticket {
  id: string;
  konu: string;
  oncelik: string;
  durum: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  mesajlar: Message[];
}

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  acik: { color: "text-emerald-400", bg: "bg-emerald-400/10", icon: Check },
  bekliyor: { color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
  cozumlendi: { color: "text-blue-400", bg: "bg-blue-400/10", icon: Check },
  kapali: { color: "text-white/30", bg: "bg-white/5", icon: AlertCircle },
};

const PRIORITY_STYLE: Record<string, { color: string }> = {
  dusuk: { color: "text-white/40" },
  normal: { color: "text-blue-400" },
  yuksek: { color: "text-amber-400" },
  acil: { color: "text-red-400" },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function isImage(type: string) {
  return type.startsWith("image/");
}

export default function CustomerSupportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, formatDate, formatTime } = useTranslation();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [waReminding, setWaReminding] = useState(false);
  const [waRemindToast, setWaRemindToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function authHeaders(extra?: Record<string, string>): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
    return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
  }

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/support/${id}`, { credentials: "include", headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setTicket(data);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    fetchTicket().finally(() => setLoading(false));
    pollRef.current = setInterval(fetchTicket, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.mesajlar?.length]);

  async function handleSend() {
    if ((!text.trim() && files.length === 0) || sending) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("mesaj", text.trim());
      formData.append("gonderen", "musteri");
      files.forEach((f) => formData.append("dosyalar", f));

      const res = await fetch(`${API}/api/support/${id}/messages`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) return;
      setText("");
      setFiles([]);
      await fetchTicket();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  // WA Uyar — 30 dk cooldown, admin numarasına bildirim gönder
  async function handleWaRemind() {
    if (waReminding) return;
    setWaReminding(true);
    try {
      const res = await fetch(`${API}/api/support/${id}/wa-remind`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
      });
      const d = await res.json();
      if (res.status === 429) {
        setWaRemindToast(`${d.cooldownLeft} dk sonra tekrar gönderebilirsiniz`);
      } else if (res.ok) {
        setWaRemindToast("Destek ekibine bildirim gönderildi");
      } else {
        setWaRemindToast(d.message || "Gönderilemedi");
      }
    } catch { setWaRemindToast("Gönderilemedi"); } finally {
      setWaReminding(false);
      setTimeout(() => setWaRemindToast(null), 3500);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  }

  function addFiles(newFiles: File[]) {
    const valid = newFiles.filter((f) => f.size <= 50 * 1024 * 1024);
    setFiles((prev) => [...prev, ...valid].slice(0, 10));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <svg className="animate-spin w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-white/40 text-sm">{t("support.chat.notFound")}</p>
        <button onClick={() => router.back()} className="text-xs text-white/30 hover:text-white/60 cursor-pointer">{t("support.chat.back")}</button>
      </div>
    );
  }

  const statusStyle = STATUS_STYLE[ticket.durum] ?? STATUS_STYLE.acik;
  const priorityStyle = PRIORITY_STYLE[ticket.oncelik] ?? PRIORITY_STYLE.normal;
  const statusLabel = t(`support.status.${ticket.durum}` as "support.status.acik", ticket.durum);
  const priorityLabel = t(`support.priority.${ticket.oncelik}` as "support.priority.normal", ticket.oncelik);
  const isClosed = ticket.durum === "kapali" || ticket.durum === "cozumlendi";

  // Son mesaj adminden mi ve cevap bekleniyor mu?
  const lastMsg = ticket.mesajlar?.[ticket.mesajlar.length - 1];
  const waitingForAdmin = !lastMsg || lastMsg.gonderen === "musteri";

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen">
      {/* Header */}
      <div className="shrink-0 bg-[#111] border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/customer/support")} className="text-white/40 hover:text-white/70 cursor-pointer shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">{ticket.konu}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1", statusStyle.color, statusStyle.bg)}>
              <statusStyle.icon size={8} />{statusLabel}
            </span>
            <span className={cn("text-[9px] font-medium", priorityStyle.color)}>{priorityLabel}</span>
            <span className="text-[9px] text-white/20 font-mono">{ticket.id}</span>
          </div>
        </div>

        {/* WA Uyar butonu — sadece açık/bekleyen ticket'larda, cevap bekliyorken */}
        {!isClosed && waitingForAdmin && (
          <button
            onClick={handleWaRemind}
            disabled={waReminding}
            title="Destek ekibini WhatsApp ile uyar (30 dk'da bir)"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs font-medium text-emerald-500/70 hover:text-emerald-400 hover:border-emerald-400/20 hover:bg-emerald-400/[0.04] transition-all cursor-pointer disabled:opacity-40"
          >
            {waReminding ? (
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <MessageCircle size={10} />
            )}
            Uyar
          </button>
        )}

        <div className="text-[10px] text-white/25 shrink-0">{formatDate(ticket.createdAt)}</div>
      </div>

      {/* Mesajlar */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {dragOver && (
            <motion.div
              className="fixed inset-0 z-50 bg-white/[0.02] border-2 border-dashed border-white/20 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <p className="text-white/40 text-sm font-medium">{t("support.chat.dropFiles")}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center mb-2">
          <span className="text-[10px] text-white/20 bg-white/[0.04] px-3 py-1 rounded-full">{formatDate(ticket.createdAt)}</span>
        </div>

        {(ticket.mesajlar || []).filter((m) => !m.gizli).map((msg, i, arr) => {
          const isMe = msg.gonderen === "musteri";
          const prevMsg = arr[i - 1];
          const showSender = !prevMsg || prevMsg.gonderen !== msg.gonderen;

          return (
            <motion.div
              key={msg.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className={cn("max-w-[75%] space-y-1", isMe ? "items-end" : "items-start")}>
                {showSender && (
                  <p className={cn("text-[10px] font-medium px-1", isMe ? "text-right text-white/25" : "text-left text-blue-400/60")}>
                    {isMe ? t("support.chat.you") : t("support.chat.support")}
                  </p>
                )}

                {msg.dosyalar && msg.dosyalar.length > 0 && (
                  <div className="space-y-1.5">
                    {msg.dosyalar.map((f, fi) => (
                      <div key={fi}>
                        {isImage(f.type) ? (
                          <div
                            className="relative group cursor-pointer rounded-xl overflow-hidden border border-white/[0.08]"
                            onClick={() => setLightbox(`${API}${f.url}`)}
                          >
                            <img
                              src={`${API}${f.url}`}
                              alt={f.name}
                              className="max-w-[280px] max-h-[200px] object-cover rounded-xl block"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <ZoomIn size={20} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <a
                            href={`${API}${f.url}`}
                            download={f.name}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition-colors",
                              isMe
                                ? "bg-white/[0.08] border-white/[0.10] text-white/70 hover:bg-white/[0.12]"
                                : "bg-white/[0.04] border-white/[0.06] text-white/60 hover:bg-white/[0.07]"
                            )}
                          >
                            <Download size={12} className="shrink-0" />
                            <span className="truncate max-w-[180px]">{f.name}</span>
                            <span className="text-white/30 shrink-0">{formatSize(f.size)}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {msg.mesaj && (
                  <div className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                    isMe
                      ? "bg-white text-black rounded-tr-sm"
                      : "bg-[#1e1e1e] border border-white/[0.06] text-white/80 rounded-tl-sm"
                  )}>
                    {msg.mesaj}
                  </div>
                )}

                <p className={cn("text-[9px] text-white/20 px-1", isMe ? "text-right" : "text-left")}>
                  {formatTime(msg.tarih)}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isClosed && (
        <div className="shrink-0 px-4 py-3 bg-white/[0.02] border-t border-white/[0.06] text-center">
          <p className="text-xs text-white/30">
            {ticket.durum === "cozumlendi"
              ? t("support.chat.closed.resolved")
              : t("support.chat.closed.kapali")}
          </p>
        </div>
      )}

      {!isClosed && (
        <div className="shrink-0 bg-[#111] border-t border-white/[0.06] px-4 py-3">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white/60">
                  {f.type.startsWith("image/") ? (
                    <img src={URL.createObjectURL(f)} alt="" className="w-4 h-4 rounded object-cover" />
                  ) : (
                    <Paperclip size={10} />
                  )}
                  <span className="max-w-[100px] truncate">{f.name}</span>
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-white/30 hover:text-white/70 cursor-pointer">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.07] transition-colors cursor-pointer"
            >
              <Paperclip size={15} />
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("support.chat.placeholder")}
              rows={1}
              className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors resize-none overflow-y-auto"
              style={{ minHeight: "40px", maxHeight: "128px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
            />

            <button
              onClick={handleSend}
              disabled={sending || (!text.trim() && files.length === 0)}
              className="shrink-0 w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {sending ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* WA Remind Toast */}
      <AnimatePresence>
        {waRemindToast && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1c1c1c] border border-white/[0.10] rounded-xl text-xs text-white/70 shadow-2xl whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
          >
            {waRemindToast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer z-10">
              <X size={24} />
            </button>
            <motion.img
              src={lightbox}
              alt="Görsel"
              className="max-w-full max-h-full object-contain rounded-xl"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}