// Mock veri — gerçek API'ye geçişte bu dosyayı değiştirin

export const dashboardStats = [
  {
    label: "Toplam Sipariş",
    value: "248",
    sub: "+12 bu ay",
    subPositive: true,
  },
  {
    label: "Toplam Getiri",
    value: "124.850 TL",
    sub: "28.400 TL bu ay",
    subPositive: true,
  },
  {
    label: "Toplam Müşteri",
    value: "87",
    sub: "+5 bu ay",
    subPositive: true,
  },
  {
    label: "Açık Destek",
    value: "4",
    sub: "0 beklemede",
    subPositive: true,
  },
];

export const recentOrders = [
  { id: "SIP-001", customer: "Mehmet Yılmaz", service: "Kurumsal Kimlik Paketi", status: "devam", amount: "4.500 TL", date: "2 saat önce" },
  { id: "SIP-002", customer: "Ayşe Koç", service: "Sosyal Medya Tasarımı", status: "bekliyor", amount: "1.200 TL", date: "5 saat önce" },
  { id: "SIP-003", customer: "Can Demir", service: "Broşür & Katalog", status: "tamamlandi", amount: "2.800 TL", date: "1 gün önce" },
  { id: "SIP-004", customer: "Selin Arslan", service: "Logo Tasarımı", status: "tamamlandi", amount: "950 TL", date: "2 gün önce" },
  { id: "SIP-005", customer: "Burak Şahin", service: "Ambalaj Tasarımı", status: "bekliyor", amount: "3.200 TL", date: "3 gün önce" },
];

export const recentSupport = [
  { id: "TKT-001", subject: "Dosya teslim gecikmesi", customer: "Mehmet Yılmaz", priority: "yuksek", date: "1 saat önce" },
  { id: "TKT-002", subject: "Revizyon talebi", customer: "Ayşe Koç", priority: "orta", date: "3 saat önce" },
  { id: "TKT-003", subject: "Fatura düzeltme", customer: "Can Demir", priority: "dusuk", date: "1 gün önce" },
  { id: "TKT-004", subject: "Yeni proje teklifi", customer: "Selin Arslan", priority: "orta", date: "2 gün önce" },
];

export const quickLinks = [
  { label: "Yeni Sipariş", desc: "Sipariş kaydı oluştur", href: "/admin/orders", icon: "ShoppingBag" },
  { label: "Fatura Oluştur", desc: "Yeni fatura düzenle", href: "/admin/invoices/new", icon: "Receipt" },
  { label: "Müşteri Ekle", desc: "Yeni müşteri kaydı", href: "/admin/customers", icon: "UserPlus" },
  { label: "Destek Talepleri", desc: "Talepleri yönet", href: "/admin/support", icon: "Headphones" },
];

export const navGroups = [
  {
    label: null,
    items: [
      { label: "Genel Bakış", href: "/admin/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    label: "İş Takibi",
    items: [
      { label: "Siparişler", href: "/admin/orders", icon: "ShoppingBag" },
      {
        label: "Muhasebe",
        icon: "Receipt",
        children: [
          { label: "Fatura Listesi", href: "/admin/invoices" },
          { label: "Fatura Oluştur", href: "/admin/invoices/new" },
          { label: "Kasa Durumu", href: "/admin/invoices/cashflow" },
        ],
      },
    ],
  },
  {
    label: "Müşteri İlişkileri",
    items: [
      {
        label: "Müşteriler",
        icon: "Users",
        children: [
          { label: "Müşteri Listesi", href: "/admin/customers" },
          { label: "Pazarlama", href: "/admin/customers/marketing" },
        ],
      },
      {
        label: "Destek Merkezi",
        icon: "Headphones",
        children: [
          { label: "Destek Talepleri", href: "/admin/support" },
          { label: "Hazır Cevaplar", href: "/admin/support/templates" },
        ],
      },
      { label: "WhatsApp", href: "/admin/whatsapp", icon: "MessageCircle" },
    ],
  },
  {
    label: "Katalog",
    items: [
      {
        label: "Hizmet Yönetimi",
        icon: "Layers",
        children: [
          { label: "Ürün & Hizmetler", href: "/admin/services" },
        ],
      },
    ],
  },
  {
    label: null,
    items: [
      { label: "Ayarlar", href: "/admin/settings", icon: "Settings" },
    ],
  },
];