import { Home, DollarSign, Wrench } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="nav-shell fixed bottom-0 right-0 left-0 flex justify-around p-3 text-sm shadow-lg">
      
      {/* Dashboard */}
      <div
        onClick={() => navigate("/dashboard")}
        className={`flex flex-col items-center cursor-pointer ${
          isActive("/dashboard") ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        <Home size={20} />
        <span>Dashboard</span>
      </div>

      {/* Payments */}
      <div
        onClick={() => navigate("/payments")}
        className={`flex flex-col items-center cursor-pointer ${
          isActive("/payments") ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        <DollarSign size={20} />
        <span>Payments</span>
      </div>

      {/* Maintenance */}
      <div
        onClick={() => navigate("/maintenance")}
        className={`flex flex-col items-center cursor-pointer ${
          isActive("/maintenance") ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        <Wrench size={20} />
        <span>Maintenance</span>
      </div>
    </div>
  );
}
