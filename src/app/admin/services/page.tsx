"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pencil, Trash2, X, Check, Package,
  ToggleLeft, ToggleRight, ChevronDown, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface EkBilgiAlani {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
}

interface Service {
  id: string;
  ad: string;
  aciklama: string;
  fiyat: number;
  birim: string;
  kategori: string;
  aktif: boolean;
  ekBilgiler?: EkBilgiAlani[];
  createdAt: string;
}

const BIRIM_OPTIONS = ["proje", "adet", "saat", "sayfa", "set"];
const KATEGORI_SUGGESTIONS = [
  "Grafik Tasarım", "Logo Tasarım", "Sosyal Medya", "Baskı Tasarımı",
  "Web Tasarımı", "Ambalaj Tasarımı", "Kurumsal Kimlik", "Sunum Tasarımı",
];
const ALAN_TIPLERI = [
  { value: "text", label: "Kısa Metin" },
  { value: "textarea", label: "Uzun Metin" },
  { value: "select", label: "Seçim Listesi" },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(n);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

const emptyForm = {
  ad: "", aciklama: "", fiyat: "", birim: "proje", kategori: "", aktif: true,
  ekBilgiler: [] as EkBilgiAlani[],
};

function newAlan(): EkBilgiAlani {
  return { id: `alan-${Date.now()}`, label: "", type: "text", required: false, options: [] };
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAktif, setFilterAktif] = useState<"hepsi" | "aktif" | "pasif">("hepsi");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [kategoriOpen, setKategoriOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  // Seçenek ekleme için geçici input değerleri (alanId -> string)
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>({});
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function fetchServices() {
    try {
      const res = await fetch(`${API}/api/services`);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch {
      showToast("Hizmetler yüklenemedi", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchServices(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOptionInputs({});
    setDrawerOpen(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      ad: s.ad, aciklama: s.aciklama, fiyat: String(s.fiyat),
      birim: s.birim, kategori: s.kategori, aktif: s.aktif,
      ekBilgiler: s.ekBilgiler ? JSON.parse(JSON.stringify(s.ekBilgiler)) : [],
    });
    setOptionInputs({});
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
    setKategoriOpen(false);
  }

  // ─── Ek Bilgi Alanları yönetimi ───────────────────────────────────────────
  function addAlan() {
    const alan = newAlan();
    setForm((f) => ({ ...f, ekBilgiler: [...f.ekBilgiler, alan] }));
  }

  function removeAlan(id: string) {
    setForm((f) => ({ ...f, ekBilgiler: f.ekBilgiler.filter((a) => a.id !== id) }));
  }

  function updateAlan(id: string, patch: Partial<EkBilgiAlani>) {
    setForm((f) => ({
      ...f,
      ekBilgiler: f.ekBilgiler.map((a) => a.id === id ? { ...a, ...patch } : a),
    }));
  }

  function addOption(alanId: string) {
    const val = (optionInputs[alanId] || "").trim();
    if (!val) return;
    updateAlan(alanId, {
      options: [...(form.ekBilgiler.find((a) => a.id === alanId)?.options || []), val],
    });
    setOptionInputs((prev) => ({ ...prev, [alanId]: "" }));
  }

  function removeOption(alanId: string, optIdx: number) {
    const alan = form.ekBilgiler.find((a) => a.id === alanId);
    if (!alan) return;
    const newOpts = [...(alan.options || [])];
    newOpts.splice(optIdx, 1);
    updateAlan(alanId, { options: newOpts });
  }

  // ─── Kaydet ───────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.ad.trim() || !form.fiyat) {
      showToast("Ad ve fiyat zorunludur", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ad: form.ad.trim(),
        aciklama: form.aciklama.trim(),
        fiyat: Number(form.fiyat),
        birim: form.birim,
        kategori: form.kategori.trim() || "Genel",
        aktif: form.aktif,
        ekBilgiler: form.ekBilgiler.filter((a) => a.label.trim()),
      };
      const url = editing ? `${API}/api/services/${editing.id}` : `${API}/api/services`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      await fetchServices();
      closeDrawer();
      showToast(editing ? "Hizmet güncellendi" : "Hizmet eklendi");
    } catch {
      showToast("Kayıt başarısız", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAktif(s: Service) {
    try {
      await fetch(`${API}/api/services/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !s.aktif }),
      });
      setServices((prev) => prev.map((x) => x.id === s.id ? { ...x, aktif: !x.aktif } : x));
    } catch {
      showToast("Güncelleme başarısız", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${API}/api/services/${deleteTarget.id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Hizmet silindi");
    } catch {
      showToast("Silme başarısız", "error");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = services.filter((s) => {
    const matchSearch = s.ad.toLowerCase().includes(search.toLowerCase()) ||
      s.kategori.toLowerCase().includes(search.toLowerCase());
    const matchAktif = filterAktif === "hepsi" || (filterAktif === "aktif" ? s.aktif : !s.aktif);
    return matchSearch && matchAktif;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Ürün & Hizmetler</h1>
          <p className="text-sm text-white/30 mt-0.5">{services.length} hizmet</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors cursor-pointer"
        >
          <Plus size={15} /> Hizmet Ekle
        </button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hizmet veya kategori ara..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/15 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {(["hepsi", "aktif", "pasif"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterAktif(f)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize",
                filterAktif === f ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              {f === "hepsi" ? "Hepsi" : f === "aktif" ? "Aktif" : "Pasif"}
            </button>
          ))}
        </div>
      </div>

      {/* Tablo */}
      <motion.div
        className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-white/20">
            <Package size={32} strokeWidth={1.2} />
            <p className="text-sm">Hizmet bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left text-white/30 font-medium px-5 py-3">Hizmet Adı</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Kategori</th>
                  <th className="text-right text-white/30 font-medium px-4 py-3">Fiyat</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Birim</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Ek Alanlar</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Durum</th>
                  <th className="text-left text-white/30 font-medium px-4 py-3">Eklenme</th>
                  <th className="text-right text-white/30 font-medium px-5 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white/80">{s.ad}</p>
                      {s.aciklama && (
                        <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1 max-w-[240px]">{s.aciklama}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 font-medium">
                        {s.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-white/80">{formatCurrency(s.fiyat)}</td>
                    <td className="px-4 py-4 text-white/40">{s.birim}</td>
                    <td className="px-4 py-4">
                      {s.ekBilgiler && s.ekBilgiler.length > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                          {s.ekBilgiler.length} alan
                        </span>
                      ) : (
                        <span className="text-white/20 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleAktif(s)}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        {s.aktif ? (
                          <><ToggleRight size={16} className="text-emerald-400" /><span className="text-emerald-400 text-[10px] font-medium">Aktif</span></>
                        ) : (
                          <><ToggleLeft size={16} className="text-white/25" /><span className="text-white/25 text-[10px] font-medium">Pasif</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-white/30">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(s)}
                          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-red-500/10 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Drawer — Ekle/Düzenle */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-[#111] border-l border-white/[0.06] flex flex-col"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h2 className="text-base font-semibold text-white">
                  {editing ? "Hizmet Düzenle" : "Yeni Hizmet"}
                </h2>
                <button onClick={closeDrawer} className="text-white/30 hover:text-white/70 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {/* Ad */}
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1.5 block">Hizmet Adı *</label>
                  <input
                    value={form.ad}
                    onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))}
                    placeholder="Logo Tasarımı"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                  />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1.5 block">Açıklama</label>
                  <textarea
                    value={form.aciklama}
                    onChange={(e) => setForm((f) => ({ ...f, aciklama: e.target.value }))}
                    placeholder="Hizmet hakkında kısa açıklama..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors resize-none"
                  />
                </div>

                {/* Fiyat + Birim */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Fiyat (₺) *</label>
                    <input
                      type="number"
                      min="0"
                      value={form.fiyat}
                      onChange={(e) => setForm((f) => ({ ...f, fiyat: e.target.value }))}
                      placeholder="1500"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Birim</label>
                    <select
                      value={form.birim}
                      onChange={(e) => setForm((f) => ({ ...f, birim: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/25 transition-colors cursor-pointer"
                    >
                      {BIRIM_OPTIONS.map((b) => (
                        <option key={b} value={b} className="bg-[#1a1a1a]">{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Kategori — combobox */}
                <div className="relative">
                  <label className="text-xs font-medium text-white/40 mb-1.5 block">Kategori</label>
                  <div className="relative">
                    <input
                      value={form.kategori}
                      onChange={(e) => { setForm((f) => ({ ...f, kategori: e.target.value })); setKategoriOpen(true); }}
                      onFocus={() => setKategoriOpen(true)}
                      placeholder="Grafik Tasarım"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 pr-9 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setKategoriOpen((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 cursor-pointer"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {kategoriOpen && (
                      <motion.div
                        className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c1c] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto"
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                      >
                        {KATEGORI_SUGGESTIONS.filter((k) =>
                          k.toLowerCase().includes(form.kategori.toLowerCase())
                        ).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => { setForm((f) => ({ ...f, kategori: k })); setKategoriOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                          >
                            {k}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Aktif toggle */}
                <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white/70">Aktif</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Müşteri panelinde görünür</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, aktif: !f.aktif }))}
                    className="cursor-pointer"
                  >
                    {form.aktif ? (
                      <ToggleRight size={28} className="text-emerald-400" />
                    ) : (
                      <ToggleLeft size={28} className="text-white/20" />
                    )}
                  </button>
                </div>

                {/* ─── Ek Bilgi Alanları ─────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white/70">Ek Bilgi Alanları</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Sipariş öncesi müşteriden istenecek bilgiler</p>
                    </div>
                    <button
                      type="button"
                      onClick={addAlan}
                      className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={12} /> Alan Ekle
                    </button>
                  </div>

                  {form.ekBilgiler.length === 0 ? (
                    <div className="border border-dashed border-white/[0.08] rounded-xl py-6 flex flex-col items-center gap-2 text-white/20">
                      <GripVertical size={20} strokeWidth={1.2} />
                      <p className="text-xs">Henüz ek alan eklenmedi</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.ekBilgiler.map((alan) => (
                        <div key={alan.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 space-y-3">
                          {/* Alan başlığı + sil */}
                          <div className="flex items-center gap-2">
                            <input
                              value={alan.label}
                              onChange={(e) => updateAlan(alan.id, { label: e.target.value })}
                              placeholder="Alan adı (örn: Renk Tercihi)"
                              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => removeAlan(alan.id)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors cursor-pointer shrink-0"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          {/* Tip + Zorunlu */}
                          <div className="flex items-center gap-3">
                            <select
                              value={alan.type}
                              onChange={(e) => updateAlan(alan.id, { type: e.target.value as EkBilgiAlani["type"] })}
                              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white/20 transition-colors cursor-pointer"
                            >
                              {ALAN_TIPLERI.map((t) => (
                                <option key={t.value} value={t.value} className="bg-[#1a1a1a]">{t.label}</option>
                              ))}
                            </select>
                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                              <div
                                onClick={() => updateAlan(alan.id, { required: !alan.required })}
                                className={cn(
                                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer",
                                  alan.required ? "bg-white border-white" : "border-white/20"
                                )}
                              >
                                {alan.required && <Check size={9} className="text-black" />}
                              </div>
                              <span className="text-xs text-white/40">Zorunlu</span>
                            </label>
                          </div>

                          {/* Select seçenekleri */}
                          {alan.type === "select" && (
                            <div className="space-y-2">
                              <p className="text-[10px] text-white/30 font-medium">Seçenekler</p>
                              {(alan.options || []).map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <span className="flex-1 text-xs text-white/60 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5">
                                    {opt}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeOption(alan.id, optIdx)}
                                    className="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors cursor-pointer shrink-0"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                              {/* Diğer seçeneği her zaman var */}
                              <div className="flex items-center gap-2">
                                <input
                                  value={optionInputs[alan.id] || ""}
                                  onChange={(e) => setOptionInputs((prev) => ({ ...prev, [alan.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(alan.id); } }}
                                  placeholder="Seçenek ekle..."
                                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => addOption(alan.id)}
                                  className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer shrink-0"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              {/* "Diğer" seçeneği otomatik ekle toggle */}
                              <label className="flex items-center gap-2 cursor-pointer">
                                <div
                                  onClick={() => {
                                    const opts = alan.options || [];
                                    if (opts.includes("Diğer")) {
                                      updateAlan(alan.id, { options: opts.filter((o) => o !== "Diğer") });
                                    } else {
                                      updateAlan(alan.id, { options: [...opts, "Diğer"] });
                                    }
                                  }}
                                  className={cn(
                                    "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer",
                                    (alan.options || []).includes("Diğer") ? "bg-white border-white" : "border-white/20"
                                  )}
                                >
                                  {(alan.options || []).includes("Diğer") && <Check size={9} className="text-black" />}
                                </div>
                                <span className="text-[10px] text-white/40">&quot;Diğer&quot; seçeneği ekle (müşteri özel değer girebilir)</span>
                              </label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
                <button
                  onClick={closeDrawer}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <><Check size={14} />{editing ? "Güncelle" : "Ekle"}</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-[#161616] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm pointer-events-auto"
                initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              >
                <h3 className="text-base font-semibold text-white mb-1">Hizmeti Sil</h3>
                <p className="text-sm text-white/40 mb-5">
                  <span className="text-white/70 font-medium">{deleteTarget.ad}</span> hizmetini silmek istediğinize emin misiniz?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-semibold hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? "Siliniyor..." : "Sil"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={cn(
              "fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl",
              toast.type === "success"
                ? "bg-[#161616] border-emerald-500/20 text-emerald-400"
                : "bg-[#161616] border-red-500/20 text-red-400"
            )}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          >
            {toast.type === "success" ? <Check size={14} /> : <X size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}