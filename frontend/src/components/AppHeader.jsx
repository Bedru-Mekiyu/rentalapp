import { useAuthStore } from "../store/authStore";
import logoImage from "../assets/Screenshot.png";

export default function AppHeader({ title }) {
  const { user } = useAuthStore();

  const initials = (user?.fullName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="nav-shell" role="banner">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <img
            src={logoImage}
            alt="Rental Management Logo"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <h1 className="app-title text-lg font-semibold text-slate-900">
            {title}
          </h1>
        </div>
        {user && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white"
            aria-label={`Profile: ${user.fullName}`}
            role="img"
          >
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
