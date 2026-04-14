// src/pages/Login.jsx
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logoImage from "../assets/Screenshot.png";

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
    <div className="page-transition relative flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
      {/* Left Side - Image (hidden on small screens, visible on lg and up) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <img
            src={logoImage}
            alt="Rental Management Platform"
            className="w-full max-w-lg rounded-2xl shadow-2xl shadow-emerald-500/20 object-cover"
          />
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-slate-900">Rental Management</h1>
            <p className="mt-2 text-lg text-slate-600">Property & Finance Platform</p>
            <p className="mt-4 text-sm text-slate-500 max-w-md">
              Streamline your property management with our comprehensive solution for leases, payments, maintenance, and financial tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (full width on mobile, half on lg) */}
      <div className="flex w-full lg:w-1/2 xl:w-2/5 items-center justify-center px-4 py-8 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="mb-8 text-center lg:hidden">
            <img
              src={logoImage}
              alt="Rental Management Logo"
              className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-xl shadow-emerald-500/20"
            />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Rental Management</h1>
            <p className="mt-1 text-sm text-slate-500">Property & Finance Platform</p>
          </div>

          {/* Login Card */}
          <div className="surface-panel-premium overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-transparent px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500">Sign in to your account</p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-primary w-full justify-center py-2.5 text-sm ${
                    loading ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4 text-center">
                <p className="text-xs text-slate-500">
                  First time? Contact your administrator to create an account.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Rental Management. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
