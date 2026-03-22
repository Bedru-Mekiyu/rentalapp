// src/pages/NewLeasePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { Home, User, Calendar, DollarSign, FileText, Save, ArrowLeft } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useAuthStore } from "../store/authStore";

export default function NewLeasePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [form, setForm] = useState({
    unitId: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const calculateFloorMultiplier = (floor) => {
    if (floor <= 1) return 1.2;
    if (floor <= 5) return 1.0;
    if (floor <= 10) return 0.95;
    return 0.9;
  };

  const calculateAmenityBonus = (amenities = []) => 1 + amenities.length * 0.02;
  const calculateViewBonus = (views = []) => 1 + views.length * 0.03;

  const selectedUnit = units.find((unit) => unit._id === form.unitId) || null;
  const estimatedMonthlyRent = selectedUnit
    ? Math.round(
        Number(selectedUnit.basePriceEtb || 0) *
          calculateFloorMultiplier(Number(selectedUnit.floor || 0)) *
          calculateAmenityBonus(selectedUnit.amenitiesConfig || []) *
          calculateViewBonus(selectedUnit.viewAttributes || [])
      )
    : null;

  useEffect(() => {
    if (user && !["ADMIN", "PM"].includes(user.role)) {
      navigate("/leases", { replace: true });
      return;
    }
    loadUnits();
    loadTenants();
  }, [user, navigate]);

  const loadUnits = async () => {
    try {
      setLoadingUnits(true);
      const res = await API.get("/units", {
        params: {
          status: "VACANT",
          limit: 100,
        },
      });

      const availableUnits = (res.data?.data || [])
        .filter((unit) => String(unit.status || "").toUpperCase() === "VACANT")
        .sort((a, b) => String(a.unitNumber || "").localeCompare(String(b.unitNumber || "")));

      setUnits(availableUnits);
    } catch {
      toast.error("Failed to load units");
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  const loadTenants = async () => {
    try {
      setLoadingTenants(true);
      const res = await API.get("/users?role=TENANT");
      setTenants(res.data?.data || []);
    } catch {
      toast.error("Failed to load tenants");
      setTenants([]);
    } finally {
      setLoadingTenants(false);
    }
  };

  const availableUnits = units.filter(
    (unit) => String(unit.status || "").toUpperCase() === "VACANT"
  );

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
        eyebrowClassName="bg-primary-100 text-primary-700"
        title="New Lease"
        subtitle="Create a new lease agreement for a tenant and unit."
      />

      <DashboardCard title="Lease Details">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <Home className="h-4 w-4" />
              <span>Unit</span>
            </label>
            <select
              required
              value={form.unitId}
              onChange={handleChange("unitId")}
              disabled={loadingUnits || availableUnits.length === 0}
              className="form-select text-sm"
            >
              <option value="">
                {loadingUnits
                  ? "Loading available units..."
                  : availableUnits.length === 0
                  ? "No available units"
                  : "Select Available Unit"}
              </option>
              {availableUnits.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.unitNumber} - {u.type} {u.floor != null ? `(Floor ${u.floor})` : ""}
                </option>
              ))}
            </select>
            {!loadingUnits && availableUnits.length === 0 ? (
              <p className="text-xs text-neutral-500">
                There are no vacant units right now. Mark a unit as `VACANT` to create a lease.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <User className="h-4 w-4" />
              <span>Tenant</span>
            </label>
            <select
              required
              value={form.tenantId}
              onChange={handleChange("tenantId")}
              disabled={loadingTenants}
              className="form-select text-sm"
            >
              <option value="">{loadingTenants ? "Loading tenants..." : "Select Tenant"}</option>
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName} - {t.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
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

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <DollarSign className="h-4 w-4" />
              <span>Estimated Monthly Rent (ETB)</span>
            </label>
            <div className="form-input text-sm bg-neutral-50/70">
              {estimatedMonthlyRent != null ? estimatedMonthlyRent.toLocaleString() : "Select a unit to see calculated rent"}
            </div>
            <p className="text-[11px] text-neutral-500">
              Final rent is calculated automatically from unit pricing rules when you create the lease.
            </p>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
              className="btn-outline-neutral inline-flex items-center space-x-2 text-xs font-semibold"
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
