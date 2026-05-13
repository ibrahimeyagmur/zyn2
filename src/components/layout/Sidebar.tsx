"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Users,
  Headphones,
  Layers,
  Settings,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups } from "@/data/mock";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchModal from "./SearchModal";
import NotificationsPanel from "./NotificationsPanel";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Users,
  Headphones,
  Layers,
  Settings,
  MessageCircle,
};

type NavChild = { label: string; href: string };
type NavItem =
  | { label: string; href: string; icon: string; children?: undefined }
  | { label: string; icon: string; href?: undefined; children: NavChild[] };

function SidebarContent({
  collapsed,
  setCollapsed,
  onClose,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  function handleLogout() {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  }

  function toggleGroup(label: string) {
    setOpenGroup((prev) => (prev === label ? null : label));
  }

  function isGroupActive(children: NavChild[]) {
    return children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-white/[0.06] py-5",
        collapsed ? "justify-center px-2" : "gap-3 px-5"
      )}>
        {!collapsed && (
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-white/10">
            <Image src="/logo.webp" alt="Logo" width={32} height={32} className="object-cover w-full h-full" />
          </div>
        )}
        {!collapsed && (
          <span className="font-bold text-white text-base tracking-tight flex-1">Berilis</span>
        )}
        {onClose && (
          <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors cursor-pointer md:hidden">
            <X size={16} />
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/20 hover:text-white/60 transition-colors cursor-pointer hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/[0.04]"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Arama */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-white/25 cursor-pointer hover:bg-white/[0.07] transition-colors"
          >
            <Search size={13} />
            <span className="text-xs">Ara...</span>
          </div>
        </div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Navigasyon */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-2 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {(group.items as NavItem[]).map((item) => {
                if (item.children) {
                  const Icon = iconMap[item.icon];
                  const active = isGroupActive(item.children);
                  const open = openGroup === item.label;

                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleGroup(item.label)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                          active
                            ? "text-white/90 bg-white/[0.06]"
                            : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                        )}
                      >
                        {Icon && <Icon size={16} className="shrink-0" />}
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left font-medium">{item.label}</span>
                            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown size={13} className="text-white/20" />
                            </motion.div>
                          </>
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {!collapsed && open && (
                          <motion.div
                            key="dropdown"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="ml-6 mt-1 border-l border-white/[0.06] pl-3 space-y-0.5 pb-1">
                              {item.children.map((child) => {
                                const childActive = pathname === child.href;
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={onClose}
                                    className={cn(
                                      "block py-1.5 text-sm transition-colors cursor-pointer",
                                      childActive ? "text-white font-medium" : "text-white/35 hover:text-white/70"
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                const Icon = iconMap[item.icon];
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                      active
                        ? "bg-white/10 text-white font-medium"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                    )}
                  >
                    {Icon && <Icon size={16} className="shrink-0" />}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Alt kısım */}
      <div className="border-t border-white/[0.06]">
        {/* Bildirimler */}
        <div className="px-3 py-2 relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-colors cursor-pointer relative"
          >
            <span className="relative shrink-0">
              <Bell size={16} />
              {unreadCount > 0 && collapsed && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Bildirimler</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </>
            )}
          </button>
          <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} onUnreadChange={setUnreadCount} />
        </div>

        {/* Kullanıcı + Logout */}
        <div className={cn("px-3 py-3", collapsed ? "flex justify-center" : "")}>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white/10">
                <Image src="/logo.webp" alt="Kerem Uğurdoğan" width={32} height={32} className="object-cover w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">Kerem Uğurdoğan</p>
                <p className="text-[10px] text-white/30 truncate">Tasarımcı</p>
              </div>
              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="text-white/20 hover:text-red-400 transition-colors cursor-pointer shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Çıkış Yap"
              className="text-white/20 hover:text-red-400 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04]"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden bg-[#111111] border border-white/[0.08] rounded-xl p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 h-full w-72 z-50 bg-[#111111] border-r border-white/[0.06] md:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <SidebarContent
                collapsed={false}
                setCollapsed={() => {}}
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen border-r transition-[width] duration-300 shrink-0",
          "bg-[#111111] border-white/[0.06]",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}