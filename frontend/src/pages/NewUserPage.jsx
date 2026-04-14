// src/pages/NewUserPage.jsx
import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";

const ROLE_OPTIONS = ["ADMIN", "PM", "GM", "FS", "TENANT"];

export default function NewUserPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  // Optional: allow ?role=TENANT to preselect from Tenant Management
  const initialRole = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("role");
    if (r && ROLE_OPTIONS.includes(r)) return r;
    return "TENANT";
  }, [location.search]);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: initialRole,
  });

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await API.post("/users", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      }); // POST /api/users
      toast.success("User created");
      navigate("/users");
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create user";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New User"
        subtitle="Create a new account and assign an appropriate role."
        actions={
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-700"
          >
            Back to Users
          </button>
        }
      />

      <DashboardCard title="User Details">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2 text-sm"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={handleChange("fullName")}
              className="form-input text-sm"
              placeholder="Alice Johnson"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={handleChange("email")}
              className="form-input text-sm"
              placeholder="alice@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              className="form-input text-sm"
              placeholder="+251..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={handleChange("password")}
              className="form-input text-sm"
              placeholder="Temporary password"
            />
          </div>

          <div className="space-y-1 md:max-w-xs">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Role
            </label>
            <select
              value={form.role}
              onChange={handleChange("role")}
              className="form-select text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs font-semibold disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </DashboardCard>
    </div>
  );
}
