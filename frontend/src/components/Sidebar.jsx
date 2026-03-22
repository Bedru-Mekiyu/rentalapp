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
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const menuItems = {
  ADMIN: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/units", label: "Units", icon: Building2 },
    { to: "/leases", label: "Leases", icon: FileText },
    { to: "/payments", label: "Payments", icon: CreditCard },
    { to: "/finance", label: "Finance", icon: PiggyBank },
    { to: "/users", label: "Users", icon: Users },
  ],
  PM: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/units", label: "Unit Management", icon: Building2 },
    { to: "/leases", label: "Lease Management", icon: FileText },
    { to: "/tenants", label: "Tenant Management", icon: Users },
    { to: "/payments", label: "Payments", icon: CreditCard },
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
    <aside className="sidebar-shell hidden w-64 shrink-0 px-5 pb-8 pt-6 md:block">
      <div className="surface-panel h-full px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="app-title text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Navigation
          </h2>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                [
                  "nav-item group",
                  isItemActive(item.to) ? "nav-item-active" : "nav-item-idle",
                ].join(" ")
              }
            >
              <span className="nav-icon transition-transform duration-300 group-hover:scale-110">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="transition-all duration-300">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
