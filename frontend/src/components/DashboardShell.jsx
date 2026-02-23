// src/components/DashboardShell.jsx
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardShell({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen text-slate-900">
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
            <header className="space-y-1">
              <h1 className="page-title tracking-tight">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
