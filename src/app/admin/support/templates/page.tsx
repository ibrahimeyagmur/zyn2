"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Zap } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Template {
  id: string;
  komut: string;
  baslik: string;
  icerik: string;
  createdAt: string;
}

export default function SupportTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [komut, setKomut] = useState("");
  const [baslik, setBaslik] = useState("");
  const [icerik, setIcerik] = useState("");

  async function load() {
    try {
      const res = await fetch(`${API}/api/templates`, { credentials: "include" });
      const d = await res.json();
      setTemplates(Array.isArray(d) ? d : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setKomut(""); setBaslik(""); setIcerik(""); setError("");
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setKomut(t.komut); setBaslik(t.baslik); setIcerik(t.icerik); setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setKomut(""); setBaslik(""); setIcerik(""); setError("");
  }

  async function handleSave() {
    if (!komut.trim() || !icerik.trim()) { setError("Komut ve içerik zorunludur"); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `${API}/api/templates/${editing.id}` : `${API}/api/templates`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ komut: komut.trim(), baslik: baslik.trim() || komut.trim(), icerik: icerik.trim() }),
      });
      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) { setError((data.message as string) || "Hata oluştu"); return; }
      await load();
      closeForm();
    } catch { setError("Sunucuya bağlanılamadı"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`${API}/api/templates/${id}`, { method: "DELETE", credentials: "include" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch { /* ignore */ } finally { setDeleteId(null); }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-semibold text-white">Hazır Cevaplar</h1>
          <p className="text-sm text-white/30 mt-0.5">Chat&apos;te <span className="font-mono text-white/50">/komut</span> yazarak hızlıca kullanın</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer">
          <Plus size={14} />Yeni Şablon
        </button>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">{editing ? "Şablonu Düzenle" : "Yeni Şablon"}</h2>
              <button onClick={closeForm} className="text-white/30 hover:text-white/70 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1.5 block">Komut <span className="text-white/20">(/ ile tetiklenir)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono">/</span>
                    <input
                      value={komut}
                      onChange={(e) => setKomut(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                      placeholder="selamla"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-7 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1.5 block">Başlık <span className="text-white/20">(isteğe bağlı)</span></label>
                  <input
                    value={baslik}
                    onChange={(e) => setBaslik(e.target.value)}
                    placeholder="Karşılama mesajı"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">İçerik</label>
                <textarea
                  value={icerik}
                  onChange={(e) => setIcerik(e.target.value)}
                  placeholder="Müşteriye gönderilecek mesaj..."
                  rows={4}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button onClick={closeForm} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">İptal</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste */}
      <motion.div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {loading ? (
          <div className="flex justify-center py-12"><svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-white/20">
            <Zap size={28} strokeWidth={1.2} />
            <p className="text-sm">Henüz hazır cevap yok</p>
            <button onClick={openNew} className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2 cursor-pointer">İlk şablonu oluştur</button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {templates.map((t) => (
              <div key={t.id} className="px-5 py-4 flex items-start gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-white/50 bg-white/[0.06] px-2 py-0.5 rounded">/{t.komut}</span>
                    <span className="text-sm font-medium text-white/70">{t.baslik}</span>
                  </div>
                  <p className="text-xs text-white/35 leading-relaxed line-clamp-2">{t.icerik}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => setDeleteId(t.id)} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-red-500/10 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Silme onayı */}
      <AnimatePresence>
        {deleteId && (
          <motion.div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)}>
            <motion.div className="bg-[#1c1c1c] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-white mb-2">Şablonu sil</h3>
              <p className="text-xs text-white/40 mb-5">Bu şablon kalıcı olarak silinecek. Emin misiniz?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">İptal</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <Trash2 size={13} />Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}