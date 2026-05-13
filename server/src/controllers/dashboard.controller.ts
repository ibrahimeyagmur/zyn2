import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const INVOICES_PATH = path.join(__dirname, "../data/invoices.json");
const ORDERS_PATH = path.join(__dirname, "../data/orders.json");
const CUSTOMERS_PATH = path.join(__dirname, "../data/customers.json");
const SUPPORT_PATH = path.join(__dirname, "../data/support.json");

interface InvoiceRow { status: string; total: number; date: string; }
interface OrderRow { status: string; amount: number; date: string; title?: string; customer?: string; service?: string; id?: string; }
interface CustomerRow { createdAt: string; }
interface SupportMsg { gonderen: string; }
interface SupportRow { durum?: string; status?: string; date?: string; createdAt?: string; konu?: string; subject?: string; customerName?: string; oncelik?: string; id?: string; mesajlar?: SupportMsg[]; }

function loadJSON<T>(filePath: string): T[] {
  try { return JSON.parse(fs.readFileSync(filePath, "utf-8")); } catch { return []; }
}

export function getStats(_req: Request, res: Response) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const invoices = loadJSON<InvoiceRow>(INVOICES_PATH);
    const orders = loadJSON<OrderRow>(ORDERS_PATH);
    const customers = loadJSON<CustomerRow>(CUSTOMERS_PATH);
    const support = loadJSON<SupportRow>(SUPPORT_PATH);

    const ordersThisMonth = orders.filter(
      (o) => new Date(o.date) >= startOfMonth
    ).length;

    const paidInvoices = invoices.filter((i) => i.status === "odendi");
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.total ?? 0), 0);
    const revenueThisMonth = paidInvoices
      .filter((i) => new Date(i.date) >= startOfMonth)
      .reduce((sum, i) => sum + (i.total ?? 0), 0);

    const customersThisMonth = customers.filter(
      (c) => new Date(c.createdAt) >= startOfMonth
    ).length;

    const openSupport = support.filter((t) => {
      const s = t.durum ?? t.status ?? "";
      return s === "acik" || s === "bekliyor";
    }).length;

    // "Bekleyen" = açık olan ve son mesajı müşteriden gelen (admin henüz yanıt vermemiş)
    const pendingSupport = support.filter((t) => {
      const s = t.durum ?? t.status ?? "";
      if (s !== "acik" && s !== "bekliyor") return false;
      const msgs = t.mesajlar ?? [];
      if (msgs.length === 0) return true; // hiç mesaj yoksa bekliyor say
      const lastMsg = msgs[msgs.length - 1];
      return lastMsg.gonderen === "musteri";
    }).length;

    res.json({
      totalOrders: orders.length,
      ordersThisMonth,
      totalRevenue,
      revenueThisMonth,
      totalCustomers: customers.length,
      customersThisMonth,
      openSupport,
      pendingSupport,
    });
  } catch (err) {
    console.error("[dashboard.getStats]", err);
    res.status(500).json({ message: "İstatistikler yüklenemedi" });
  }
}

export function getRecentOrders(_req: Request, res: Response) {
  try {
    const orders = loadJSON<OrderRow>(ORDERS_PATH);
    const recent = [...orders]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    res.json(recent);
  } catch (err) {
    console.error("[dashboard.getRecentOrders]", err);
    res.status(500).json({ message: "Son siparişler yüklenemedi" });
  }
}

export function getRecentSupport(_req: Request, res: Response) {
  try {
    const support = loadJSON<SupportRow>(SUPPORT_PATH);
    const recent = [...support]
      .filter((t) => {
        const s = t.durum ?? t.status ?? "";
        return s === "acik" || s === "bekliyor";
      })
      .sort((a, b) => new Date(b.createdAt ?? b.date ?? "").getTime() - new Date(a.createdAt ?? a.date ?? "").getTime())
      .slice(0, 4);
    res.json(recent);
  } catch (err) {
    console.error("[dashboard.getRecentSupport]", err);
    res.status(500).json({ message: "Destek talepleri yüklenemedi" });
  }
}

export function getCashflow(_req: Request, res: Response) {
  try {
    const invoices = loadJSON<InvoiceRow>(INVOICES_PATH);
    const totalPaid = invoices
      .filter((i) => i.status === "odendi")
      .reduce((sum, i) => sum + (i.total ?? 0), 0);
    const totalPending = invoices
      .filter((i) => i.status === "bekliyor")
      .reduce((sum, i) => sum + (i.total ?? 0), 0);
    const totalOverdue = invoices
      .filter((i) => i.status === "gecikti")
      .reduce((sum, i) => sum + (i.total ?? 0), 0);

    res.json({ totalPaid, totalPending, totalOverdue });
  } catch (err) {
    console.error("[dashboard.getCashflow]", err);
    res.status(500).json({ message: "Nakit akışı yüklenemedi" });
  }
}