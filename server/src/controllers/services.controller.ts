import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(__dirname, "../data/services.json");

interface EkBilgiAlani {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
}

interface Service {
  id: string;
  ad: string;
  aciklama: string;
  fiyat: number;
  birim: string;
  kategori: string;
  aktif: boolean;
  ekBilgiler?: EkBilgiAlani[];
  createdAt: string;
}

function readServices(): Service[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeServices(data: Service[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// GET /api/services
export function getServices(_req: Request, res: Response) {
  const services = readServices();
  res.json(services);
}

// GET /api/services/active — sadece aktif hizmetler (müşteri paneli için)
export function getActiveServices(_req: Request, res: Response) {
  const services = readServices().filter((s) => s.aktif);
  res.json(services);
}

// POST /api/services
export function createService(req: Request, res: Response) {
  const { ad, aciklama, fiyat, birim, kategori, aktif, ekBilgiler } = req.body;
  if (!ad || fiyat === undefined) {
    return res.status(400).json({ message: "Ad ve fiyat zorunludur" });
  }
  const services = readServices();
  const newService: Service = {
    id: `svc-${Date.now()}`,
    ad: ad.trim(),
    aciklama: aciklama?.trim() ?? "",
    fiyat: Number(fiyat),
    birim: birim?.trim() || "proje",
    kategori: kategori?.trim() || "Genel",
    aktif: aktif !== false,
    ekBilgiler: Array.isArray(ekBilgiler) ? ekBilgiler : [],
    createdAt: new Date().toISOString(),
  };
  services.push(newService);
  writeServices(services);
  res.status(201).json(newService);
}

// PUT /api/services/:id
export function updateService(req: Request, res: Response) {
  const { id } = req.params;
  const services = readServices();
  const idx = services.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ message: "Hizmet bulunamadı" });

  const { ad, aciklama, fiyat, birim, kategori, aktif, ekBilgiler } = req.body;
  services[idx] = {
    ...services[idx],
    ...(ad !== undefined && { ad: ad.trim() }),
    ...(aciklama !== undefined && { aciklama: aciklama.trim() }),
    ...(fiyat !== undefined && { fiyat: Number(fiyat) }),
    ...(birim !== undefined && { birim: birim.trim() }),
    ...(kategori !== undefined && { kategori: kategori.trim() }),
    ...(aktif !== undefined && { aktif: Boolean(aktif) }),
    ...(ekBilgiler !== undefined && { ekBilgiler: Array.isArray(ekBilgiler) ? ekBilgiler : [] }),
  };
  writeServices(services);
  res.json(services[idx]);
}

// DELETE /api/services/:id
export function deleteService(req: Request, res: Response) {
  const { id } = req.params;
  const services = readServices();
  const idx = services.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ message: "Hizmet bulunamadı" });
  services.splice(idx, 1);
  writeServices(services);
  res.json({ success: true });
}