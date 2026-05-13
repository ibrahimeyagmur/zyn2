"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Paperclip, Send, X, Download, ZoomIn, Clock, Check, AlertCircle, ChevronDown, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface FileAttachment { name: string; url: string; size: number; type: string; }
interface Message { id: string; gonderen: "musteri" | "admin"; mesaj: string; dosyalar: FileAttachment[]; tarih: string; }
interface Ticket {
  id: string; konu: string; oncelik: string; durum: string;
  customerName: string; customerEmail: string; customerId: string;
  createdAt: string; updatedAt: string; mesajlar: Message[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  acik: { label: "Açık", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: Check },
  bekliyor: { label: "Bekliyor", color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
  cozumlendi: { label: "Çözümlendi", color: "text-blue-400", bg: "bg-blue-400/10", icon: Check },
  kapali: { label: "Kapalı", color: "text-white/30", bg: "bg-white/5", icon: AlertCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  dusuk: { label: "Düşük", color: "text-white/40" },
  normal: { label: "Normal", color: "text-blue-400" },
  yuksek: { label: "Yüksek", color: "text-amber-400" },
  acil: { label: "Acil", color: "text-red-400" },
};

function formatTime(iso: string) { return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }); }
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function isImage(type: string) { return type.startsWith("image/"); }

export default function AdminSupportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [waReminding, setWaReminding] = useState(false);
  const [waRemindToast, setWaRemindToast] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ id: string; komut: string; baslik: string; icerik: string }[]>([]);
  const [templateQuery, setTemplateQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/support/${id}`, { credentials: "include" });
      if (!res.ok) return;
      setTicket(await res.json());
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    fetchTicket().finally(() => setLoading(false));
    pollRef.current = setInterval(fetchTicket, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTicket]);

  useEffect(() => {
    fetch(`${API}/api/templates`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTemplates(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.mesajlar?.length]);

  async function handleSend() {
    if ((!text.trim() && files.length === 0) || sending) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("mesaj", text.trim());
      formData.append("gonderen", "admin");
      files.forEach((f) => formData.append("dosyalar", f));
      const res = await fetch(`${API}/api/support/${id}/messages`, { method: "POST", credentials: "include", body: formData });
      if (!res.ok) return;
      setText(""); setFiles([]);
      await fetchTicket();
    } catch { /* ignore */ } finally { setSending(false); }
  }

  // Son mesaj müşteriden mi? (bekliyor sayılır)
  const lastMsg = ticket?.mesajlar?.[ticket.mesajlar.length - 1];
  const isPending = lastMsg?.gonderen === "musteri" && (ticket?.durum === "acik" || ticket?.durum === "bekliyor");

  async function handleWaRemind() {
    if (waReminding) return;
    setWaReminding(true);
    try {
      const res = await fetch(`${API}/api/support/${id}/wa-remind`, { method: "POST", credentials: "include" });
      const d = await res.json();
      if (res.status === 429) {
        setWaRemindToast(`${d.cooldownLeft} dk sonra tekrar gönderebilirsiniz`);
      } else if (res.ok) {
        setWaRemindToast("WA bildirimi gönderildi");
      } else {
        setWaRemindToast(d.message || "Gönderilemedi");
      }
    } catch { setWaRemindToast("Gönderilemedi"); } finally {
      setWaReminding(false);
      setTimeout(() => setWaRemindToast(null), 3500);
    }
  }

  async function handleMarkRead() {
    if (markingRead || !ticket) return;
    setMarkingRead(true);
    try {
      const formData = new FormData();
      formData.append("mesaj", "");
      formData.append("gonderen", "admin");
      formData.append("gizli", "true");
      await fetch(`${API}/api/support/${id}/messages`, { method: "POST", credentials: "include", body: formData });
      await fetchTicket();
    } catch { /* ignore */ } finally { setMarkingRead(false); }
  }

  async function handleStatusChange(durum: string) {
    setStatusOpen(false);
    setUpdatingStatus(true);
    try {
      await fetch(`${API}/api/support/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ durum }),
      });
      await fetchTicket();
    } catch { /* ignore */ } finally { setUpdatingStatus(false); }
  }

  // Cursor pozisyonundaki /komut bloğunu bul
  function findSlashCommand(val: string, cursorPos: number): { start: number; query: string } | null {
    // Cursor'dan geriye doğru / ara
    let i = cursorPos - 1;
    while (i >= 0 && val[i] !== " " && val[i] !== "\n") {
      if (val[i] === "/") {
        return { start: i, query: val.slice(i + 1, cursorPos).toLowerCase() };
      }
      i--;
    }
    return null;
  }

  function handleTextChange(val: string, cursorPos?: number) {
    setText(val);
    const pos = cursorPos ?? val.length;
    const cmd = findSlashCommand(val, pos);
    if (cmd !== null) {
      setTemplateQuery(cmd.query);
      setShowTemplates(true);
    } else {
      setShowTemplates(false);
      setTemplateQuery("");
    }
  }

  function applyTemplate(icerik: string) {
    // Textarea ref'inden cursor pozisyonunu al
    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    const cursorPos = textarea?.selectionStart ?? text.length;
    const cmd = findSlashCommand(text, cursorPos);
    if (cmd !== null) {
      // /komut kısmını şablon içeriğiyle değiştir
      const newText = text.slice(0, cmd.start) + icerik + text.slice(cursorPos);
      setText(newText);
    } else {
      setText(text + icerik);
    }
    setShowTemplates(false);
    setTemplateQuery("");
    // Focus geri ver
    setTimeout(() => textarea?.focus(), 0);
  }

  const filteredTemplates = templates.filter((t) =>
    templateQuery === "" ||
    t.komut.startsWith(templateQuery) ||
    t.baslik.toLowerCase().includes(templateQuery)
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && showTemplates) { setShowTemplates(false); return; }
    if (e.key === "Enter" && !e.shiftKey && !showTemplates) { e.preventDefault(); handleSend(); }
  }

  function addFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles.filter((f) => f.size <= 50 * 1024 * 1024)].slice(0, 10));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><svg className="animate-spin w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>;
  }

  if (!ticket) {
    return <div className="flex flex-col items-center justify-center h-screen gap-4"><p className="text-white/40 text-sm">Destek talebi bulunamadı</p><button onClick={() => router.back()} className="text-xs text-white/30 hover:text-white/60 cursor-pointer">← Geri dön</button></div>;
  }

  const statusCfg = STATUS_CONFIG[ticket.durum] ?? STATUS_CONFIG.acik;
  const priorityCfg = PRIORITY_CONFIG[ticket.oncelik] ?? PRIORITY_CONFIG.normal;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat alanı */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="shrink-0 bg-[#111] border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push("/admin/support")} className="text-white/40 hover:text-white/70 cursor-pointer shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{ticket.konu}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[9px] font-medium", priorityCfg.color)}>{priorityCfg.label}</span>
              <span className="text-[9px] text-white/20 font-mono">{ticket.id}</span>
            </div>
          </div>

          {/* İlgilenildi butonu — sadece bekleyen ticket'larda göster */}
          {isPending && (
            <button
              onClick={handleMarkRead}
              disabled={markingRead}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs font-medium text-white/50 hover:text-white/80 hover:border-white/20 transition-all cursor-pointer disabled:opacity-40"
            >
              {markingRead ? (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              ) : (
                <Check size={10} />
              )}
              İlgilenildi
            </button>
          )}

          {/* Durum değiştirici */}
          <div className="relative shrink-0">
            <button
              onClick={() => setStatusOpen((v) => !v)}
              disabled={updatingStatus}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer", statusCfg.color, statusCfg.bg, "border-white/[0.08] hover:border-white/20")}
            >
              <statusCfg.icon size={10} />
              {statusCfg.label}
              <ChevronDown size={10} className={cn("transition-transform", statusOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {statusOpen && (
                <motion.div
                  className="absolute right-0 top-full mt-1 bg-[#1c1c1c] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-50 min-w-[120px]"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors cursor-pointer", ticket.durum === key ? `${cfg.color} bg-white/[0.04]` : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]")}
                    >
                      <cfg.icon size={10} />{cfg.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mesajlar */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
        >
          <AnimatePresence>
            {dragOver && (
              <motion.div className="fixed inset-0 z-50 bg-white/[0.02] border-2 border-dashed border-white/20 flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-white/40 text-sm font-medium">Dosyaları buraya bırakın</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center mb-2">
            <span className="text-[10px] text-white/20 bg-white/[0.04] px-3 py-1 rounded-full">{formatDate(ticket.createdAt)}</span>
          </div>

          {(ticket.mesajlar || []).map((msg, i) => {
            const isAdmin = msg.gonderen === "admin";
            const prevMsg = ticket.mesajlar[i - 1];
            const showSender = !prevMsg || prevMsg.gonderen !== msg.gonderen;

            return (
              <motion.div key={msg.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                <div className={cn("max-w-[75%] space-y-1", isAdmin ? "items-end" : "items-start")}>
                  {showSender && (
                    <p className={cn("text-[10px] font-medium px-1", isAdmin ? "text-right text-white/25" : "text-left text-blue-400/60")}>
                      {isAdmin ? "Siz (Admin)" : ticket.customerName || "Müşteri"}
                    </p>
                  )}

                  {msg.dosyalar && msg.dosyalar.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.dosyalar.map((f, fi) => (
                        <div key={fi}>
                          {isImage(f.type) ? (
                            <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-white/[0.08]" onClick={() => setLightbox(`${API}${f.url}`)}>
                              <img src={`${API}${f.url}`} alt={f.name} className="max-w-[280px] max-h-[200px] object-cover rounded-xl block" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"><ZoomIn size={20} className="text-white" /></div>
                            </div>
                          ) : (
                            <a href={`${API}${f.url}`} download={f.name} target="_blank" rel="noreferrer" className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition-colors", isAdmin ? "bg-white/[0.08] border-white/[0.10] text-white/70 hover:bg-white/[0.12]" : "bg-white/[0.04] border-white/[0.06] text-white/60 hover:bg-white/[0.07]")}>
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
                    <div className={cn("px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words", isAdmin ? "bg-white text-black rounded-tr-sm" : "bg-[#1e1e1e] border border-white/[0.06] text-white/80 rounded-tl-sm")}>
                      {msg.mesaj}
                    </div>
                  )}

                  <p className={cn("text-[9px] text-white/20 px-1", isAdmin ? "text-right" : "text-left")}>{formatTime(msg.tarih)}</p>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {(ticket.durum === "kapali" || ticket.durum === "cozumlendi") ? (
          <div className="shrink-0 px-4 py-3 bg-white/[0.02] border-t border-white/[0.06] text-center">
            <p className="text-xs text-white/30">
              {ticket.durum === "cozumlendi" ? "Bu talep çözümlendi olarak işaretlendi." : "Bu destek talebi kapatılmıştır."} Durumu değiştirerek yeniden açabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="shrink-0 bg-[#111] border-t border-white/[0.06] px-4 py-3">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white/60">
                    {f.type.startsWith("image/") ? <img src={URL.createObjectURL(f)} alt="" className="w-4 h-4 rounded object-cover" /> : <Paperclip size={10} />}
                    <span className="max-w-[100px] truncate">{f.name}</span>
                    <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            {/* Şablon popup */}
            <AnimatePresence>
              {showTemplates && filteredTemplates.length > 0 && (
                <motion.div
                  className="mb-2 bg-[#1c1c1c] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.12 }}
                >
                  <div className="px-3 py-2 border-b border-white/[0.06]">
                    <p className="text-[10px] text-white/30">Hazır Cevaplar — <span className="text-white/50">tıklayarak seç</span></p>
                  </div>
                  {filteredTemplates.map((t) => (
                    <button
                      key={t.id}
                      onMouseDown={(e) => { e.preventDefault(); applyTemplate(t.icerik); }}
                      className="w-full px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors cursor-pointer border-b border-white/[0.04] last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded">/{t.komut}</span>
                        <span className="text-xs font-medium text-white/70">{t.baslik}</span>
                      </div>
                      <p className="text-[11px] text-white/35 mt-0.5 truncate">{t.icerik}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="shrink-0 self-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.07] transition-colors cursor-pointer">
                <Paperclip size={15} />
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
              <textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Müşteriye yanıt yazın... (/ ile hazır cevap, Enter ile gönder)"
                rows={1}
                className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors resize-none overflow-y-auto"
                style={{ minHeight: "80px", maxHeight: "200px" }}
                onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; }}
              />
              <button
                onClick={handleSend}
                disabled={sending || (!text.trim() && files.length === 0)}
                className="shrink-0 self-center w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {sending ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> : <Send size={15} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sağ sidebar — müşteri bilgileri */}
      <div className="hidden xl:flex w-64 shrink-0 bg-[#111] border-l border-white/[0.06] flex-col">
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-3">Müşteri Bilgileri</p>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-white/25">Ad</p>
              <p className="text-xs text-white/70 font-medium">{ticket.customerName || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/25">Email</p>
              <p className="text-xs text-white/60 truncate">{ticket.customerEmail || "—"}</p>
            </div>
            {ticket.customerId && (
              <div>
                <p className="text-[10px] text-white/25">Müşteri ID</p>
                <p className="text-xs text-white/40 font-mono">{ticket.customerId}</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-3">Talep Bilgileri</p>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-white/25">Öncelik</p>
              <p className={cn("text-xs font-medium", priorityCfg.color)}>{priorityCfg.label}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/25">Oluşturulma</p>
              <p className="text-xs text-white/40">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/25">Son güncelleme</p>
              <p className="text-xs text-white/40">{formatDate(ticket.updatedAt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/25">Mesaj sayısı</p>
              <p className="text-xs text-white/60">{ticket.mesajlar?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* WA Remind Toast */}
      <AnimatePresence>
        {waRemindToast && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1c1c1c] border border-white/[0.10] rounded-xl text-xs text-white/70 shadow-2xl"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
          >
            {waRemindToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)}>
            <button className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer z-10"><X size={24} /></button>
            <motion.img src={lightbox} alt="Görsel" className="max-w-full max-h-full object-contain rounded-xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}