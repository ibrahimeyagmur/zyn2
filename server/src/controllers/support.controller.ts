import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { pushNotification } from "./notifications.controller";
import { waService } from "../services/whatsapp.service";

// WA hatırlatma cooldown — ticket başına 30 dakika
const waRemindCooldown = new Map<string, number>();
const WA_REMIND_COOLDOWN_MS = 30 * 60 * 1000;

const DATA_PATH = path.join(__dirname, "../data/support.json");
const UPLOADS_DIR = path.join(__dirname, "../../../public/uploads/support");

// Uploads klasörü yoksa oluştur
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config — 50MB limit
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

type Message = {
  id: string;
  gonderen: "musteri" | "admin";
  mesaj: string;
  dosyalar: { name: string; url: string; size: number; type: string }[];
  tarih: string;
  gizli?: boolean; // true ise müşteri göremez
};

type Ticket = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  konu: string;
  mesaj: string;
  oncelik: string;
  durum: string;
  createdAt: string;
  updatedAt: string;
  mesajlar: Message[];
};

function loadTickets(): Ticket[] {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}
function saveTickets(data: Ticket[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getAll(_req: Request, res: Response) {
  try {
    const tickets = loadTickets();
    const sorted = [...tickets].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    res.json(sorted);
  } catch (err) {
    console.error("[support.getAll]", err);
    res.status(500).json({ message: "Destek talepleri yüklenemedi" });
  }
}

export function getById(req: Request, res: Response) {
  try {
    const tickets = loadTickets();
    const ticket = tickets.find((t) => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ message: "Destek talebi bulunamadı" });
    res.json(ticket);
  } catch (err) {
    console.error("[support.getById]", err);
    res.status(500).json({ message: "Destek talebi yüklenemedi" });
  }
}

export function create(req: Request, res: Response) {
  try {
    const tickets = loadTickets();
    const { customerId, customerName, customerEmail, konu, mesaj, oncelik = "normal" } = req.body;

    const now = new Date().toISOString();
    const newTicket: Ticket = {
      id: `SUP-${Date.now()}`,
      customerId: customerId || "",
      customerName: customerName || "",
      customerEmail: customerEmail || "",
      konu,
      mesaj,
      oncelik,
      durum: "acik",
      createdAt: now,
      updatedAt: now,
      mesajlar: [
        {
          id: `MSG-${Date.now()}`,
          gonderen: "musteri",
          mesaj,
          dosyalar: [],
          tarih: now,
        },
      ],
    };
    tickets.unshift(newTicket);
    saveTickets(tickets);

    // Bildirim
    try {
      pushNotification({
        type: "destek",
        title: "🎫 Yeni Destek Talebi",
        body: `${customerName || "Müşteri"} — ${konu || ""}`,
        link: `/admin/support/${newTicket.id}`,
      });
    } catch { /* ignore */ }

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("[support.create]", err);
    res.status(500).json({ message: "Destek talebi oluşturulamadı" });
  }
}

export function update(req: Request, res: Response) {
  try {
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Destek talebi bulunamadı" });
    tickets[idx] = { ...tickets[idx], ...req.body, updatedAt: new Date().toISOString() };
    saveTickets(tickets);
    res.json(tickets[idx]);
  } catch (err) {
    console.error("[support.update]", err);
    res.status(500).json({ message: "Destek talebi güncellenemedi" });
  }
}

export function remove(req: Request, res: Response) {
  try {
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Destek talebi bulunamadı" });
    tickets.splice(idx, 1);
    saveTickets(tickets);
    res.json({ message: "Destek talebi silindi" });
  } catch (err) {
    console.error("[support.remove]", err);
    res.status(500).json({ message: "Destek talebi silinemedi" });
  }
}

// Mesaj ekle (dosya yükleme dahil)
export function addMessage(req: Request, res: Response) {
  try {
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Destek talebi bulunamadı" });

    const { mesaj = "", gonderen = "musteri", gizli } = req.body;
    const isGizli = gizli === true || gizli === "true";
    const files = (req.files as Express.Multer.File[]) || [];

    const dosyalar = files.map((f) => ({
      name: f.originalname,
      url: `/uploads/support/${f.filename}`,
      size: f.size,
      type: f.mimetype,
    }));

    // Gizli mesajlar için boş mesaj kontrolü yok (sadece işaret mesajı)
    if (!isGizli && !mesaj.trim() && dosyalar.length === 0) {
      return res.status(400).json({ message: "Mesaj veya dosya gerekli" });
    }

    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      gonderen: gonderen as "musteri" | "admin",
      mesaj: mesaj.trim(),
      dosyalar,
      tarih: new Date().toISOString(),
      ...(isGizli ? { gizli: true } : {}),
    };

    if (!tickets[idx].mesajlar) tickets[idx].mesajlar = [];
    tickets[idx].mesajlar.push(newMsg);
    tickets[idx].updatedAt = new Date().toISOString();

    // Eğer admin cevap verdiyse (gizli dahil) durum "bekliyor" → "acik"
    // Müşteri cevap verdiyse "acik" → "bekliyor"
    if (gonderen === "admin" && tickets[idx].durum === "bekliyor") {
      tickets[idx].durum = "acik";
    } else if (gonderen === "musteri" && tickets[idx].durum === "acik") {
      tickets[idx].durum = "bekliyor";
    }

    saveTickets(tickets);

    // Müşteri mesaj attıysa admin'e sadece panel bildirimi (WA artık manuel butona bağlı)
    if (gonderen === "musteri") {
      try {
        pushNotification({
          type: "destek",
          title: "Destek Talebi Yanıtı",
          body: `${tickets[idx].customerName || "Müşteri"} — ${tickets[idx].konu || ""}`,
          link: `/admin/support/${tickets[idx].id}`,
        });
      } catch { /* ignore */ }
    }

    res.status(201).json(newMsg);
  } catch (err) {
    console.error("[support.addMessage]", err);
    res.status(500).json({ message: "Mesaj gönderilemedi" });
  }
}

