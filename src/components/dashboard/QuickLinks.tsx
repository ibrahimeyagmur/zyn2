import Link from "next/link";
import { ShoppingBag, Receipt, UserPlus, Headphones } from "lucide-react";
import { quickLinks } from "@/data/mock";

const iconMap: Record<string, React.ElementType> = {
  ShoppingBag,
  Receipt,
  UserPlus,
  Headphones,
};

export default function QuickLinks() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">Hızlı Erişim</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map((link) => {
          const Icon = iconMap[link.icon];
          return (
            <Link
              key={link.href}
              href={link.href}
              className="bg-[#161616] border border-white/[0.06] rounded-xl px-4 py-4 flex flex-col gap-2 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-colors">
                {Icon && <Icon size={15} className="text-white/50 group-hover:text-white/70 transition-colors" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80">{link.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}