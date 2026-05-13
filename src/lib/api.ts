// Tüm API çağrıları buradan yapılır
// Backend URL'ini değiştirmek için sadece bu dosyayı güncelleyin

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API hatası: ${res.status} ${path}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API hatası: ${res.status} ${path}`);
  return res.json();
}

async function put<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API hatası: ${res.status} ${path}`);
  return res.json();
}

// Dashboard
export const api = {
  dashboard: {
    getStats: () => get("/dashboard/stats"),
    getRecentOrders: () => get("/dashboard/recent-orders"),
    getRecentSupport: () => get("/dashboard/recent-support"),
    getCashflow: () => get("/dashboard/cashflow"),
  },
  orders: {
    getAll: () => get("/orders"),
    getActive: () => get("/orders/active"),
    getById: (id: string) => get(`/orders/${id}`),
    create: (data: unknown) => post("/orders", data),
    update: (id: string, data: unknown) => put(`/orders/${id}`, data),
  },
  customers: {
    getAll: () => get("/customers"),
    getById: (id: string) => get(`/customers/${id}`),
    create: (data: unknown) => post("/customers", data),
    update: (id: string, data: unknown) => put(`/customers/${id}`, data),
  },
  invoices: {
    getAll: () => get("/invoices"),
    getCashflow: () => get("/invoices/cashflow"),
    getById: (id: string) => get(`/invoices/${id}`),
    create: (data: unknown) => post("/invoices", data),
    update: (id: string, data: unknown) => put(`/invoices/${id}`, data),
  },
  support: {
    getAll: () => get("/support"),
    getById: (id: string) => get(`/support/${id}`),
    create: (data: unknown) => post("/support", data),
    update: (id: string, data: unknown) => put(`/support/${id}`, data),
  },
  notifications: {
    getAll: () => get("/notifications"),
    markAllRead: () => put("/notifications/read-all"),
    markRead: (id: string) => put(`/notifications/${id}/read`),
  },
};