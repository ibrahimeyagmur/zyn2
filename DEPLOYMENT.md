# 🚀 Windows Server 2019 VDS Deploy Rehberi — Berilis

Bu rehber Next.js frontend + Express backend'i **Windows Server 2019 VDS** üzerinde çalıştırmayı,
`isimkaydet.com`'dan aldığın domain'i Cloudflare ile yönetmeyi ve her şeyi
**IIS (Internet Information Services) reverse proxy** ile düzgünce birbirine bağlamayı
adım adım anlatıyor.

---

## 📋 Genel Mimari

```
Ziyaretçi
   │
   ▼
Cloudflare (DNS + SSL)
   │
   ▼
Windows Server 2019 VDS
   │
   ├── IIS (Port 80 / 443) ← Reverse Proxy
   │     ├── berilis.com       → Next.js  (Port 3000)
   │     └── berilis.com/api/* → Express  (Port 5000)
   │
   ├── Next.js  (pm2 ile çalışıyor, Port 3000)
   └── Express  (pm2 ile çalışıyor, Port 5000)
```

---

## 1️⃣ Domain'i isimkaydet.com'dan Al

1. [isimkaydet.com](https://isimkaydet.com)'a gir, istediğin domain'i satın al (ör. `berilis.com`).
2. Satın aldıktan sonra hesabında **"DNS / Nameserver"** ayarlarına gir.
3. Mevcut nameserver'ları **sil**, yerine Cloudflare nameserver'larını yaz (bir sonraki adımda alacaksın).

---

## 2️⃣ Cloudflare'e Domain Ekle

1. [cloudflare.com](https://cloudflare.com)'a üye ol (ücretsiz).
2. **"Add a Site"** → domain adını gir → **Free plan** seç.
3. Cloudflare sana 2 nameserver verecek, örneğin:
   ```
   aida.ns.cloudflare.com
   brad.ns.cloudflare.com
   ```
4. Bu iki nameserver'ı isimkaydet'teki domain paneline yaz ve kaydet.
5. Cloudflare'de **"Check nameservers"** butonuna bas. Yayılma 5–30 dakika sürer.

---

## 3️⃣ VDS'e RDP ile Bağlan

Windows Server 2019 VDS'ine **Uzak Masaüstü Bağlantısı** (mstsc) ile bağlan:

```
Bilgisayarın çubuğuna: mstsc yaz → aç
Bilgisayar: SUNUCU_IP_ADRESI
Kullanıcı adı: Administrator
Şifre: VDS sağlayıcının verdiği şifre
```

---

## 4️⃣ Node.js Kur

1. Tarayıcıdan [nodejs.org](https://nodejs.org) aç
2. **LTS** sürümünü indir (Windows Installer `.msi`)
3. İndirilen `.msi` dosyasını çalıştır, "Next Next Finish" şeklinde kur
4. Kurulduktan sonra PowerShell'i **Yönetici olarak aç** ve kontrol et:

```powershell
node -v
npm -v
```

Her ikisi de sürüm numarası gösteriyorsa tamam.

---

## 5️⃣ PM2 Kur (Arka Plan Süreç Yöneticisi)

PM2, uygulamayı arka planda çalıştırır. Sunucu yeniden başlasa bile otomatik ayağa kalkar.

PowerShell'i **Yönetici olarak aç**:

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

PM2'yi Windows başlangıcına ekle:

```powershell
pm2-startup install
```

---

## 6️⃣ Projeyi VDS'e Kopyala

### Yöntem A: Kendi bilgisayarından SCP ile gönder

Kendi bilgisayarında PowerShell aç:

```powershell
# node_modules klasörünü hariç tut (büyük, orada tekrar kurulacak)
scp -r C:\Users\eymen\Desktop\desingweb Administrator@SUNUCU_IP:C:\berilis
```

### Yöntem B: Git ile (önerilen — daha temiz)

VDS'teki PowerShell'de:

```powershell
# Git yoksa önce kur: https://git-scm.com/download/win

cd C:\
git clone https://github.com/KULLANICI_ADIN/REPO_ADIN.git berilis
```

### Yöntem C: WinSCP veya FileZilla ile sürükle-bırak

[WinSCP](https://winscp.net) indir, SFTP ile bağlan, dosyaları `C:\berilis` klasörüne kopyala.

---

## 7️⃣ Backend'i Kur ve Çalıştır

VDS'te PowerShell'i **Yönetici olarak aç**:

```powershell
cd C:\berilis\server

# Bağımlılıkları yükle
npm install

# TypeScript'i derle (dist/ klasörü oluşur)
npm run build

# PM2 ile arka planda başlat
pm2 start dist/index.js --name "berilis-backend"
```

---

## 8️⃣ Frontend'i Kur ve Çalıştır

```powershell
cd C:\berilis

# Bağımlılıkları yükle
npm install

# Next.js production build
npm run build

# PM2 ile başlat
pm2 start npm --name "berilis-frontend" -- start
```

PM2 durumunu kontrol et:

```powershell
pm2 status
# Çıktı şöyle olmalı:
# berilis-backend  │ online
# berilis-frontend │ online
```

PM2 listesini kaydet (yeniden başlatmada otomatik çalışsın):

```powershell
pm2 save
```

---

## 9️⃣ IIS Kur ve Ayarla (Reverse Proxy)

IIS Windows Server'da genellikle zaten var ama açık olmayabilir.

### IIS'i Aç

1. **Server Manager** → **Add roles and features**
2. **Web Server (IIS)** işaretle → Next Next → Kur

### URL Rewrite ve ARR Modüllerini Kur

IIS reverse proxy yapabilmek için 2 ek modül lazım:

**URL Rewrite** → İndir: [iis.net/downloads/microsoft/url-rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)

**Application Request Routing (ARR)** → İndir: [iis.net/downloads/microsoft/application-request-routing](https://www.iis.net/downloads/microsoft/application-request-routing)

İkisini de kur (standart kurulum).

### ARR Proxy'yi Aktif Et

1. IIS Manager'ı aç
2. Sol tarafta sunucu adına (en üst) tıkla
3. **Application Request Routing Cache** aç
4. Sağdaki **Server Proxy Settings** tıkla
5. **Enable proxy** işaretle → **Apply**

### Site Oluştur

1. IIS Manager → **Sites** → sağ tık → **Add Website**
2. Site name: `berilis`
3. Physical path: `C:\berilis\public` (veya istediğin bir klasör, önemli değil)
4. Port: `80`
5. Host name: `berilis.com`
6. OK

### web.config Dosyası Oluştur

`C:\berilis\public\` klasörünü oluştur (yoksa), içine `web.config` dosyası yaz:

```powershell
mkdir C:\berilis\public
```

Notepad ile `C:\berilis\public\web.config` dosyasını oluştur ve şu içeriği yapıştır
(`berilis.com` yerine kendi domain'ini yaz):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>

        <!-- /api/* isteklerini Express backend'e gönder -->
        <rule name="Express API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:5000/api/{R:1}" />
        </rule>

        <!-- Geri kalan her şeyi Next.js frontend'e gönder -->
        <rule name="Next.js Frontend" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>

      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

Kaydet.

### IIS'i Yeniden Başlat

```powershell
iisreset
```

---

## 🔟 Windows Firewall'da Port Aç

Dışarıdan 80 ve 443 portuna erişim için:

```powershell
# Port 80 (HTTP) aç
netsh advfirewall firewall add rule name="HTTP 80" dir=in action=allow protocol=TCP localport=80

# Port 443 (HTTPS) aç
netsh advfirewall firewall add rule name="HTTPS 443" dir=in action=allow protocol=TCP localport=443
```

VDS sağlayıcısının kontrol panelinde de güvenlik duvarı varsa orada da 80 ve 443 portlarını açmayı unutma.

---

## 1️⃣1️⃣ Cloudflare'de DNS Kaydı Ekle

Cloudflare panelinde → domain'inin DNS bölümüne git:

1. **Add record** tıkla
2. Type: `A`
3. Name: `@` (`berilis.com` anlamına gelir)
4. IPv4 address: `VDS_IP_ADRESI`
5. Proxy status: **Proxied (turuncu bulut)** ✅
6. Save

Bir tane daha ekle:
- Type: `A`, Name: `www`, IPv4: `VDS_IP_ADRESI`, Proxied ✅

---

## 1️⃣2️⃣ SSL (HTTPS) — Cloudflare Ücretsiz Yapar

Cloudflare panelinde: **SSL/TLS** → **Overview** → **Flexible** seç.

> "Flexible": Ziyaretçi ↔ Cloudflare arası şifreli (HTTPS), Cloudflare ↔ VDS arası şifresiz (HTTP).
> Windows IIS tarafında ekstra sertifika kurmana gerek yok.

---

## 1️⃣3️⃣ Frontend'deki API URL'ini Güncelle

Proje kök dizininde `.env.local` dosyası oluştur:

```
NEXT_PUBLIC_API_URL=https://berilis.com/api
```

Kod içinde `http://localhost:5000` yazan yerleri `process.env.NEXT_PUBLIC_API_URL` ile değiştir.

Değişikliği yaptıktan sonra tekrar build al:

```powershell
cd C:\berilis
npm run build
pm2 restart berilis-frontend
```

---

## 🔧 Hızlı Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Site açılmıyor | `pm2 status` → online mı? Değilse `pm2 logs` bak |
| 502 Bad Gateway | IIS, PM2 uygulamasına ulaşamıyor. PM2 çalışıyor mu? |
| API çalışmıyor | `pm2 logs berilis-backend` ile hata mesajına bak |
| Domain göndermiyor | isimkaydet'te nameserver'lar Cloudflare'inkiler mi? |
| IIS 500 hatası | web.config sözdizimi hatalı olabilir |

```powershell
# PM2 durumu
pm2 status

# Logları göster
pm2 logs berilis-frontend
pm2 logs berilis-backend

# Yeniden başlat
pm2 restart berilis-frontend
pm2 restart berilis-backend

# IIS yeniden başlat
iisreset
```

---

## ✅ Özet Kontrol Listesi

- [ ] Domain isimkaydet.com'dan alındı
- [ ] Cloudflare'e domain eklendi, nameserver'lar güncellendi
- [ ] VDS'e RDP ile bağlanıldı
- [ ] Node.js kuruldu (node -v çalışıyor)
- [ ] PM2 ve pm2-windows-startup kuruldu
- [ ] Proje `C:\berilis` klasörüne kopyalandı
- [ ] `cd C:\berilis\server` → `npm install` → `npm run build` → PM2 ile başlatıldı
- [ ] `cd C:\berilis` → `npm install` → `npm run build` → PM2 ile başlatıldı
- [ ] `pm2 save` ile kaydedildi
- [ ] IIS kuruldu, URL Rewrite ve ARR modülleri yüklendi
- [ ] ARR'da proxy aktif edildi
- [ ] IIS'te site oluşturuldu, web.config hazırlandı
- [ ] Firewall'da port 80 ve 443 açıldı
- [ ] Cloudflare DNS'te A kaydı eklendi (VDS IP)
- [ ] Cloudflare SSL → Flexible ayarlandı
- [ ] `berilis.com` tarayıcıda açılıyor ✅