import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { waService } from "../services/whatsapp.service";

const CUSTOMERS_PATH = path.join(__dirname, "../data/customers.json");
const OTP_PATH = path.join(__dirname, "../data/otp.json");
const CONTACTS_PATH = path.join(__dirname, "../data/whatsapp_contacts.json");

interface Contact { id: string; name: string; phone: string; createdAt: string; }

function loadContacts(): Contact[] {
  try { return JSON.parse(fs.readFileSync(CONTACTS_PATH, "utf-8")); } catch { return []; }
}
function saveContacts(data: Contact[]) {
  fs.writeFileSync(CONTACTS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// OTP store: { [phone]: { code, expiresAt, customerId } }
interface OTPEntry { code: string; expiresAt: number; customerId: string; }
type OTPStore = Record<string, OTPEntry>;

function loadOTPs(): OTPStore {
  try { return JSON.parse(fs.readFileSync(OTP_PATH, "utf-8")); } catch { return {}; }
}
function saveOTPs(data: OTPStore) {
  fs.writeFileSync(OTP_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function loadCustomers(): Record<string, unknown>[] {
  try { return JSON.parse(fs.readFileSync(CUSTOMERS_PATH, "utf-8")); } catch { return []; }
}
function saveCustomers(data: Record<string, unknown>[]) {
  fs.writeFileSync(CUSTOMERS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET /api/whatsapp/status
export function getStatus(_req: Request, res: Response) {
  const state = waService.getState();
  res.json(state);
}

// POST /api/whatsapp/connect — QR başlat
export async function connect(_req: Request, res: Response) {
  try {
    const state = waService.getState();
    if (state.status === "ready") {
      return res.json({ message: "Zaten bağlı", ...state });
    }
    // Async başlat, hemen yanıt ver
    waService.initialize().catch((err) => console.error("[WA] initialize hatası:", err));
    res.json({ message: "Bağlantı başlatıldı, QR bekleniyor..." });
  } catch (err) {
    console.error("[WA] connect hatası:", err);
    res.status(500).json({ message: "Bağlantı başlatılamadı" });
  }
}

// POST /api/whatsapp/disconnect
export async function disconnect(_req: Request, res: Response) {
  try {
    await waService.disconnect();
    res.json({ message: "Bağlantı kesildi" });
  } catch (err) {
    console.error("[WA] disconnect hatası:", err);
    res.status(500).json({ message: "Bağlantı kesilemedi" });
  }
}

// POST /api/whatsapp/send — Admin'den manuel mesaj
export async function sendMessage(req: Request, res: Response) {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ message: "Telefon ve mesaj gerekli" });
    }
    const result = await waService.sendMessage(phone, message);
    if (!result.success) {
      return res.status(400).json({ message: result.error || "Mesaj gönderilemedi" });
    }
    res.json({ message: "Mesaj gönderildi" });
  } catch (err) {
    console.error("[WA] sendMessage hatası:", err);
    res.status(500).json({ message: "Mesaj gönderilemedi" });
  }
}

// POST /api/whatsapp/send-bulk — Toplu mesaj
export async function sendBulk(req: Request, res: Response) {
  try {
    const { customerIds, message } = req.body as { customerIds: string[]; message: string };
    if (!customerIds?.length || !message) {
      return res.status(400).json({ message: "Müşteri listesi ve mesaj gerekli" });
    }

    const customers = loadCustomers() as { id: string; phone?: string; name?: string }[];
    const results: { id: string; name: string; phone: string; success: boolean; error?: string }[] = [];

    for (const cid of customerIds) {
      const customer = customers.find((c) => c.id === cid);
      if (!customer?.phone) {
        results.push({ id: cid, name: customer?.name || cid, phone: "", success: false, error: "Telefon numarası yok" });
        continue;
      }
      const result = await waService.sendMessage(customer.phone, message);
      results.push({ id: cid, name: customer.name || cid, phone: customer.phone, ...result });
      // Rate limit: mesajlar arası 1 saniye bekle
      await new Promise((r) => setTimeout(r, 1000));
    }

    const successCount = results.filter((r) => r.success).length;
    res.json({ message: `${successCount}/${results.length} mesaj gönderildi`, results });
  } catch (err) {
    console.error("[WA] sendBulk hatası:", err);
    res.status(500).json({ message: "Toplu mesaj gönderilemedi" });
  }
}

// POST /api/whatsapp/send-otp — Müşteriye OTP gönder
export async function sendOTP(req: Request, res: Response) {
  try {
    const { customerId, phone } = req.body;
    if (!customerId || !phone) {
      return res.status(400).json({ message: "Müşteri ID ve telefon gerekli" });
    }

    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 dakika

    const otps = loadOTPs();
    otps[phone] = { code, expiresAt, customerId };
    saveOTPs(otps);

    const result = await waService.sendOTP(phone, code);
    if (!result.success) {
      return res.status(400).json({ message: result.error || "OTP gönderilemedi" });
    }

    res.json({ message: "Doğrulama kodu gönderildi" });
  } catch (err) {
    console.error("[WA] sendOTP hatası:", err);
    res.status(500).json({ message: "OTP gönderilemedi" });
  }
}

// POST /api/whatsapp/verify-otp — OTP doğrula
export async function verifyOTP(req: Request, res: Response) {
  try {
    const { phone, code, customerId } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: "Telefon ve kod gerekli" });
    }

    const otps = loadOTPs();
    const entry = otps[phone];

    if (!entry) {
      return res.status(400).json({ message: "Doğrulama kodu bulunamadı" });
    }
    if (Date.now() > entry.expiresAt) {
      delete otps[phone];
      saveOTPs(otps);
      return res.status(400).json({ message: "Doğrulama kodu süresi doldu" });
    }
    if (entry.code !== code) {
      return res.status(400).json({ message: "Hatalı doğrulama kodu" });
    }

    // Başarılı — müşteri kaydını güncelle
    const customers = loadCustomers() as { id: string; phone?: string; phoneVerified?: boolean }[];
    const cid = customerId || entry.customerId;
    const idx = customers.findIndex((c) => c.id === cid);
    if (idx !== -1) {
      customers[idx].phone = phone;
      customers[idx].phoneVerified = true;
      saveCustomers(customers);
    }

    // OTP'yi sil
    delete otps[phone];
    saveOTPs(otps);

    res.json({ message: "Telefon numarası doğrulandı", verified: true });
  } catch (err) {
    console.error("[WA] verifyOTP hatası:", err);
    res.status(500).json({ message: "Doğrulama yapılamadı" });
  }
}

