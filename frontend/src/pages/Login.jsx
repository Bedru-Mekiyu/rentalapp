// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import logoImage from "../assets/Screenshot.png";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    const result = await login(form.email, form.password);

    setLoading(false);

    if (result.success) {
      toast.success("Login successful! Welcome back.");
      navigate("/dashboard");
      return;
    }

    setError(result.message || "Invalid email or password");
    toast.error(result.message || "Login failed");
  };

  return (
    <div className="page-transition relative flex min-h-screen w-screen items-start justify-center overflow-y-auto bg-linear-to-br from-[#d2eceb] via-[#e8eff2] to-[#cdeaf4] p-1 sm:items-center">
      <div className="grid min-h-[calc(100vh-8px)] h-auto w-[calc(100vw-8px)] grid-rows-[auto_1fr] overflow-visible rounded-[1.9rem] border border-slate-200/80 bg-[#f4f6f7] shadow-[0_20px_55px_-35px_rgba(15,23,42,0.35)] lg:h-[calc(100vh-8px)] lg:grid-cols-2 lg:grid-rows-1 lg:overflow-hidden">
        <section className="relative flex min-h-[180px] items-center justify-center p-0 sm:min-h-[220px] lg:min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_32%)]" />
          <div className="relative z-10 flex h-full max-h-[260px] w-full items-center justify-center bg-[#f8f8f8] p-6 sm:max-h-[320px] sm:p-8 lg:max-h-none lg:p-12">
            <img
              src={logoImage}
              alt="Ethiopia islamic affairs superm counsil logo"
              className="h-full w-full max-w-136 object-contain"
            />
          </div>
        </section>

        <section className="flex min-h-0 items-center justify-center bg-[#f8f8f8] p-0">
          <div className="h-full w-full p-6 sm:p-8 lg:py-12 lg:pl-6 lg:pr-12 lg:translate-y-20">
            <div className="mb-6 border-b border-slate-100 pb-5 sm:mb-7 sm:pb-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Secure portal
              </div>
              <h1 className="text-[2.2rem] font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[2.7rem]">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                    className="form-input h-11 sm:h-12 px-4 text-sm"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="form-input h-11 px-4 pr-11 text-sm sm:h-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                  className={`btn-primary w-full justify-center py-2 text-sm sm:py-2.5 ${
                  loading ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 max-w-sm border-t border-slate-100 pt-4 text-left">
              <p className="text-xs text-slate-500">
                First time? Contact your administrator to create an account.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
