import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0a0a0a" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0" style={{ backgroundColor: "#0a0a0a" }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}