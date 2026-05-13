import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { createInvoiceInternal, addCashflowIncomeInternal } from "./invoices.controller";
import { pushNotification } from "./notifications.controller";

const DATA_PATH = path.join(__dirname, "../data/customers.json");

type Customer = Record<string, unknown>;

function loadCustomers(): Customer[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveCustomers(data: Customer[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

export function getAll(_req: Request, res: Response) {
  try {
    const customers = loadCustomers();
    const safe = customers.map(({ passwordHash: _ph, ...rest }) => rest);
    const sorted = [...safe].sort(
      (a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
    );
    res.json(sorted);
  } catch (err) {
    console.error("[customers.getAll]", err);
    res.status(500).json({ message: "Müşteriler yüklenemedi" });
  }
}

export function getById(req: Request, res: Response) {
  try {
    const customers = loadCustomers();
    const customer = customers.find((c) => c.id === req.params.id);
    if (!customer) return res.status(404).json({ message: "Müşteri bulunamadı" });
    const { passwordHash: _ph, ...safe } = customer;
    res.json(safe);
  } catch (err) {
    console.error("[customers.getById]", err);
    res.status(500).json({ message: "Müşteri yüklenemedi" });
  }
}

export function create(req: Request, res: Response) {
  try {
    const customers = loadCustomers();
    const { password, ...rest } = req.body;
    const plainPassword = password || generatePassword();

    const newCustomer: Customer = {
      id: `MUS-${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString(),
      durum: "aktif",
      balance: 0,
      balanceHistory: [],
      ...rest,
      passwordHash: simpleHash(plainPassword),
    };

    customers.push(newCustomer);
    saveCustomers(customers);

    const { passwordHash: _ph, ...safe } = newCustomer;
    res.status(201).json({ ...safe, tempPassword: plainPassword });
  } catch (err) {
    console.error("[customers.create]", err);
    res.status(500).json({ message: "Müşteri oluşturulamadı" });
  }
}

export function update(req: Request, res: Response) {
  try {
    const customers = loadCustomers();
    const idx = customers.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Müşteri bulunamadı" });

    const { password, ...rest } = req.body;
    const updates: Customer = { ...rest };
    if (password) updates.passwordHash = simpleHash(password);

    customers[idx] = { ...customers[idx], ...updates };
    saveCustomers(customers);

    const { passwordHash: _ph, ...safe } = customers[idx];
    res.json(safe);
  } catch (err) {
    console.error("[customers.update]", err);
    res.status(500).json({ message: "Müşteri güncellenemedi" });
  }
}

export function remove(req: Request, res: Response) {
  try {
    const customers = loadCustomers();
    const idx = customers.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Müşteri bulunamadı" });
    customers.splice(idx, 1);
    saveCustomers(customers);
    res.json({ message: "Müşteri silindi" });
  } catch (err) {
    console.error("[customers.remove]", err);
    res.status(500).json({ message: "Müşteri silinemedi" });
  }
}

// In-flight guard: aynı müşteri için eş zamanlı ikinci isteği engelle
const inFlightBalance = new Set<string>();

// Bakiye işlemi: type = "ekle" | "cikar" | "ayarla"
export function adjustBalance(req: Request, res: Response) {
  const customerId = req.params.id;

  // Aynı müşteri için eş zamanlı ikinci istek gelirse reddet
  if (inFlightBalance.has(customerId)) {
    return res.status(429).json({ message: "İşlem devam ediyor, lütfen bekleyin" });
  }
  inFlightBalance.add(customerId);

  try {
    const customers = loadCustomers();
    const idx = customers.findIndex((c) => c.id === customerId);
    if (idx === -1) {
      inFlightBalance.delete(customerId);
      return res.status(404).json({ message: "Müşteri bulunamadı" });
    }

    const { type, amount, note, invoiceType } = req.body as {
      type: "ekle" | "cikar" | "ayarla";
      amount: number;
      note?: string;
      invoiceType?: "kurumsal" | "bireysel";
    };

    if (!type || typeof amount !== "number" || amount < 0) {
      inFlightBalance.delete(customerId);
      return res.status(400).json({ message: "Geçersiz istek: type ve amount zorunlu" });
    }

    const current = (customers[idx].balance as number) || 0;
    let newBalance: number;

    if (type === "ekle") newBalance = current + amount;
    else if (type === "cikar") newBalance = Math.max(0, current - amount);
    else newBalance = amount; // ayarla

    const historyEntry = {
      id: `BAL-${String(Date.now()).slice(-8)}`,
      type,
      amount,
      previousBalance: current,
      newBalance,
      note: note || "",
      date: new Date().toISOString(),
    };

    const history = (customers[idx].balanceHistory as unknown[]) || [];
    customers[idx] = {
      ...customers[idx],
      balance: newBalance,
      balanceHistory: [historyEntry, ...history],
    };
    saveCustomers(customers);

    // Bakiye ekleme işleminde otomatik fatura oluştur
    if (type === "ekle") {
      const vatRate = invoiceType === "bireysel" ? 0 : 20;
      const lineTotal = amount;
      const vat = lineTotal * (vatRate / 100);
      const total = lineTotal + vat;
      const customer = customers[idx];
      try {
        createInvoiceInternal({
          customerId: customer.id as string,
          customerName: customer.ad as string,
          customerEmail: customer.email as string | undefined,
          invoiceType: invoiceType ?? "kurumsal",
          isBakiyeYukleme: true,
          items: [{
            id: `item-${Date.now()}`,
            name: note || "Bakiye Yükleme",
            qty: 1,
            unitPrice: amount,
            vatRate,
          }],
          subtotal: lineTotal,
          vatTotal: vat,
          total,
          dueDate: null,
          notes: note || "",
        });
      } catch (e) {
        console.error("[customers.adjustBalance] Fatura oluşturulamadı:", e);
        // Fatura hatası bakiye işlemini engellemez
      }

      // Cashflow'a "Bakiye Ekleme Geliri" kaydı ekle
      try {
        const customer = customers[idx];
        addCashflowIncomeInternal({
          amount,
          category: "Bakiye Ekleme Geliri",
          description: note
            ? `${customer.ad as string} – ${note}`
            : `${customer.ad as string} bakiye yüklemesi`,
          date: new Date().toISOString().slice(0, 10),
          meta: {
            customerId: customer.id as string,
            customerName: customer.ad as string,
            balanceHistoryId: historyEntry.id,
          },
        });
      } catch (e) {
        console.error("[customers.adjustBalance] Cashflow kaydı oluşturulamadı:", e);
        // Cashflow hatası bakiye işlemini engellemez
      }
    }

    inFlightBalance.delete(customerId);

    // Bildirim
    try {
      const customerName = (customers[idx].ad as string) || "Müşteri";
      const typeLabel = type === "ekle" ? "Bakiye Eklendi" : type === "cikar" ? "Bakiye Düşüldü" : "Bakiye Ayarlandı";
      pushNotification({
        type: "bakiye",
        title: `💰 ${typeLabel}`,
        body: `${customerName} — ₺${amount}${note ? ` (${note})` : ""}`,
        link: `/admin/customers`,
      });
    } catch { /* ignore */ }

    const { passwordHash: _ph, ...safe } = customers[idx];
    res.json(safe);
  } catch (err) {
    console.error("[customers.adjustBalance]", err);
    inFlightBalance.delete(customerId);
    res.status(500).json({ message: "Bakiye güncellenemedi" });
  }
}
