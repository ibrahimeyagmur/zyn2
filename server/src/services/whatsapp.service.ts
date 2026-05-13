import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import { EventEmitter } from "events";

export type WAStatus = "disconnected" | "qr" | "connecting" | "ready";

interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  phone: string | null;
  name: string | null;
}

class WhatsAppService extends EventEmitter {
  private client: Client | null = null;
  private state: WAState = {
    status: "disconnected",
    qrDataUrl: null,
    phone: null,
    name: null,
  };

  getState(): WAState {
    return { ...this.state };
  }

  async initialize() {
    if (this.client) {
      const old = this.client;
      this.client = null;
      // logout() session dosyalarını siliyor, Windows'ta EBUSY verebilir — atla
      try { await old.destroy().catch(() => {}); } catch { /* ignore */ }
    }

    this.setState({ status: "connecting", qrDataUrl: null, phone: null, name: null });

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      },
    });

    this.client.on("qr", async (qr) => {
      try {
        const dataUrl = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
        this.setState({ status: "qr", qrDataUrl: dataUrl });
        this.emit("qr", dataUrl);
      } catch (err) {
        console.error("[WA] QR oluşturma hatası:", err);
      }
    });

    this.client.on("ready", async () => {
      try {
        const info = this.client!.info;
        this.setState({
          status: "ready",
          qrDataUrl: null,
          phone: info.wid.user,
          name: info.pushname || null,
        });
        this.emit("ready", this.state);
      } catch {
        this.setState({ status: "ready", qrDataUrl: null });
        this.emit("ready", this.state);
      }
    });

    this.client.on("authenticated", () => {
      this.setState({ status: "connecting", qrDataUrl: null });
      this.emit("authenticated");
    });

    this.client.on("auth_failure", () => {
      this.setState({ status: "disconnected", qrDataUrl: null, phone: null, name: null });
      this.emit("disconnected");
    });

    this.client.on("disconnected", () => {
      this.setState({ status: "disconnected", qrDataUrl: null, phone: null, name: null });
      this.emit("disconnected");
    });

    await this.client.initialize();
  }

  async disconnect() {
    if (this.client) {
      const c = this.client;
      this.client = null;
      // logout() Windows'ta EBUSY hatasına yol açıyor — sadece destroy() kullan
      try { await c.destroy().catch(() => {}); } catch { /* ignore */ }
    }
    this.setState({ status: "disconnected", qrDataUrl: null, phone: null, name: null });
    this.emit("disconnected");
  }

  async sendMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (this.state.status !== "ready" || !this.client) {
      return { success: false, error: "WhatsApp bağlı değil" };
    }
    try {
      // Türkiye numarası için format: 905xxxxxxxxx@c.us
      const normalized = this.normalizePhone(phone);
      await this.client.sendMessage(`${normalized}@c.us`, message);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  async sendOTP(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    const message = `🔐 *Berilis Doğrulama Kodu*\n\nKodunuz: *${code}*\n\nBu kod 10 dakika geçerlidir. Kodu kimseyle paylaşmayın.`;
    return this.sendMessage(phone, message);
  }

  private normalizePhone(phone: string): string {
    // Sadece rakamları al
    let digits = phone.replace(/\D/g, "");
    // Türkiye: 0 ile başlıyorsa 90 ekle
    if (digits.startsWith("0") && digits.length === 11) {
      digits = "9" + digits;
    }
    // Başında + yoksa ve 10 haneli ise 90 ekle
    if (digits.length === 10) {
      digits = "90" + digits;
    }
    return digits;
  }

  private setState(partial: Partial<WAState>) {
    this.state = { ...this.state, ...partial };
    this.emit("state", this.state);
  }
}

// Singleton
export const waService = new WhatsAppService();