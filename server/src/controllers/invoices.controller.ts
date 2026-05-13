import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const INVOICES_PATH = path.join(__dirname, "../data/invoices.json");
const CASHFLOW_PATH = path.join(__dirname, "../data/cashflow.json");

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  vatRate: number;
}

interface Invoice {
  id: string;
  no: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  invoiceType?: string;
  isBakiyeYukleme?: boolean;
  items: InvoiceItem[];
  subtotal: number;
  vatTotal: number;
  total: number;
  status: "bekliyor" | "odendi" | "iptal" | "gecikti";
  dueDate: string | null;
  notes: string;
  date: string;
}

interface CashflowEntry {
  id: string;
  type: "gelir" | "gider";
  amount: number;
  category: string;
  description: string;
  date: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadInvoices(): Invoice[] {
  try { return JSON.parse(fs.readFileSync(INVOICES_PATH, "utf-8")); } catch { return []; }
}
function saveInvoices(data: Invoice[]) {
  fs.writeFileSync(INVOICES_PATH, JSON.stringify(data, null, 2), "utf-8");
}
function loadCashflow(): CashflowEntry[] {
  try { return JSON.parse(fs.readFileSync(CASHFLOW_PATH, "utf-8")); } catch { return []; }
}
function saveCashflow(data: CashflowEntry[]) {
  fs.writeFileSync(CASHFLOW_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Dışarıdan çağrılabilir cashflow gelir kaydı ─────────────────────────────
export function addCashflowIncomeInternal(entry: {
  amount: number;
  category: string;
  description: string;
  date?: string;
  meta?: Record<string, unknown>;
}): CashflowEntry {
  const entries = loadCashflow();
  const newEntry: CashflowEntry = {
    id: `cf-${Date.now()}`,
    type: "gelir",
    amount: entry.amount,
    category: entry.category,
    description: entry.description,
    date: entry.date ?? new Date().toISOString().slice(0, 10),
    ...(entry.meta ? { meta: entry.meta } : {}),
  } as CashflowEntry;
  entries.push(newEntry);
  saveCashflow(entries);
  return newEntry;
}

function getNextInvoiceNo(invoices: Invoice[]): string {
  const max = invoices.reduce((m, inv) => {
    const n = parseInt(inv.no.replace("FAT-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 1000);
  return `FAT-${max + 1}`;
}

// ─── Internal helper (diğer controller'lardan çağrılabilir) ──────────────────
export function createInvoiceInternal(data: {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  invoiceType?: string;
  isBakiyeYukleme?: boolean;
  items: InvoiceItem[];
  subtotal: number;
  vatTotal: number;
  total: number;
  dueDate?: string | null;
  notes?: string;
}): Invoice {
  const invoices = loadInvoices();
  const no = getNextInvoiceNo(invoices);
  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    no,
    customerId: data.customerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    invoiceType: data.invoiceType,
    ...(data.isBakiyeYukleme ? { isBakiyeYukleme: true } : {}),
    items: data.items,
    subtotal: data.subtotal,
    vatTotal: data.vatTotal,
    total: data.total,
    status: "bekliyor",
    dueDate: data.dueDate ?? null,
    notes: data.notes ?? "",
    date: new Date().toISOString(),
  };
  invoices.unshift(newInvoice);
  saveInvoices(invoices);
  return newInvoice;
}

// ─── Fatura CRUD ──────────────────────────────────────────────────────────────
export function getAll(_req: Request, res: Response) {
  try {
    const invoices = loadInvoices();
    res.json(invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (err) {
    console.error("[invoices.getAll]", err);
    res.status(500).json({ message: "Faturalar yüklenemedi" });
  }
}

export function getById(req: Request, res: Response) {
  try {
    const invoices = loadInvoices();
    const invoice = invoices.find((i) => i.id === req.params.id);
    if (!invoice) return res.status(404).json({ message: "Fatura bulunamadı" });
    res.json(invoice);
  } catch (err) {
    console.error("[invoices.getById]", err);
    res.status(500).json({ message: "Fatura yüklenemedi" });
  }
}

export function create(req: Request, res: Response) {
  try {
    const invoices = loadInvoices();
    const no = getNextInvoiceNo(invoices);
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      no,
      date: new Date().toISOString(),
      status: "bekliyor",
      notes: "",
      dueDate: null,
      ...req.body,
    };
    invoices.unshift(newInvoice);
    saveInvoices(invoices);
    res.status(201).json(newInvoice);
  } catch (err) {
    console.error("[invoices.create]", err);
    res.status(500).json({ message: "Fatura oluşturulamadı" });
  }
}

export function update(req: Request, res: Response) {
  try {
    const invoices = loadInvoices();
    const idx = invoices.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Fatura bulunamadı" });
    invoices[idx] = { ...invoices[idx], ...req.body };
    saveInvoices(invoices);
    res.json(invoices[idx]);
  } catch (err) {
    console.error("[invoices.update]", err);
    res.status(500).json({ message: "Fatura güncellenemedi" });
  }
}

export function remove(req: Request, res: Response) {
  try {
    const invoices = loadInvoices();
    const idx = invoices.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Fatura bulunamadı" });
    invoices.splice(idx, 1);
    saveInvoices(invoices);
    res.json({ message: "Fatura silindi" });
  } catch (err) {
    console.error("[invoices.remove]", err);
    res.status(500).json({ message: "Fatura silinemedi" });
  }
}

// ─── Kasa CRUD ────────────────────────────────────────────────────────────────
export function getCashflow(_req: Request, res: Response) {
  try {
    const entries = loadCashflow();
    const invoices = loadInvoices();

    // Bakiye yükleme faturaları cashflow'da zaten "Bakiye Ekleme Geliri" olarak kayıtlı,
    // bu yüzden paidInvoices hesabından hariç tutuyoruz (çift sayımı önlemek için)
    const paidInvoices = invoices.filter((i) => i.status === "odendi" && !i.isBakiyeYukleme);
    const totalInvoiceIncome = paidInvoices.reduce((s, i) => s + i.total, 0);

    const manualIncome = entries.filter((e) => e.type === "gelir").reduce((s, e) => s + e.amount, 0);
    const manualExpense = entries.filter((e) => e.type === "gider").reduce((s, e) => s + e.amount, 0);

    const totalIncome = totalInvoiceIncome + manualIncome;
    const totalExpense = manualExpense;
    const net = totalIncome - totalExpense;

    const months: { month: string; gelir: number; gider: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });

      const gelir = entries
        .filter((e) => e.type === "gelir" && e.date.startsWith(key))
        .reduce((s, e) => s + e.amount, 0)
        + paidInvoices
          .filter((inv) => inv.date.startsWith(key))
          .reduce((s, inv) => s + inv.total, 0);

      const gider = entries
        .filter((e) => e.type === "gider" && e.date.startsWith(key))
        .reduce((s, e) => s + e.amount, 0);

      months.push({ month: label, gelir, gider });
    }

    res.json({
      totalIncome,
      totalExpense,
      net,
      months,
      entries: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    });
  } catch (err) {
    console.error("[invoices.getCashflow]", err);
    res.status(500).json({ message: "Nakit akışı yüklenemedi" });
  }
}

export function addCashflowEntry(req: Request, res: Response) {
  try {
    const entries = loadCashflow();
    const entry: CashflowEntry = {
      id: `cf-${Date.now()}`,
      date: new Date().toISOString(),
      ...req.body,
    };
    entries.push(entry);
    saveCashflow(entries);
    res.status(201).json(entry);
  } catch (err) {
    console.error("[invoices.addCashflowEntry]", err);
    res.status(500).json({ message: "Kayıt eklenemedi" });
  }
}

export function removeCashflowEntry(req: Request, res: Response) {
  try {
    const entries = loadCashflow();
    const idx = entries.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Kayıt bulunamadı" });
    entries.splice(idx, 1);
    saveCashflow(entries);
    res.json({ message: "Kayıt silindi" });
  } catch (err) {
    console.error("[invoices.removeCashflowEntry]", err);
    res.status(500).json({ message: "Kayıt silinemedi" });
  }
}