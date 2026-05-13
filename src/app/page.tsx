"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Layers,
  Palette,
  Package,
  Share2,
  FileText,
  Star,
  ChevronDown,
  AtSign,
  Mail,
  MessageCircle,
  Clock,
  RefreshCcw,
  Heart,
  Zap,
  Award,
} from "lucide-react";

function FadeIn({ children, delay = 0, className = "", style }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className} style={style}>
      {children}
    </motion.div>
  );
}

const services = [
  { icon: Palette, title: "Logo & Marka Tasarımı", desc: "Markanızın özünü yansıtan, akılda kalıcı ve özgün logo tasarımları.", tag: "En Popüler" },
  { icon: Layers, title: "Kurumsal Kimlik", desc: "Kartvizit, antet, zarf ve tüm kurumsal materyallerde tutarlı kimlik.", tag: null },
  { icon: Share2, title: "Sosyal Medya Tasarımı", desc: "Feed görselleri, story şablonları ve kapak fotoğrafları.", tag: null },
  { icon: Package, title: "Ambalaj Tasarımı", desc: "Ürününüzü raflarda öne çıkaran yaratıcı ambalaj çözümleri.", tag: null },
  { icon: FileText, title: "Broşür & Katalog", desc: "Baskıya hazır, profesyonel broşür, katalog ve tanıtım materyalleri.", tag: null },
  { icon: Sparkles, title: "Özel Tasarım", desc: "Aklınızdaki her türlü görsel tasarım projesi için buradayım.", tag: "Teklif Al" },
];

const features = [
  { icon: Zap, title: "Hızlı Teslimat", desc: "Çoğu proje 3–7 iş günü içinde teslim edilir." },
  { icon: RefreshCcw, title: "Revizyon Hakkı", desc: "Memnun kalana kadar revizyonlar dahildir." },
  { icon: Heart, title: "Müşteri Odaklı", desc: "Projeniz süresince tam iletişim ve şeffaflık." },
  { icon: Award, title: "Özgün Tasarım", desc: "Her proje sıfırdan, size özel oluşturulur." },
];