// GET /api/whatsapp/contacts
export function getContacts(_req: Request, res: Response) {
  res.json(loadContacts());
}

// POST /api/whatsapp/contacts
export function addContact(req: Request, res: Response) {
  try {
    const { name, phone } = req.body;
    if (!phone?.trim()) return res.status(400).json({ message: "Telefon gerekli" });
    const contacts = loadContacts();
    // Aynı numara varsa güncelle
    const existing = contacts.findIndex((c) => c.phone === phone.trim());
    if (existing !== -1) {
      contacts[existing].name = name?.trim() || contacts[existing].name;
      saveContacts(contacts);
      return res.json(contacts[existing]);
    }
    const newContact: Contact = {
      id: Date.now().toString(),
      name: name?.trim() || phone.trim(),
      phone: phone.trim(),
      createdAt: new Date().toISOString(),
    };
    contacts.push(newContact);
    saveContacts(contacts);
    res.status(201).json(newContact);
  } catch (err) {
    console.error("[WA] addContact hatası:", err);
    res.status(500).json({ message: "Kişi eklenemedi" });
  }
}

// DELETE /api/whatsapp/contacts/:id
export function deleteContact(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const contacts = loadContacts().filter((c) => c.id !== id);
    saveContacts(contacts);
    res.json({ message: "Kişi silindi" });
  } catch (err) {
    console.error("[WA] deleteContact hatası:", err);
    res.status(500).json({ message: "Kişi silinemedi" });
  }
}

// GET /api/whatsapp/customers-with-phone — Telefonu olan müşteriler
export function getCustomersWithPhone(_req: Request, res: Response) {
  try {
    const customers = loadCustomers() as { id: string; name?: string; email?: string; phone?: string; phoneVerified?: boolean }[];
    const withPhone = customers.filter((c) => c.phone && c.phone.trim() !== "");
    res.json(withPhone.map((c) => ({ id: c.id, name: c.name || "", email: c.email || "", phone: c.phone!, phoneVerified: !!c.phoneVerified })));
  } catch (err) {
    console.error("[WA] getCustomersWithPhone hatası:", err);
    res.status(500).json({ message: "Müşteriler alınamadı" });
  }
}
