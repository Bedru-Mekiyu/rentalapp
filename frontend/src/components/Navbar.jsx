// src/components/Navbar.jsx
import { useAuthStore } from "../store/authStore";
import { LogOut } from "lucide-react";
import logoImage from "../assets/Screenshot.png";

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="nav-shell fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="Ethiopia islamic affairs superm counsil Logo"
            className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-emerald-500/20 sm:h-11 sm:w-11"
          />
          <div className="min-w-0 flex flex-col">
            <span className="app-title block max-w-[46vw] truncate bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-[0.78rem] font-bold leading-tight text-transparent sm:max-w-none sm:text-lg">
              Ethiopia islamic affairs superm counsil
            </span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2 text-sm md:gap-5">
            <div className="hidden text-right sm:block">
              <div className="font-semibold text-slate-900">
                {user.fullName}
              </div>
              <div className="text-xs text-slate-500">
                {user.email}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <button
              onClick={logout}
              className="btn-primary flex items-center gap-2 px-3 py-2 text-xs font-semibold sm:px-4"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
