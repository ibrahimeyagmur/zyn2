import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";

const DATA_PATH = path.join(__dirname, "../data/deliveries.json");
const UPLOADS_DIR = path.join(__dirname, "../../../public/uploads/deliveries");

// Uploads klasörü yoksa oluştur
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config — 200MB limit (tasarım dosyaları büyük olabilir)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

export const uploadDelivery = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

interface Delivery {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  ad: string;
  aciklama: string;
  tur: string;
  dosyaUrl: string;
  dosyaAd: string;
  dosyaBoyut: number;
  dosyaTip: string;
  createdAt: string;
}

function readDeliveries(): Delivery[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeDeliveries(data: Delivery[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// GET /api/deliveries — tüm teslimler (admin)
export function getDeliveries(_req: Request, res: Response) {
  const deliveries = readDeliveries();
  res.json(deliveries);
}

// GET /api/deliveries/order/:orderId — sipariş bazlı teslimler
export function getDeliveriesByOrder(req: Request, res: Response) {
  const { orderId } = req.params;
  const deliveries = readDeliveries().filter((d) => d.orderId === orderId);
  res.json(deliveries);
}

// GET /api/deliveries/customer/:customerId — müşteri bazlı teslimler
export function getDeliveriesByCustomer(req: Request, res: Response) {
  const { customerId } = req.params;
  const deliveries = readDeliveries().filter((d) => d.customerId === customerId);
  res.json(deliveries);
}

// POST /api/deliveries — yeni teslimat (dosya upload ile)
export function createDelivery(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Dosya zorunludur" });
  }

  const { orderId, customerId, customerName, ad, aciklama, tur } = req.body;
  if (!orderId || !customerId || !ad) {
    fs.unlink(file.path, () => {});
    return res.status(400).json({ message: "orderId, customerId ve ad zorunludur" });
  }

  const deliveries = readDeliveries();
  const newDelivery: Delivery = {
    id: `dlv-${Date.now()}`,
    orderId,
    customerId,
    customerName: customerName || "",
    ad: ad.trim(),
    aciklama: aciklama?.trim() || "",
    tur: tur?.trim() || "Genel",
    dosyaUrl: `/uploads/deliveries/${file.filename}`,
    dosyaAd: file.originalname,
    dosyaBoyut: file.size,
    dosyaTip: file.mimetype,
    createdAt: new Date().toISOString(),
  };
  deliveries.push(newDelivery);
  writeDeliveries(deliveries);
  res.status(201).json(newDelivery);
}

// DELETE /api/deliveries/:id — teslimat sil
export function deleteDelivery(req: Request, res: Response) {
  const { id } = req.params;
  const deliveries = readDeliveries();
  const idx = deliveries.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ message: "Teslimat bulunamadı" });

  const delivery = deliveries[idx];
  const filePath = path.join(__dirname, "../../../public", delivery.dosyaUrl);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {});
  }

  deliveries.splice(idx, 1);
  writeDeliveries(deliveries);
  res.json({ success: true });
}