"use client";

// Dil sistemi kaldırıldı — site tamamen Türkçe
export type Locale = "tr";

const translations = {
  "app.name": "Müşteri Paneli",
  "nav.dashboard": "Genel Bakış",
  "nav.invoices": "Faturalar",
  "nav.orders": "Siparişler",
  "nav.support": "Destek",
  "nav.newOrder": "Sipariş Ver",
  "nav.logout": "Çıkış Yap",

  "login.title": "Müşteri Girişi",
  "login.subtitle": "Hesabınıza giriş yapın",
  "login.email": "E-posta",
  "login.password": "Şifre",
  "login.submit": "Giriş Yap",
  "login.loading": "Giriş yapılıyor...",
  "login.error.invalid": "E-posta veya şifre hatalı",
  "login.error.server": "Sunucuya bağlanılamadı",

  "dashboard.welcome": "Hoş geldiniz",
  "dashboard.balance": "Bakiye",
  "dashboard.recentInvoices": "Son Faturalar",
  "dashboard.openTickets": "Açık Talepler",
  "dashboard.totalOrders": "Toplam Sipariş",
  "dashboard.noInvoices": "Henüz fatura yok",
  "dashboard.noOrders": "Henüz sipariş yok",
  "dashboard.noTickets": "Açık destek talebi yok",
  "dashboard.viewAll": "Tümünü Gör",

  "invoices.title": "Faturalar",
  "invoices.subtitle": "fatura",
  "invoices.no": "Fatura No",
  "invoices.date": "Tarih",
  "invoices.due": "Vade",
  "invoices.amount": "Tutar",
  "invoices.status": "Durum",
  "invoices.type": "Tip",
  "invoices.empty": "Henüz fatura yok",
  "invoices.search": "Fatura ara...",
  "invoices.filter.all": "Hepsi",
  "invoices.status.bekliyor": "Bekliyor",
  "invoices.status.odendi": "Ödendi",
  "invoices.status.gecikti": "Gecikti",
  "invoices.status.iptal": "İptal",
  "invoices.type.kurumsal": "Kurumsal",
  "invoices.type.bireysel": "Bireysel",

  "orders.title": "Siparişler",
  "orders.subtitle": "sipariş",
  "orders.empty": "Henüz sipariş yok",
  "orders.id": "Sipariş No",
  "orders.date": "Tarih",
  "orders.status": "Durum",
  "orders.total": "Tutar",
  "orders.service": "Hizmet",

  "support.title": "Destek",
  "support.subtitle": "talep",
  "support.new": "Yeni Talep",
  "support.empty": "Henüz destek talebi yok",
  "support.subject": "Konu",
  "support.message": "Mesaj",
  "support.priority": "Öncelik",
  "support.priority.dusuk": "Düşük",
  "support.priority.normal": "Normal",
  "support.priority.yuksek": "Yüksek",
  "support.priority.acil": "Acil",
  "support.status.acik": "Açık",
  "support.status.kapali": "Kapalı",
  "support.status.bekliyor": "Bekliyor",
  "support.status.cozumlendi": "Çözümlendi",
  "support.submit": "Talep Oluştur",
  "support.submitting": "Gönderiliyor...",
  "support.success": "Talebiniz oluşturuldu",
  "support.error": "Talep gönderilemedi",
  "support.date": "Tarih",
  "support.form.title": "Yeni Destek Talebi",
  "support.form.subjectPlaceholder": "Sorununuzu kısaca açıklayın",
  "support.form.messagePlaceholder": "Detaylı açıklama yazın...",
  "support.chat.you": "Siz",
  "support.chat.support": "Destek",
  "support.chat.placeholder": "Mesajınızı yazın... (Enter ile gönder)",
  "support.chat.closed.resolved": "Bu destek talebi çözümlendi olarak işaretlendi.",
  "support.chat.closed.kapali": "Bu destek talebi kapatılmıştır.",
  "support.chat.notFound": "Destek talebi bulunamadı",
  "support.chat.back": "← Geri dön",
  "support.chat.dropFiles": "Dosyaları buraya bırakın",

  "newOrder.title": "Sipariş Ver",
  "newOrder.comingSoon": "Yakında",
  "newOrder.comingSoonDesc": "Hizmet kataloğu hazırlandıktan sonra buradan sipariş verebileceksiniz.",

  "common.loading": "Yükleniyor...",
  "common.error": "Hata",
  "common.retry": "Tekrar Dene",
  "common.save": "Kaydet",
  "common.cancel": "İptal",
  "common.close": "Kapat",
  "common.search": "Ara",
  "common.noData": "Veri bulunamadı",
  "common.currency": "₺",
} as const;

type TranslationKey = keyof typeof translations;

export function useTranslation() {
  const t = (key: TranslationKey, fallback?: string): string => {
    return translations[key] ?? fallback ?? key;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(n);

  return { t, formatDate, formatTime, formatCurrency };
}