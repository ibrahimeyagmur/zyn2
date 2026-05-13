import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  subPositive: boolean;
}

export default function StatCard({ label, value, sub, subPositive }: StatCardProps) {
  return (
    <div className="bg-[#161616] rounded-xl border border-white/[0.06] px-5 py-4 flex flex-col gap-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-3xl font-semibold text-white leading-none">{value}</p>
      <p className={cn("text-xs font-medium", subPositive ? "text-emerald-400" : "text-red-400")}>
        {sub}
      </p>
    </div>
  );
}