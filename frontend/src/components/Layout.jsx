// src/components/Layout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <Navbar />
      <div className="relative flex min-h-[calc(100vh-64px)] pt-16">
        <Sidebar />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
