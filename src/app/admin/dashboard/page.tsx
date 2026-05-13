"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RecentSupport from "@/components/dashboard/RecentSupport";
import QuickLinks from "@/components/dashboard/QuickLinks";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface Stats {
  totalOrders: number;
  ordersThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  totalCustomers: number;
  customersThisMonth: number;
  openSupport: number;
  pendingSupport: number;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + " ₺";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.dashboard.getStats().then((data) => setStats(data as Stats)).catch(console.error);
  }, []);

  const statCards = stats
    ? [
        { label: "Toplam Sipariş", value: String(stats.totalOrders), sub: `+${stats.ordersThisMonth} bu ay`, subPositive: true },
        { label: "Tahsil Edilen", value: formatCurrency(stats.totalRevenue), sub: `${formatCurrency(stats.revenueThisMonth)} bu ay`, subPositive: true },
        { label: "Toplam Müşteri", value: String(stats.totalCustomers), sub: `+${stats.customersThisMonth} bu ay`, subPositive: true },
        { label: "Açık Destek", value: String(stats.openSupport), sub: `${stats.pendingSupport} beklemede`, subPositive: stats.pendingSupport === 0 },
      ]
    : [
        { label: "Toplam Sipariş", value: "—", sub: "yükleniyor...", subPositive: true },
        { label: "Toplam Getiri", value: "—", sub: "yükleniyor...", subPositive: true },
        { label: "Toplam Müşteri", value: "—", sub: "yükleniyor...", subPositive: true },
        { label: "Açık Destek", value: "—", sub: "yükleniyor...", subPositive: true },
      ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold text-white">Genel Bakış</h1>
        <p className="text-sm text-white/40 mt-1">Hoşgeldiniz, Kerem Uğurdoğan</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <RecentActivity />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
        >
          <RecentSupport />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, duration: 0.4 }}
      >
        <QuickLinks />
      </motion.div>
    </div>
  );
}