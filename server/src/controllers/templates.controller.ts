import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(__dirname, "../data/templates.json");

type Template = {
  id: string;
  komut: string;
  baslik: string;
  icerik: string;
  createdAt: string;
};

function load(): Template[] {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}
function save(data: Template[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getAll(_req: Request, res: Response) {
  try {
    res.json(load());
  } catch (err) {
    console.error("[templates.getAll]", err);
    res.status(500).json({ message: "Şablonlar yüklenemedi" });
  }
}

export function create(req: Request, res: Response) {
  try {
    const { komut, baslik, icerik } = req.body;
    if (!komut || !icerik) return res.status(400).json({ message: "Komut ve içerik gerekli" });

    const templates = load();
    // Komut benzersiz olmalı
    if (templates.some((t) => t.komut === komut.toLowerCase().trim())) {
      return res.status(409).json({ message: "Bu komut zaten mevcut" });
    }

    const newTemplate: Template = {
      id: `TPL-${Date.now()}`,
      komut: komut.toLowerCase().trim(),
      baslik: baslik || komut,
      icerik,
      createdAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    save(templates);
    res.status(201).json(newTemplate);
  } catch (err) {
    console.error("[templates.create]", err);
    res.status(500).json({ message: "Şablon oluşturulamadı" });
  }
}

export function update(req: Request, res: Response) {
  try {
    const templates = load();
    const idx = templates.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Şablon bulunamadı" });

    const { komut, baslik, icerik } = req.body;
    // Komut değiştiyse benzersizlik kontrolü
    if (komut && komut !== templates[idx].komut) {
      if (templates.some((t, i) => i !== idx && t.komut === komut.toLowerCase().trim())) {
        return res.status(409).json({ message: "Bu komut zaten mevcut" });
      }
    }

    templates[idx] = {
      ...templates[idx],
      ...(komut && { komut: komut.toLowerCase().trim() }),
      ...(baslik && { baslik }),
      ...(icerik && { icerik }),
    };
    save(templates);
    res.json(templates[idx]);
  } catch (err) {
    console.error("[templates.update]", err);
    res.status(500).json({ message: "Şablon güncellenemedi" });
  }
}

export function remove(req: Request, res: Response) {
  try {
    const templates = load();
    const idx = templates.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Şablon bulunamadı" });
    templates.splice(idx, 1);
    save(templates);
    res.json({ message: "Şablon silindi" });
  } catch (err) {
    console.error("[templates.remove]", err);
    res.status(500).json({ message: "Şablon silinemedi" });
  }
}