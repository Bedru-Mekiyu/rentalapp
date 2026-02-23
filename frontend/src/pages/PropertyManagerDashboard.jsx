// src/pages/PropertyManagerDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import API from "../services/api";
import { Home, Users, Wrench, Plus, Eye } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonCard from "../components/SkeletonCard";

const Avatar = ({ name = "Tenant" }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-semibold text-white shadow-sm ring-2 ring-white">
      {initials}
    </div>
  );
};

const statusColors = {
  available:
    "inline-flex rounded-full bg-emerald-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700",
  occupied:
    "inline-flex rounded-full bg-sky-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700",
  "under maintenance":
    "inline-flex rounded-full bg-amber-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700",
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
          eyebrow="Property Ops"
          eyebrowClassName="bg-emerald-100 text-emerald-700"
          title="Property Manager Dashboard"
          subtitle="Overview of your property management operations."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard className="p-5">
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </SkeletonCard>
          <SkeletonCard className="p-5">
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </SkeletonCard>
          <SkeletonCard className="p-5">
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </SkeletonCard>
          <SkeletonCard className="p-5">
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </SkeletonCard>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard className="lg:col-span-2 p-5">
            <SkeletonRow className="h-8 w-64" />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <SkeletonRow className="h-28 w-full" />
              <SkeletonRow className="h-28 w-full" />
              <SkeletonRow className="h-28 w-full" />
            </div>
          </SkeletonCard>
          <SkeletonCard className="p-5">
            <SkeletonRow className="h-6 w-32" />
            <div className="mt-4 space-y-3">
              <SkeletonRow className="h-12 w-full" />
              <SkeletonRow className="h-12 w-full" />
              <SkeletonRow className="h-12 w-full" />
            </div>
          </SkeletonCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Property Ops"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
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
            <span className="pill bg-slate-900 text-white">
              {user?.fullName || user?.email}
            </span>
          </div>
        }
      />

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="panel-title">Unit Health Snapshot</h2>
              <p className="panel-subtitle">
                Search units and jump to key portfolio views.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search by unit, floor, or status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input w-full text-sm sm:w-64"
              />
              <Link
                to="/units"
                className="btn-primary inline-flex items-center space-x-2 text-xs font-semibold"
              >
                <Eye className="h-4 w-4" />
                <span>Units</span>
              </Link>
              <Link
                to="/users"
                className="btn-secondary inline-flex items-center space-x-2 text-xs font-semibold"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </Link>
              {user?.role === "ADMIN" || user?.role === "PM" ? (
                <Link
                  to="/users/new"
                  className="inline-flex items-center space-x-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create</span>
                </Link>
              ) : null}
            </div>
          </div>

          {filteredUnits.length === 0 ? (
            <div className="mt-4 space-y-2">
              <SkeletonRow className="h-4 w-1/2" />
              <SkeletonRow className="h-4 w-2/3" />
              <p className="text-sm text-gray-500">No units found.</p>
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
                    className="stagger-item surface-panel flex flex-col justify-between p-4 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Unit {unit.unitNumber ?? "N/A"}
                        </h3>
                        <p className="mt-1 text-[11px] text-slate-500">
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
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-900">
                        {unit.basePriceEtb
                          ? `${unit.basePriceEtb} ETB / month`
                          : "Price N/A"}
                      </p>
                      <Link
                        to="/leases"
                        className="text-[11px] font-semibold text-emerald-600 hover:underline"
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="panel-title">Recent Leases</h2>
              <p className="panel-subtitle mt-1">
                Create new leases and review existing ones for your
                units.
              </p>
            </div>
            <Link
              to="/leases"
              className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-black"
            >
              Manage Leases
            </Link>
          </div>

          {leases.length === 0 ? (
            <div className="mt-4 space-y-2">
              <SkeletonRow className="h-4 w-2/3" />
              <SkeletonRow className="h-4 w-1/2" />
              <p className="text-sm text-gray-500">No active tenants yet.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-xs">
              {leases.slice(0, 5).map((lease) => (
                <li
                  key={lease._id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={lease.tenantId?.fullName || "Tenant"}
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        {lease.tenantId?.fullName || "Tenant"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Unit {lease.unitId?.unitNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900">
                      {lease.monthlyRentEtb
                        ? `${lease.monthlyRentEtb} ETB / month`
                        : "N/A"}
                    </p>
                    <p className="text-[11px] text-slate-500">
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
      <section className="surface-panel mt-4 p-6">
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
            <p className="text-sm text-gray-500">No maintenance requests yet.</p>
          </div>
        ) : (
          <div className="mt-4 table-shell">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="table-head">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Tenant
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Unit
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Urgency
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {maintenanceRequests.map((r) => (
                  <tr key={r._id} className="table-row">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={r.tenantId?.fullName || "Tenant"}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {r.tenantId?.fullName || "Tenant"}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {r.tenantId?.email || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      Unit {r.unitId?.unitNumber || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-gray-700 max-w-xs">
                      <p className="line-clamp-2">
                        {r.description}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-amber-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        {r.urgency}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-teal-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <select
                        value={r.status}
                        onChange={(e) =>
                          handleStatusChange(
                            r._id,
                            e.target.value
                          )
                        }
                        className="form-select text-[11px]"
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/10 text-slate-800">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
