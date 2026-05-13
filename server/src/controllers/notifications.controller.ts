import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { waService } from "../services/whatsapp.service";

const DATA_PATH = path.join(__dirname, "../data/notifications.json");
const SETTINGS_PATH = path.join(__dirname, "../data/settings.json");

// Admin'in şu an hangi sayfada olduğunu tutar (heartbeat ile güncellenir)
let adminActivePage: string | null = null;
let adminActivePageTs = 0;
const ACTIVE_PAGE_TTL = 15000; // 15 saniye

// WA bildirim throttle — aynı link için 35 dakika içinde tekrar atma
const waSentAt = new Map<string, number>();
const WA_COOLDOWN_MS = 35 * 60 * 1000; // 35 dakika

type Notification = Record<string, unknown>;

function loadNotifications(): Notification[] {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}
function saveNotifications(data: Notification[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function loadSettings(): { notificationPhone: string } {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")); } catch { return { notificationPhone: "" }; }
}
function saveSettings(data: { notificationPhone: string }) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Internal helper — tüm controller'lardan çağrılabilir ────────────────────
export function pushNotification(opts: {
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    const notifications = loadNotifications();
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link || null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(notif);
    if (notifications.length > 200) notifications.splice(200);
    saveNotifications(notifications);

    // WhatsApp bildirimi kontrolleri
    const settings = loadSettings();
    if (settings.notificationPhone && waService.getState().status === "ready") {
      // 1) Admin o sayfaya bakıyorsa atma
      const isAdminViewing =
        opts.link &&
        adminActivePage &&
        Date.now() - adminActivePageTs < ACTIVE_PAGE_TTL &&
        adminActivePage === opts.link;

      if (isAdminViewing) return;

      // 2) Aynı link için 35 dakika cooldown
      const throttleKey = opts.link || opts.type;
      const lastSent = waSentAt.get(throttleKey) ?? 0;
      if (Date.now() - lastSent < WA_COOLDOWN_MS) return;

      // Gönder ve zamanı kaydet
      waSentAt.set(throttleKey, Date.now());

      const now = new Date().toLocaleString("tr-TR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      const typeLabel: Record<string, string> = {
        siparis: "SİPARİŞ", destek: "DESTEK", bakiye: "BAKİYE",
        fatura: "FATURA", musteri: "MÜŞTERİ", genel: "BİLDİRİM",
      };
      const label = typeLabel[opts.type] || "BİLDİRİM";
      const waMsg = [
        `[ ${label} ]  ${opts.title}`,
        opts.body,
        now,
        opts.link ? `berilis.com${opts.link}` : "",
      ].filter(Boolean).join("\n");

      waService.sendMessage(settings.notificationPhone, waMsg).catch(() => {});
    }
  } catch (err) {
    console.error("[pushNotification] Hata:", err);
  }
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

export function getAll(_req: Request, res: Response) {
  try {
    const notifications = loadNotifications();
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
    );
    res.json(sorted);
  } catch (err) {
    console.error("[notifications.getAll]", err);
    res.status(500).json({ message: "Bildirimler yüklenemedi" });
  }
}

export function getUnreadCount(_req: Request, res: Response) {
  try {
    const notifications = loadNotifications();
    const count = notifications.filter((n) => !n.read).length;
    res.json({ count });
  } catch (err) {
    console.error("[notifications.getUnreadCount]", err);
    res.status(500).json({ message: "Bildirim sayısı alınamadı" });
  }
}

export function markAllRead(_req: Request, res: Response) {
  try {
    const notifications = loadNotifications();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
    res.json({ message: "Tümü okundu" });
  } catch (err) {
    console.error("[notifications.markAllRead]", err);
    res.status(500).json({ message: "Bildirimler güncellenemedi" });
  }
}

export function markRead(req: Request, res: Response) {
  try {
    const notifications = loadNotifications();
    const idx = notifications.findIndex((n) => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Bildirim bulunamadı" });
    notifications[idx] = { ...notifications[idx], read: true };
    saveNotifications(notifications);
    res.json(notifications[idx]);
  } catch (err) {
    console.error("[notifications.markRead]", err);
    res.status(500).json({ message: "Bildirim güncellenemedi" });
  }
}

export function deleteNotification(req: Request, res: Response) {
  try {
    const notifications = loadNotifications();
    const idx = notifications.findIndex((n) => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Bildirim bulunamadı" });
    notifications.splice(idx, 1);
    saveNotifications(notifications);
    res.json({ message: "Bildirim silindi" });
  } catch (err) {
    console.error("[notifications.delete]", err);
    res.status(500).json({ message: "Bildirim silinemedi" });
  }
}

export function clearAll(_req: Request, res: Response) {
  try {
    saveNotifications([]);
    res.json({ message: "Tüm bildirimler temizlendi" });
  } catch (err) {
    console.error("[notifications.clearAll]", err);
    res.status(500).json({ message: "Bildirimler temizlenemedi" });
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(_req: Request, res: Response) {
  try {
    res.json(loadSettings());
  } catch (err) {
    console.error("[notifications.getSettings]", err);
    res.status(500).json({ message: "Ayarlar yüklenemedi" });
  }
}

export function updateSettings(req: Request, res: Response) {
  try {
    const current = loadSettings();
    const { notificationPhone } = req.body as { notificationPhone?: string };
    const updated = { ...current, notificationPhone: notificationPhone ?? current.notificationPhone };
    saveSettings(updated);
    res.json(updated);
  } catch (err) {
    console.error("[notifications.updateSettings]", err);
    res.status(500).json({ message: "Ayarlar güncellenemedi" });
  }
}

// ─── Heartbeat — admin'in aktif sayfasını takip eder ─────────────────────────

export function heartbeat(req: Request, res: Response) {
  try {
    const { page } = req.body as { page?: string };
    if (page) {
      adminActivePage = page;
      adminActivePageTs = Date.now();
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[notifications.heartbeat]", err);
    res.status(500).json({ message: "Heartbeat hatası" });
  }
}