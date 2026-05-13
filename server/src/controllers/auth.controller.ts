import { Request, Response } from "express";
import fs from "fs";
import path from "path";

// Sabit kullanıcı — gerçek DB'ye geçişte burası değişir
const ADMIN_USER = {
  email: "admin@berilis.com",
  password: "berilis2024",
  name: "Kerem Uğurdoğan",
  role: "admin",
};

const CUSTOMERS_FILE = path.join(__dirname, "../data/customers.json");

function loadCustomers(): any[] {
  try {
    return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

export function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "E-posta ve şifre gerekli" });
  }

  if (email !== ADMIN_USER.email || password !== ADMIN_USER.password) {
    return res.status(401).json({ message: "E-posta veya şifre hatalı" });
  }

  res.json({
    success: true,
    user: { name: ADMIN_USER.name, email: ADMIN_USER.email, role: ADMIN_USER.role },
    token: "berilis-admin-token",
  });
}

export function me(req: Request, res: Response) {
  const auth = req.headers.authorization;
  if (auth !== "Bearer berilis-admin-token") {
    return res.status(401).json({ message: "Yetkisiz erişim" });
  }
  res.json({ name: ADMIN_USER.name, email: ADMIN_USER.email, role: ADMIN_USER.role });
}

export function customerLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "E-posta ve şifre gerekli" });
  }

  const customers = loadCustomers();
  const customer = customers.find((c: any) => c.email === email);
  if (!customer) {
    return res.status(401).json({ message: "E-posta veya şifre hatalı" });
  }

  if (customer.passwordHash !== simpleHash(password)) {
    return res.status(401).json({ message: "E-posta veya şifre hatalı" });
  }

  const token = `customer_${customer.id}_${Date.now()}`;

  res.cookie("customer_token", token, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
    path: "/",
  });

  res.json({
    success: true,
    customer: {
      id: customer.id,
      ad: customer.ad,
      email: customer.email,
      balance: customer.balance ?? 0,
    },
    token,
  });
}

export function customerLogout(req: Request, res: Response) {
  res.clearCookie("customer_token");
  res.json({ success: true });
}
