import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(__dirname, "../data/coupons.json");

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  usageLimit: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
  assignedTo: string[];
  durum: "aktif" | "pasif";
  createdAt: string;
}

function load(): Coupon[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as Coupon[];
  } catch {
    return [];
  }
}

function save(data: Coupon[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getAll(_req: Request, res: Response) {
  const coupons = load();
  res.json(coupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export function getById(req: Request, res: Response) {
  const coupons = load();
  const coupon = coupons.find((c) => c.id === req.params.id);
  if (!coupon) return res.status(404).json({ message: "Kupon bulunamadı" });
  res.json(coupon);
}

export function create(req: Request, res: Response) {
  const coupons = load();
  const newCoupon: Coupon = {
    id: `KPN-${String(Date.now()).slice(-6)}`,
    createdAt: new Date().toISOString(),
    usedCount: 0,
    assignedTo: [],
    durum: "aktif",
    ...req.body,
  };
  coupons.push(newCoupon);
  save(coupons);
  res.status(201).json(newCoupon);
}

export function update(req: Request, res: Response) {
  const coupons = load();
  const idx = coupons.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Kupon bulunamadı" });
  coupons[idx] = { ...coupons[idx], ...req.body };
  save(coupons);
  res.json(coupons[idx]);
}

export function remove(req: Request, res: Response) {
  const coupons = load();
  const idx = coupons.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Kupon bulunamadı" });
  coupons.splice(idx, 1);
  save(coupons);
  res.json({ message: "Kupon silindi" });
}

// Müşterilere kupon ata
export function assign(req: Request, res: Response) {
  const coupons = load();
  const idx = coupons.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Kupon bulunamadı" });

  const { customerIds }: { customerIds: string[] } = req.body;
  const existing = coupons[idx].assignedTo || [];
  const merged = Array.from(new Set([...existing, ...customerIds]));
  coupons[idx].assignedTo = merged;
  save(coupons);
  res.json(coupons[idx]);
}

// Müşteriden kuponu kaldır
export function unassign(req: Request, res: Response) {
  const coupons = load();
  const idx = coupons.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Kupon bulunamadı" });

  const { customerId }: { customerId: string } = req.body;
  coupons[idx].assignedTo = (coupons[idx].assignedTo || []).filter((id) => id !== customerId);
  save(coupons);
  res.json(coupons[idx]);
}

// ─── Kupon Doğrulama (müşteri sipariş akışı) ─────────────────────────────────

export function validateCoupon(req: Request, res: Response) {
  const { code, customerId, orderTotal } = req.body as {
    code: string;
    customerId: string;
    orderTotal: number;
  };

  if (!code || !customerId || orderTotal === undefined) {
    return res.status(400).json({ message: "Eksik parametre" });
  }

  const coupons = load();
  const coupon = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());

  if (!coupon) {
    return res.status(404).json({ message: "Geçersiz kupon kodu" });
  }

  // Pasif mi?
  if (coupon.durum !== "aktif") {
    return res.status(400).json({ message: "Bu kupon aktif değil" });
  }

  // Tarih kontrolü
  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return res.status(400).json({ message: "Bu kupon henüz geçerli değil" });
  }
  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return res.status(400).json({ message: "Bu kuponun süresi doldu" });
  }

  // Kullanım limiti
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ message: "Bu kuponun kullanım limiti doldu" });
  }

  // Müşteri yetkisi
  if (!coupon.isPublic) {
    if (!coupon.assignedTo.includes(customerId)) {
      return res.status(403).json({ message: "Bu kupon size özel değil" });
    }
  }

  // Minimum sipariş tutarı
  if (orderTotal < coupon.minOrder) {
    return res.status(400).json({
      message: `Bu kupon için minimum sipariş tutarı ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(coupon.minOrder)}`,
    });
  }

  // İndirim hesapla
  let discount = 0;
  if (coupon.type === "percent") {
    discount = Math.round(orderTotal * (coupon.value / 100));
  } else {
    discount = coupon.value;
  }
  discount = Math.min(discount, orderTotal); // fiyatı aşamaz

  return res.json({
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    finalTotal: orderTotal - discount,
    description: coupon.type === "percent"
      ? `%${coupon.value} indirim`
      : `${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(coupon.value)} indirim`,
  });
}

// ─── Kullanım artır (orders controller'dan çağrılır) ─────────────────────────

export function incrementUsage(couponId: string) {
  const coupons = load();
  const idx = coupons.findIndex((c) => c.id === couponId);
  if (idx !== -1) {
    coupons[idx].usedCount = (coupons[idx].usedCount || 0) + 1;
    save(coupons);
  }
}