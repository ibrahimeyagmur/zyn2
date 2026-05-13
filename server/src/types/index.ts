export type OrderStatus = "devam" | "bekliyor" | "tamamlandi" | "iptal";
export type SupportPriority = "yuksek" | "orta" | "dusuk";
export type SupportStatus = "acik" | "bekliyor" | "kapali";
export type InvoiceStatus = "odendi" | "bekliyor" | "gecikti";

export interface Order {
  id: string;
  customer: string;
  customerId: string;
  service: string;
  status: OrderStatus;
  amount: number;
  date: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  orderId?: string;
  customer: string;
  customerId: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  customer: string;
  customerId: string;
  priority: SupportPriority;
  status: SupportStatus;
  date: string;
  message?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
}

export interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  ordersThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  totalCustomers: number;
  customersThisMonth: number;
  openSupport: number;
  pendingSupport: number;
}