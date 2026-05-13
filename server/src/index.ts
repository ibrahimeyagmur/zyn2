import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import ordersRoutes from "./routes/orders";
import customersRoutes from "./routes/customers";
import invoicesRoutes from "./routes/invoices";
import supportRoutes from "./routes/support";
import notificationsRoutes from "./routes/notifications";
import couponsRoutes from "./routes/coupons";
import customerRoutes from "./routes/customer";
import templatesRoutes from "./routes/templates";
import servicesRoutes from "./routes/services";
import deliveriesRoutes from "./routes/deliveries";
import whatsappRoutes from "./routes/whatsapp";

const app = express();
const PORT = 5000;

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://berilisdesign.com.tr",
  "https://www.berilisdesign.com.tr",
  "https://api.berilisdesign.com.tr",
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} izinli değil`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/deliveries", deliveriesRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// Static dosya servisi — yüklenen dosyalar için
app.use("/uploads", express.static(path.join(__dirname, "../../public/uploads")));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler — controller'larda yakalanmayan hataları yakalar
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Global Error]", err);
  if (!res.headersSent) {
    res.status(500).json({ message: err.message || "Sunucu hatası" });
  }
});

// whatsapp-web.js LocalAuth.logout() Windows'ta EBUSY fırlatıyor — sessizce geç
process.on("unhandledRejection", (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  if (msg.includes("EBUSY") && msg.includes("wwebjs_auth")) return;
  console.error("[Unhandled Rejection]", reason);
});

app.listen(PORT, () => {
  console.log(`Berilis API sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
