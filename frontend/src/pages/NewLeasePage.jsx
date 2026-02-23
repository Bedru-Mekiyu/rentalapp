// src/pages/NewLeasePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { Home, User, Calendar, DollarSign, FileText, Save, ArrowLeft } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function NewLeasePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [form, setForm] = useState({
    unitId: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    monthlyRentEtb: "",
    securityDepositEtb: "",
    notes: "",
  });

  useEffect(() => {
    loadUnits();
    loadTenants();
  }, []);

  const loadUnits = async () => {
    try {
      const res = await API.get("/units");
      setUnits(res.data?.data || []);
    } catch {
      toast.error("Failed to load units");
    }
  };

  const loadTenants = async () => {
    try {
      const res = await API.get("/users?role=TENANT");
      setTenants(res.data?.data || []);
    } catch {
      toast.error("Failed to load tenants");
    }
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await API.post("/leases", {
        unitId: form.unitId,
        tenantId: form.tenantId,
        startDate: form.startDate,
        endDate: form.endDate,
        monthlyRentEtb: Number(form.monthlyRentEtb),
        securityDepositEtb: Number(form.securityDepositEtb),
        notes: form.notes,
      });
      toast.success("Lease created");
      navigate("/leases");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create lease";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leases"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="New Lease"
        subtitle="Create a new lease agreement for a tenant and unit."
      />

      <DashboardCard title="Lease Details">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Home className="h-4 w-4" />
              <span>Unit</span>
            </label>
            <select
              required
              value={form.unitId}
              onChange={handleChange("unitId")}
              className="form-select text-sm"
            >
              <option value="">Select Unit</option>
              {units
                .filter((u) => u.status === "VACANT")
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.unitNumber} - {u.type}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <User className="h-4 w-4" />
              <span>Tenant</span>
            </label>
            <select
              required
              value={form.tenantId}
              onChange={handleChange("tenantId")}
              className="form-select text-sm"
            >
              <option value="">Select Tenant</option>
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName} - {t.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={handleChange("startDate")}
              className="form-input text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={handleChange("endDate")}
              className="form-input text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <DollarSign className="h-4 w-4" />
              <span>Monthly Rent (ETB)</span>
            </label>
            <input
              type="number"
              required
              value={form.monthlyRentEtb}
              onChange={handleChange("monthlyRentEtb")}
              className="form-input text-sm"
              placeholder="5000"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <DollarSign className="h-4 w-4" />
              <span>Security Deposit (ETB)</span>
            </label>
            <input
              type="number"
              required
              value={form.securityDepositEtb}
              onChange={handleChange("securityDepositEtb")}
              className="form-input text-sm"
              placeholder="5000"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <FileText className="h-4 w-4" />
              <span>Notes</span>
            </label>
            <textarea
              value={form.notes}
              onChange={handleChange("notes")}
              rows={3}
              className="form-textarea text-sm"
              placeholder="Additional notes..."
            />
          </div>

          <div className="md:col-span-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center space-x-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex items-center space-x-2 text-xs font-semibold disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? "Creating..." : "Create Lease"}</span>
            </button>
          </div>
        </form>
      </DashboardCard>
    </div>
  );
}
