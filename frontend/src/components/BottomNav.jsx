import { Home, DollarSign, Wrench } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { memo } from "react";

const NavItem = memo(function NavItem({ to, icon: Icon, label, isActive, onNavigate }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(to);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onNavigate(to)}
      onKeyDown={handleKeyDown}
      className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        isActive ? "text-emerald-600 bg-emerald-50" : "text-slate-500 hover:bg-slate-100"
      }`}
      aria-current={isActive ? "page" : undefined}
      aria-label={label}
    >
      <Icon size={20} aria-hidden="true" />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
});

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/payments", icon: DollarSign, label: "Payments" },
  { to: "/maintenance", icon: Wrench, label: "Maintenance" },
];

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isItemActive = (path) => {
    const pathname = location.pathname;
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav
      className="nav-shell fixed bottom-0 right-0 left-0 z-50 flex justify-around p-2 text-sm sm:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => (
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          isActive={isItemActive(item.to)}
          onNavigate={navigate}
        />
      ))}
    </nav>
  );
}

export default memo(BottomNav);