// WhatsApp hatırlatma gönder — manuel buton, 30 dk cooldown
export function waRemind(req: Request, res: Response) {
  try {
    const tickets = loadTickets();
    const ticket = tickets.find((t) => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ message: "Destek talebi bulunamadı" });

    // Müşteri numarasını bul (customerId üzerinden customers.json'dan alabiliriz,
    // ama numarası yoksa settings'teki admin numarasına gönder)
    const settings: { notificationPhone?: string; adminPhone?: string } = (() => {
      try { return JSON.parse(fs.readFileSync(path.join(__dirname, "../data/settings.json"), "utf-8")); } catch { return {}; }
    })();

    if (waService.getState().status !== "ready") {
      return res.status(400).json({ message: "WhatsApp bağlı değil" });
    }

    const phone = settings.notificationPhone || settings.adminPhone || "";
    if (!phone) {
      return res.status(400).json({ message: "Bildirim numarası ayarlanmamış" });
    }

    // 30 dk cooldown kontrolü
    const last = waRemindCooldown.get(ticket.id) ?? 0;
    const elapsed = Date.now() - last;
    if (elapsed < WA_REMIND_COOLDOWN_MS) {
      const kalan = Math.ceil((WA_REMIND_COOLDOWN_MS - elapsed) / 60000);
      return res.status(429).json({ message: `Son gönderimden ${kalan} dakika geçmedi`, cooldownLeft: kalan });
    }

    // Gönder
    waRemindCooldown.set(ticket.id, Date.now());
    const now = new Date().toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const msg = [
      `[ DESTEK ]  ${ticket.konu}`,
      `${ticket.customerName || "Müşteri"} bekliyor — yanıt verilmedi.`,
      now,
      `berilis.com/admin/support/${ticket.id}`,
    ].join("\n");

    waService.sendMessage(phone, msg)
      .then((r) => {
        if (r.success) res.json({ message: "WhatsApp hatırlatması gönderildi" });
        else res.status(500).json({ message: r.error || "Gönderilemedi" });
      })
      .catch(() => res.status(500).json({ message: "Gönderilemedi" }));
  } catch (err) {
    console.error("[support.waRemind]", err);
    res.status(500).json({ message: "Hatırlatma gönderilemedi" });
  }
}

// Durum güncelle
export function updateStatus(req: Request, res: Response) {
  try {
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Destek talebi bulunamadı" });

    const { durum } = req.body;
    if (!["acik", "bekliyor", "kapali", "cozumlendi"].includes(durum)) {
      return res.status(400).json({ message: "Geçersiz durum" });
    }

    tickets[idx].durum = durum;
    tickets[idx].updatedAt = new Date().toISOString();
    saveTickets(tickets);
    res.json(tickets[idx]);
  } catch (err) {
    console.error("[support.updateStatus]", err);
    res.status(500).json({ message: "Durum güncellenemedi" });
  }
}