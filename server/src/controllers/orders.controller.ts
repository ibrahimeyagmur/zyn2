import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { pushNotification } from "./notifications.controller";
import { incrementUsage } from "./coupons.controller";

const DATA_PATH = path.join(__dirname, "../data/orders.json");
const SUPPORT_PATH = path.join(__dirname, "../data/support.json");
const CUSTOMERS_PATH = path.join(__dirname, "../data/customers.json");

function loadCustomers(): Record<string, unknown>[] {
  try { return JSON.parse(fs.readFileSync(CUSTOMERS_PATH, "utf-8")); } catch { return []; }
}
function saveCustomers(data: Record<string, unknown>[]) {
  fs.writeFileSync(CUSTOMERS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function loadSupport(): Record<string, unknown>[] {
  try { return JSON.parse(fs.readFileSync(SUPPORT_PATH, "utf-8")); } catch { return []; }
}
function saveSupport(data: Record<string, unknown>[]) {
  fs.writeFileSync(SUPPORT_PATH, JSON.stringify(data, null, 2), "utf-8");
}

type Order = Record<string, unknown>;

function loadOrders(): Order[] {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}
function saveOrders(data: Order[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getAll(_req: Request, res: Response) {
  try {
    const orders = loadOrders();
    const sorted = [...orders].sort(
      (a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
    );
    res.json(sorted);
  } catch (err) {
    console.error("[orders.getAll]", err);
    res.status(500).json({ message: "Siparişler yüklenemedi" });
  }
}

export function getActive(_req: Request, res: Response) {
  try {
    const orders = loadOrders();
    const active = orders
      .filter((o) => o.status === "devam" || o.status === "bekliyor")
      .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());
    res.json(active);
  } catch (err) {
    console.error("[orders.getActive]", err);
    res.status(500).json({ message: "Aktif siparişler yüklenemedi" });
  }
}

export function getById(req: Request, res: Response) {
  try {
    const orders = loadOrders();
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı" });
    res.json(order);
  } catch (err) {
    console.error("[orders.getById]", err);
    res.status(500).json({ message: "Sipariş yüklenemedi" });
  }
}

export function create(req: Request, res: Response) {
  try {
    const { customerId, total, couponId, discount, finalTotal } = req.body as {
      customerId?: string;
      total?: number;
      couponId?: string;
      discount?: number;
      finalTotal?: number;
    };

    // Müşteriye faturalanan gerçek tutar (indirim sonrası)
    const chargeAmount = finalTotal ?? total ?? 0;

    // ─── Bakiye kontrolü ve düşme ─────────────────────────────────────────
    if (customerId && typeof chargeAmount === "number" && chargeAmount > 0) {
      const customers = loadCustomers();
      const idx = customers.findIndex((c) => c.id === customerId);
      if (idx !== -1) {
        const currentBalance = (customers[idx].balance as number) || 0;
        if (currentBalance < chargeAmount) {
          return res.status(402).json({ message: "Yetersiz bakiye. Lütfen bakiyenizi yükleyin." });
        }
        const newBalance = currentBalance - chargeAmount;
        const couponNote = discount && discount > 0 ? ` (${discount} TL kupon indirimi uygulandı)` : "";
        const historyEntry = {
          id: `BAL-${String(Date.now()).slice(-8)}`,
          type: "cikar",
          amount: chargeAmount,
          previousBalance: currentBalance,
          newBalance,
          note: `Sipariş ödemesi${couponNote}`,
          date: new Date().toISOString(),
        };
        const history = (customers[idx].balanceHistory as unknown[]) || [];
        customers[idx] = {
          ...customers[idx],
          balance: newBalance,
          balanceHistory: [historyEntry, ...history],
        };
        saveCustomers(customers);
      }
    }

    const orders = loadOrders();
    const newOrder: Order = {
      id: `SIP-${String(Date.now()).slice(-6)}`,
      date: new Date().toISOString(),
      ...req.body,
      // İndirimli tutarı da kaydet
      ...(discount && discount > 0 ? { discount, finalTotal: chargeAmount } : {}),
    };
    orders.push(newOrder);
    saveOrders(orders);

    // Kupon kullanımını artır
    if (couponId) {
      try { incrementUsage(couponId); } catch { /* ignore */ }
    }

    // Otomatik support ticket oluştur
    try {
      const { customerId, customerName, hizmetAd, notlar, ekBilgilerDolu } = req.body as {
        customerId?: string;
        customerName?: string;
        hizmetAd?: string;
        notlar?: string;
        ekBilgilerDolu?: Record<string, string>;
      };

      let ticketBody = `Yeni sipariş: **${hizmetAd || "Hizmet"}**\n\nSipariş No: ${newOrder.id as string}`;
      if (notlar) ticketBody += `\n\nMüşteri Notu: ${notlar}`;
      if (ekBilgilerDolu && Object.keys(ekBilgilerDolu).length > 0) {
        ticketBody += "\n\n**Ek Bilgiler:**";
        for (const [label, value] of Object.entries(ekBilgilerDolu)) {
          ticketBody += `\n- ${label}: ${value}`;
        }
      }

      const tickets = loadSupport();
      const ticket = {
        id: `TKT-${String(Date.now()).slice(-6)}`,
        customerId: customerId || "",
        customerName: customerName || "Müşteri",
        konu: `Sipariş: ${hizmetAd || "Hizmet"}`,
        mesaj: ticketBody,
        kategori: "Sipariş",
        oncelik: "acil",
        durum: "acik",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mesajlar: [],
        orderId: newOrder.id,
      };
      tickets.unshift(ticket);
      saveSupport(tickets);
    } catch (ticketErr) {
      console.error("[orders.create] Ticket oluşturulamadı:", ticketErr);
    }

    // Bildirim gönder
    try {
      const { customerName, hizmetAd } = req.body as {
        customerName?: string; hizmetAd?: string;
      };
      pushNotification({
        type: "siparis",
        title: "Yeni Sipariş",
        body: `${customerName || "Müşteri"} — ${hizmetAd || "Hizmet"}${chargeAmount ? ` (${chargeAmount} TL)` : ""}`,
        link: "/admin/orders",
      });
    } catch { /* ignore */ }

    res.status(201).json(newOrder);
  } catch (err) {
    console.error("[orders.create]", err);
    res.status(500).json({ message: "Sipariş oluşturulamadı" });
  }
}

export function update(req: Request, res: Response) {
  try {
    const orders = loadOrders();
    const idx = orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Sipariş bulunamadı" });
    orders[idx] = { ...orders[idx], ...req.body };
    saveOrders(orders);
    res.json(orders[idx]);
  } catch (err) {
    console.error("[orders.update]", err);
    res.status(500).json({ message: "Sipariş güncellenemedi" });
  }
}

export function remove(req: Request, res: Response) {
  try {
    const orders = loadOrders();
    const idx = orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Sipariş bulunamadı" });
    orders.splice(idx, 1);
    saveOrders(orders);
    res.json({ message: "Sipariş silindi" });
  } catch (err) {
    console.error("[orders.remove]", err);
    res.status(500).json({ message: "Sipariş silinemedi" });
  }
}