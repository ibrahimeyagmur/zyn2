import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const CUSTOMERS_FILE = path.join(__dirname, "../data/customers.json");
const INVOICES_FILE = path.join(__dirname, "../data/invoices.json");
const ORDERS_FILE = path.join(__dirname, "../data/orders.json");
const SUPPORT_FILE = path.join(__dirname, "../data/support.json");

function loadJSON(filePath: string): any[] {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function saveJSON(filePath: string, data: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// customer_token formatı: "customer_MUS-XXXXXX_timestamp"
// Cookie veya Authorization header'dan token alır
function getCustomerIdFromToken(req: Request): string | null {
  // Önce cookie'den dene
  let token = req.cookies?.customer_token as string | undefined;
  // Cookie yoksa Authorization header'dan dene
  if (!token) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.slice(7);
    }
  }
  if (!token || !token.startsWith("customer_")) return null;
  const withoutPrefix = token.slice("customer_".length);
  const lastUnderscore = withoutPrefix.lastIndexOf("_");
  if (lastUnderscore < 0) return null;
  return withoutPrefix.slice(0, lastUnderscore);
}

export function getMe(req: Request, res: Response) {
  try {
    const customerId = getCustomerIdFromToken(req);
    if (!customerId) return res.status(401).json({ message: "Yetkisiz erişim" });

    const customers = loadJSON(CUSTOMERS_FILE);
    const customer = customers.find((c: any) => c.id === customerId);
    if (!customer) return res.status(404).json({ message: "Müşteri bulunamadı" });

    const { passwordHash: _ph, ...safe } = customer;
    res.json(safe);
  } catch (err) {
    console.error("[customer.getMe]", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
}

export function getInvoices(req: Request, res: Response) {
  try {
    const customerId = getCustomerIdFromToken(req);
    if (!customerId) return res.status(401).json({ message: "Yetkisiz erişim" });

    const invoices = loadJSON(INVOICES_FILE);
    const myInvoices = invoices
      .filter((i: any) => i.customerId === customerId)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(myInvoices);
  } catch (err) {
    console.error("[customer.getInvoices]", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
}

export function getOrders(req: Request, res: Response) {
  try {
    const customerId = getCustomerIdFromToken(req);
    if (!customerId) return res.status(401).json({ message: "Yetkisiz erişim" });

    const orders = loadJSON(ORDERS_FILE);
    const myOrders = orders
      .filter((o: any) => o.customerId === customerId)
      .sort((a: any, b: any) =>
        new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
      );

    res.json(myOrders);
  } catch (err) {
    console.error("[customer.getOrders]", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
}

export function getSupport(req: Request, res: Response) {
  try {
    const customerId = getCustomerIdFromToken(req);
    if (!customerId) return res.status(401).json({ message: "Yetkisiz erişim" });

    const tickets = loadJSON(SUPPORT_FILE);
    const myTickets = tickets
      .filter((t: any) => t.customerId === customerId)
      .sort((a: any, b: any) =>
        new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
      );

    res.json(myTickets);
  } catch (err) {
    console.error("[customer.getSupport]", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
}

export function createSupport(req: Request, res: Response) {
  try {
    const customerId = getCustomerIdFromToken(req);
    if (!customerId) return res.status(401).json({ message: "Yetkisiz erişim" });

    const customers = loadJSON(CUSTOMERS_FILE);
    const customer = customers.find((c: any) => c.id === customerId);
    if (!customer) return res.status(404).json({ message: "Müşteri bulunamadı" });

    const { konu, mesaj, oncelik = "normal" } = req.body;
    if (!konu || !mesaj) {
      return res.status(400).json({ message: "Konu ve mesaj gerekli" });
    }

    const tickets = loadJSON(SUPPORT_FILE);
    const newTicket = {
      id: `SUP-${Date.now()}`,
      customerId,
      customerName: customer.ad,
      customerEmail: customer.email,
      konu,
      mesaj,
      oncelik,
      durum: "acik",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mesajlar: [
        {
          id: `MSG-${Date.now()}`,
          gonderen: "musteri",
          mesaj,
          dosyalar: [],
          tarih: new Date().toISOString(),
        },
      ],
    };

    tickets.unshift(newTicket);
    saveJSON(SUPPORT_FILE, tickets);

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("[customer.createSupport]", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
}