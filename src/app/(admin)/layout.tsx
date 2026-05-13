import Sidebar from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0a0a0a" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#0a0a0a" }}>
        {children}
      </main>
    </div>
  );
}