const testimonials = [
  {
    name: "İbrahim Y.", role: "Pulkadot Founder", initials: "İY", stars: 5,
    body: "Berilis'in tasarım anlayışı markamızı tamamen dönüştürdü. Kurumsal kimliğimiz artık rakiplerimizden bir adım önde. Hem süreç hem sonuç mükemmeldi.",
  },
  {
    name: "Sena K.", role: "Berilis CFO", initials: "SK", stars: 5,
    body: "Finansal dokümantasyonumuzdan sosyal medya materyallerine kadar her şeyde tutarlı ve profesyonel bir dil yakaladık. Revizyon süreçleri son derece akıcı ilerledi.",
  },
  {
    name: "Kayra K.", role: "Berilis CEO", initials: "KK", stars: 5,
    body: "Vizyonumuzu görsel dile çevirmek için doğru adresi bulduk. Hızlı teslimat, özgün yaklaşım ve sınırsız revizyon anlayışı bizi çok etkiledi.",
  },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, transition: "background 0.3s, border-color 0.3s",
        background: scrolled ? "rgba(10,10,10,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <motion.div whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/logo.webp" alt="Berilis" width={28} height={28} style={{ borderRadius: 6 }} />
          <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 600, color: "#fff", fontSize: 14, letterSpacing: "-0.02em" }}>Berilis</span>
        </motion.div>
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden md:flex">
          {["Hizmetler", "Neden Ben?", "Yorumlar", "İletişim"].map((item, i) => (
            <a key={item} href={["#hizmetler", "#neden-ben", "#yorumlar", "#iletisim"][i]}
              style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>{item}</a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/customer/login" style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Giriş Yap</Link>
          <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href="#iletisim"
            style={{ padding: "8px 16px", borderRadius: 12, background: "#fff", color: "#000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            İletişime Geç
          </motion.a>
        </div>
      </div>
    </motion.header>
  );
}

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", overflowX: "hidden" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 24px 64px" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.025, 0.045, 0.025] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: "33%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 400, background: "rgba(255,255,255,1)", borderRadius: "50%", filter: "blur(120px)" }} />
          <motion.div animate={{ x: [-20, 20, -20], y: [-10, 10, -10] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: "25%", left: "25%", width: 300, height: 300, background: "rgba(99,102,241,0.05)", borderRadius: "50%", filter: "blur(100px)" }} />
          <motion.div animate={{ x: [20, -20, 20], y: [10, -10, 10] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: "33%", right: "25%", width: 200, height: 200, background: "rgba(168,85,247,0.05)", borderRadius: "50%", filter: "blur(80px)" }} />
        </div>

        <div style={{ position: "relative", maxWidth: 896, margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 32 }}>
            <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
              <Sparkles size={10} style={{ color: "#fbbf24" }} />
            </motion.span>
            Grafik Tasarımcı & Marka Uzmanı
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: "var(--font-bricolage)", fontSize: "clamp(40px,7vw,72px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 24, color: "#fff" }}>
            Markanızı{" "}
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} style={{ color: "rgba(255,255,255,0.28)" }}>görünür</motion.span>
            {" "}kılan tasarımlar
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            style={{ fontSize: 17, color: "rgba(255,255,255,0.4)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Logo, kurumsal kimlik, ambalaj ve sosyal medya tasarımlarıyla markanızı bir üst seviyeye taşıyorum.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 48 }}>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/customer/new-order" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 16, background: "#fff", color: "#000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                Sipariş Ver <ArrowRight size={15} />
              </Link>
            </motion.div>
            <motion.a whileHover={{ scale: 1.02 }} href="#hizmetler"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
              Hizmetleri Gör <ChevronDown size={14} />
            </motion.a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {[{ num: "200+", label: "Tamamlanan Proje" }, { num: "80+", label: "Mutlu Müşteri" }, { num: "5★", label: "Ortalama Puan" }].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-bricolage)", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{s.num}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.18)" }}>
          <ChevronDown size={20} />
        </motion.div>
      </section>

      {/* ── Hizmetler ── */}
      <section id="hizmetler" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <FadeIn style={{ marginBottom: 56, textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Hizmetlerim</p>
            <h2 style={{ fontFamily: "var(--font-bricolage)", fontSize: "clamp(28px,4vw,38px)", fontWeight: 700, color: "#fff", marginBottom: 12 }}>Ne yapıyorum?</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, maxWidth: 380, margin: "0 auto" }}>Her projeye özenle yaklaşıyorum. İşte sunduğum hizmetler:</p>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {services.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.07}>
                <motion.div whileHover={{ y: -6, borderColor: "rgba(255,255,255,0.14)", background: "#141414" }} transition={{ duration: 0.2 }}
                  style={{ position: "relative", background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24, height: "100%" }}>
                  {s.tag && (
                    <span style={{ position: "absolute", top: 16, right: 16, fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.45)" }}>{s.tag}</span>
                  )}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <s.icon size={18} style={{ color: "rgba(255,255,255,0.55)" }} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>{s.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3} style={{ textAlign: "center", marginTop: 40 }}>
            <motion.div whileHover={{ scale: 1.02 }} style={{ display: "inline-block" }}>
              <Link href="/customer/new-order" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
                Tüm hizmetleri gör <ArrowRight size={14} />
              </Link>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* ── Neden Ben ── */}
      <section id="neden-ben" style={{ padding: "96px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 64, alignItems: "center" }}>
          <FadeIn>
            <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Neden Ben?</p>
            <h2 style={{ fontFamily: "var(--font-bricolage)", fontSize: "clamp(28px,4vw,38px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 20 }}>
              Tasarım sadece <br /><span style={{ color: "rgba(255,255,255,0.28)" }}>güzel görünmek</span> değil
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7, maxWidth: 400, marginBottom: 32 }}>
              Her tasarımın arkasında bir strateji var. Sadece estetik değil, markanızın hedef kitlesiyle doğru iletişim kurmasını sağlıyorum.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
              <Link href="/customer/new-order" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 16, background: "#fff", color: "#000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                Projenizi Başlatın <ArrowRight size={14} />
              </Link>
            </motion.div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={0.1 + i * 0.08}>
                <motion.div whileHover={{ y: -4, borderColor: "rgba(255,255,255,0.13)" }} transition={{ duration: 0.2 }}
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <f.icon size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Süreç ── */}
      <section style={{ padding: "96px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Süreç</p>
            <h2 style={{ fontFamily: "var(--font-bricolage)", fontSize: "clamp(28px,4vw,38px)", fontWeight: 700, color: "#fff" }}>Nasıl çalışıyoruz?</h2>
          </FadeIn>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.07)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {[
                { step: "01", title: "Sipariş & Brifing", desc: "Hizmet seçin, notlarınızı yazın. Ne istediğinizi net anlayalım." },
                { step: "02", title: "Tasarım Süreci", desc: "Konsept oluşturuluyor, ilk taslaklar hazırlanıyor." },
                { step: "03", title: "Revizyon", desc: "Geri bildirimlerinizi alıyorum, tasarımı birlikte mükemmelleştiriyoruz." },
                { step: "04", title: "Teslimat", desc: "Baskıya ve dijitale hazır dosyalar teslim ediliyor." },
              ].map((item, i) => (
                <FadeIn key={item.step} delay={i * 0.12}>
                  <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#111", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", flexShrink: 0, position: "relative", zIndex: 1 }}>
                      {item.step}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>{item.title}</h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>{item.desc}</p>
                    </div>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Yorumlar ── */}
      <section id="yorumlar" style={{ padding: "96px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Müşteri Yorumları</p>
            <h2 style={{ fontFamily: "var(--font-bricolage)", fontSize: "clamp(28px,4vw,38px)", fontWeight: 700, color: "#fff" }}>Müşterilerim ne diyor?</h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.12}>
                <motion.div whileHover={{ y: -6, borderColor: "rgba(255,255,255,0.13)" }} transition={{ duration: 0.22 }}
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24, height: "100%" }}>
                  <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} size={12} style={{ color: "#fbbf24", fill: "#fbbf24" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 20 }}>&ldquo;{t.body}&rdquo;</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", flexShrink: 0, letterSpacing: "0.03em" }}>
                      {t.initials}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA + İletişim ── */}
      <section id="iletisim" style={{ padding: "96px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 28, padding: "64px 40px", position: "relative", overflow: "hidden", textAlign: "center" }}>
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.018, 0.04, 0.018] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, background: "rgba(255,255,255,1)", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                  style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <MessageCircle size={24} style={{ color: "rgba(255,255,255,0.45)" }} />
                </motion.div>
                <h2 style={{ fontFamily: "var(--font-bricolage)", fontSize: "clamp(28px,4vw,38px)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>Projenizi konuşalım</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.7 }}>
                  Aklınızdaki projeyi anlatın, size en uygun hizmeti birlikte belirleyelim. Cevap süresi genellikle birkaç saattir.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link href="/customer/new-order" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 16, background: "#fff", color: "#000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                      Sipariş Ver <ArrowRight size={15} />
                    </Link>
                  </motion.div>
                  <motion.a whileHover={{ scale: 1.02 }} href="https://wa.me/905xxxxxxxxx" target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                    <MessageCircle size={14} /> WhatsApp
                  </motion.a>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <a href="mailto:info@berilis.com" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
                    <Mail size={12} /> info@berilis.com
                  </a>
                  <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
                    <AtSign size={12} /> @berilis
                  </a>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                    <Clock size={12} /> Pzt–Cum 09:00–18:00
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image src="/logo.webp" alt="Berilis" width={22} height={22} style={{ borderRadius: 5, opacity: 0.6 }} />
            <span style={{ fontFamily: "var(--font-bricolage)", fontSize: 14, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Berilis</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>© {new Date().getFullYear()} Berilis. Tüm hakları saklıdır.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {[{ label: "Müşteri Girişi", href: "/customer/login", isLink: true }, { label: "Hizmetler", href: "#hizmetler", isLink: false }, { label: "İletişim", href: "#iletisim", isLink: false }].map(item =>
              item.isLink
                ? <Link key={item.label} href={item.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>{item.label}</Link>
                : <a key={item.label} href={item.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>{item.label}</a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}