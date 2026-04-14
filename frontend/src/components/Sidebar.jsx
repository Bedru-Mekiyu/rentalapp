// src/components/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  PiggyBank,
  Users,
  ClipboardList,
  Home,
  Wrench,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const menuItems = {
  ADMIN: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/units", label: "Units", icon: Building2 },
    { to: "/leases", label: "Leases", icon: FileText },
    { to: "/tenants", label: "Tenants", icon: Users },
    { to: "/payments", label: "Payments", icon: CreditCard },
    { to: "/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/finance", label: "Finance", icon: PiggyBank },
    { to: "/users", label: "Users", icon: Users },
  ],
  PM: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/units", label: "Units", icon: Building2 },
    { to: "/leases", label: "Leases", icon: FileText },
    { to: "/tenants", label: "Tenants", icon: Users },
    { to: "/payments", label: "Payments", icon: CreditCard },
    { to: "/maintenance", label: "Maintenance", icon: Wrench },
  ],
  FS: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/payments", label: "Payments", icon: CreditCard },
    { to: "/finance", label: "Financial Summary", icon: PiggyBank },
  ],
  GM: [
    { to: "/dashboard", label: "Analytics Dashboard", icon: ClipboardList },
    { to: "/leases", label: "Leases", icon: FileText },
    { to: "/units", label: "Units", icon: Building2 },
  ],
  TENANT: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/my-lease", label: "My Lease", icon: Home },
    { to: "/payments", label: "Payment History", icon: CreditCard },
  ],
};

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const items = menuItems[user?.role] || [];

  const isItemActive = (to) => {
    const pathname = location.pathname;

    if (to === "/my-lease") {
      return pathname === "/my-lease" || pathname.startsWith("/leases/");
    }

    if (to === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === to || pathname.startsWith(`${to}/`);
  };

  if (items.length === 0) return null;

  return (
    <aside className="sidebar-shell hidden w-48 shrink-0 pl-4 pr-3 pb-6 pt-6 md:block">
      <div className="h-full">
        <div className="mb-4 flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Menu
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/30 to-transparent" />
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {items.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                [
                  "nav-item group relative overflow-hidden",
                  isItemActive(item.to) ? "nav-item-active" : "nav-item-idle",
                ].join(" ")
              }
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="nav-icon relative z-10">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="relative z-10">{item.label}</span>
              {isItemActive(item.to) && (
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-100" />
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
