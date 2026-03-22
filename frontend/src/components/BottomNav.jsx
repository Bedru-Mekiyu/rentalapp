import { Home, DollarSign, Wrench } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    const pathname = location.pathname;

    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="nav-shell fixed bottom-0 right-0 left-0 z-50 flex justify-around p-3 text-sm sm:hidden">
      
      {/* Dashboard */}
      <div
        onClick={() => navigate("/dashboard")}
        className={`flex flex-col items-center cursor-pointer ${
          isActive("/dashboard") ? "text-primary-600" : "text-slate-400"
        }`}
      >
        <Home size={20} />
        <span>Dashboard</span>
      </div>

      {/* Payments */}
      <div
        onClick={() => navigate("/payments")}
        className={`flex flex-col items-center cursor-pointer ${
          isActive("/payments") ? "text-primary-600" : "text-slate-400"
        }`}
      >
        <DollarSign size={20} />
        <span>Payments</span>
      </div>

      {/* Maintenance */}
      <div
        onClick={() => navigate("/maintenance")}
        className={`flex flex-col items-center cursor-pointer ${
          isActive("/maintenance") ? "text-primary-600" : "text-slate-400"
        }`}
      >
        <Wrench size={20} />
        <span>Maintenance</span>
      </div>
    </div>
  );
}
