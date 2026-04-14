// src/pages/PropertyManagerDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import API from "../services/api";
import { memo } from "react";
import { Home, Users, Wrench, Plus, Eye, Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import DashboardCard from "../components/DashboardCard";
import Avatar from "../components/Avatar";
import { getLeaseMonthlyRentEtb } from "../utils/pricing";

// Local components (memoized for performance)
const TenantCard = memo(function TenantCard({ lease }) {
  const name = lease?.tenant?.fullName || "Unknown";
  const unit = lease?.unitId?.unitNumber || "-";

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/60 p-3 transition-colors hover:bg-white">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">Unit {unit}</p>
      </div>
    </div>
  );
});

const statusColors = {
  available: "status-pill status-success",
  occupied: "status-pill status-primary",
  "under maintenance": "status-pill status-warning",
};

export default function PropertyManagerDashboard() {
  const { user } = useAuthStore();

  const [units, setUnits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [search, setSearch] = useState("");
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
    loadMaintenance();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [unitsRes, leasesRes] = await Promise.all([
        API.get("/units"),
        API.get("/leases"),
      ]);
      setUnits(unitsRes.data?.data || unitsRes.data || []);
      setLeases(leasesRes.data?.data || leasesRes.data || []);
    } catch (err) {
      console.error("PropertyManagerDashboard loadData error", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to load property manager dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenance = async () => {
    try {
      setMaintenanceLoading(true);
      const res = await API.get("/maintenance");
      setMaintenanceRequests(res.data?.data || []);
    } catch (err) {
      console.error("PropertyManagerDashboard loadMaintenance error", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to load maintenance requests"
      );
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await API.patch(`/maintenance/${id}/status`, {
        status: newStatus,
      });
      const updated = res.data?.data;
      setMaintenanceRequests((prev) =>
        prev.map((r) => (r._id === id ? updated : r))
      );
      toast.success("Status updated");
    } catch (err) {
      console.error("updateMaintenanceStatus error", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to update maintenance status"
      );
    }
  };

  const filteredUnits = useMemo(() => {
    if (!search.trim()) return units;
    const q = search.toLowerCase();
    return units.filter((unit) => {
      const num = String(unit.unitNumber || "").toLowerCase();
      const floor = String(unit.floor || "").toLowerCase();
      const status = String(unit.status || "").toLowerCase();
      return (
        num.includes(q) || floor.includes(q) || status.includes(q)
      );
    });
  }, [search, units]);

  const occupancyStats = useMemo(() => {
    const total = units.length;
    const occupied = units.filter(
      (u) => (u.status || "").toUpperCase() === "OCCUPIED"
    ).length;
    const vacant = units.filter(
      (u) => (u.status || "").toUpperCase() === "VACANT"
    ).length;
    const maintenance = units.filter(
      (u) => (u.status || "").toUpperCase() === "UNDER_MAINTENANCE"
    ).length;
    return { total, occupied, vacant, maintenance };
  }, [units]);

  const activeLeases = useMemo(() => {
    return leases.filter(
      (lease) => (lease.status || "").toUpperCase() === "ACTIVE"
    ).length;
  }, [leases]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Property Manager Dashboard"
          subtitle="Overview of your property management operations."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard className="p-5">
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </DashboardCard>
          <DashboardCard className="p-5">
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </DashboardCard>
          <DashboardCard className="p-5">
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </DashboardCard>
          <DashboardCard className="p-5">
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </DashboardCard>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <DashboardCard className="lg:col-span-2 p-5">
            <SkeletonRow className="h-8 w-64" />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <SkeletonRow className="h-28 w-full" />
              <SkeletonRow className="h-28 w-full" />
              <SkeletonRow className="h-28 w-full" />
            </div>
          </DashboardCard>
          <DashboardCard className="p-5">
            <SkeletonRow className="h-6 w-32" />
            <div className="mt-4 space-y-3">
              <SkeletonRow className="h-12 w-full" />
              <SkeletonRow className="h-12 w-full" />
              <SkeletonRow className="h-12 w-full" />
            </div>
          </DashboardCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Property Manager Dashboard"
        subtitle="Overview of your property management operations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/leases/new"
              className="btn-primary text-xs font-semibold"
            >
              New Lease
            </Link>
            <Link
              to="/units"
              className="btn-secondary text-xs font-semibold"
            >
              View Units
            </Link>
          </div>
        }
      />

      <section className="insight-banner">
        <div className="insight-icon">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="insight-title">Priority focus today</div>
          <div className="insight-text">
            {occupancyStats.maintenance} maintenance requests need updates, and {occupancyStats.vacant} units are ready for new leases.
          </div>
        </div>
        <div className="insight-actions">
          <button
            onClick={() => {
              const el = document.getElementById("maintenance-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="btn-pill btn-outline btn-outline-primary"
          >
            Review Maintenance
          </button>
        </div>
      </section>

      {/* Top stats */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Units" value={occupancyStats.total} icon={Home} />
        <StatCard label="Occupied" value={occupancyStats.occupied} icon={Users} />
        <StatCard label="Active Leases" value={activeLeases} icon={Eye} />
        <StatCard
          label="Under Maintenance"
          value={occupancyStats.maintenance}
          icon={Wrench}
        />
      </div>

      {/* Units + leases */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Units list */}
        <section className="lg:col-span-2 surface-panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="panel-title">Unit Health Snapshot</h2>
              <p className="panel-subtitle">
                Search units and jump to key portfolio views.
              </p>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px] lg:min-w-[260px]">
              <input
                type="text"
                placeholder="Search by unit, floor, or status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input w-full text-sm"
              />
            </div>
          </div>

          {filteredUnits.length === 0 ? (
            <div className="mt-4 empty-state">
              <div className="empty-state-title">No units found</div>
              <div className="empty-state-text">Try adjusting your search.</div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredUnits.map((unit) => {
                const normalizedStatus = (
                  unit.status || ""
                ).toUpperCase();
                const labelStatus =
                  normalizedStatus === "VACANT"
                    ? "Available"
                    : normalizedStatus === "OCCUPIED"
                    ? "Occupied"
                    : "Under Maintenance";
                const badgeClass =
                  normalizedStatus === "OCCUPIED"
                    ? statusColors["occupied"]
                    : normalizedStatus === "VACANT"
                    ? statusColors["available"]
                    : statusColors["under maintenance"];

                return (
                  <article
                    key={unit._id}
                    className="stagger-item bg-white rounded-xl border border-neutral-200/60 shadow-sm flex flex-col gap-3 p-4 text-xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900">
                          Unit {unit.unitNumber ?? "N/A"}
                        </h3>
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Floor {unit.floor ?? "N/A"} •{" "}
                          {unit.areaSqm
                            ? `${unit.areaSqm} sqm`
                            : "Area N/A"}
                        </p>
                      </div>
                      <span className={badgeClass}>
                        {labelStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-neutral-900">
                        {unit.basePriceEtb
                          ? `${unit.basePriceEtb} ETB / month`
                          : "Price N/A"}
                      </p>
                      <Link
                        to={`/units/${unit._id}`}
                        className="link-action link-action-primary"
                      >
                        View details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent leases */}
        <section className="surface-panel p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="panel-title">Recent Leases</h2>
              <p className="panel-subtitle mt-1">
                Create new leases and review existing ones for your
                units.
              </p>
            </div>
          </div>

          {leases.length === 0 ? (
            <div className="mt-4 space-y-2">
              <SkeletonRow className="h-4 w-2/3" />
              <SkeletonRow className="h-4 w-1/2" />
              <p className="text-sm text-neutral-500">No active tenants yet.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-xs">
              {leases.slice(0, 5).map((lease) => (
                <li
                  key={lease._id}
                  className="flex flex-col gap-2 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={lease.tenantId?.fullName || "Tenant"}
                    />
                    <div>
                      <p className="font-medium text-neutral-900">
                        {lease.tenantId?.fullName || "Tenant"}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Unit {lease.unitId?.unitNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold text-neutral-900">
                      {getLeaseMonthlyRentEtb(lease)
                        ? `${getLeaseMonthlyRentEtb(lease)} ETB / month`
                        : "N/A"}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {lease.startDate
                        ? new Date(
                            lease.startDate
                          ).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Maintenance requests */}
      <section id="maintenance-section" className="surface-panel mt-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="panel-title">Maintenance Requests</h2>
            <p className="panel-subtitle mt-1">
              Track and update maintenance issues reported by tenants.
            </p>
          </div>
        </div>

        {maintenanceLoading ? (
          <div className="mt-4 space-y-2">
            <SkeletonRow className="h-4 w-2/3" />
            <SkeletonRow className="h-4 w-1/2" />
          </div>
        ) : maintenanceRequests.length === 0 ? (
          <div className="mt-4 space-y-2">
            <SkeletonRow className="h-4 w-2/3" />
            <SkeletonRow className="h-4 w-1/2" />
            <p className="text-sm text-neutral-500">No maintenance requests yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px] divide-y divide-neutral-200 text-xs">
              <thead className="table-head">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-neutral-700 whitespace-nowrap">
                    Tenant
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-neutral-700 whitespace-nowrap">
                    Unit
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-neutral-700">
                    Description
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-neutral-700 whitespace-nowrap">
                    Urgency
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-neutral-700 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-2 py-2 text-right font-medium text-neutral-700 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {maintenanceRequests.map((r) => (
                  <tr key={r._id} className="table-row">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          name={r.tenantId?.fullName || "Tenant"}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 truncate max-w-[120px] sm:max-w-[160px]">
                            {r.tenantId?.fullName || "Tenant"}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate max-w-[120px] sm:max-w-[160px]">
                            {r.tenantId?.email || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-neutral-700 whitespace-nowrap">
                      Unit {r.unitId?.unitNumber || "N/A"}
                    </td>
                    <td className="px-2 py-2 text-neutral-700">
                      <p className="line-clamp-2 max-w-[150px] sm:max-w-[200px]">
                        {r.description}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <span className="status-pill status-warning whitespace-nowrap">
                        {r.urgency}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="status-pill status-primary whitespace-nowrap">
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <select
                        value={r.status}
                        onChange={(e) =>
                          handleStatusChange(
                            r._id,
                            e.target.value
                          )
                        }
                        className="form-select text-[11px] w-full sm:w-auto"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">
                          In progress
                        </option>
                        <option value="resolved">
                          Resolved
                        </option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="surface-panel card-reveal stagger-item p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="kpi-label">
            {label}
          </p>
          <p className="kpi-value mt-2">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-900/10 text-primary-800">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
