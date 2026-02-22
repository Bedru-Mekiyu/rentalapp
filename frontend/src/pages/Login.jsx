// src/pages/Login.jsx
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    } else {
      setError(result.message || "Invalid email or password");
      toast.error(result.message || "Login failed");
    }
  };

  return (
    <div className="page-transition min-h-screen px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white/80 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative flex flex-col justify-between bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-950 p-8 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-emerald-400/30 blur-3xl" />
            <div className="absolute -bottom-10 right-0 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl" />
          </div>
          <div className="relative space-y-4">
            <span className="pill bg-white/20 text-white">Portfolio OS</span>
            <h1 className="app-title text-3xl font-semibold">
              Rental Management System
            </h1>
            <p className="text-sm text-emerald-100">
              Track units, leases, and payments with a single, high-clarity dashboard.
            </p>
          </div>
          <div className="relative space-y-4 text-sm text-emerald-100">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Real-time occupancy and payment insights
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-teal-300" />
              Role-based dashboards for each team
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-orange-300" />
              Unified audit trail and finance summaries
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8 space-y-2">
            <h2 className="app-title text-2xl font-semibold text-slate-900">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">
              Sign in to continue managing your portfolio.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="form-input text-sm"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="form-input text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition ${
                loading
                  ? "cursor-not-allowed bg-slate-400"
                  : "btn-primary hover:-translate-y-0.5"
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-xs text-slate-500">
            First time? Contact your administrator to create an account.
          </div>
        </div>
      </div>
    </div>
  );
}
