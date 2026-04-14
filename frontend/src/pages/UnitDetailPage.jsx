// src/pages/UnitDetailPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import ResponsiveSection from "../components/ResponsiveSection";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import DashboardCard from "../components/DashboardCard";
import MobileBackBar from "../components/MobileBackBar";
import { getLeaseMonthlyRentEtb } from "../utils/pricing";
import { useAuthStore } from "../store/authStore";

export default function UnitDetailPage() {
  const { id: unitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTenant = user?.role === "TENANT";
  const isFinanceStaff = user?.role === "FS";
  const backTarget = isTenant ? "/dashboard" : "/units";
  const backLabel = isTenant ? "Back to Dashboard" : "Back to Units";

  const [unit, setUnit] = useState(null);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUnit = useCallback(async () => {
    try {
      setLoading(true);
      if (isTenant) {
        const unitRes = await API.get(`/units/${unitId}`);
        setUnit(unitRes.data?.data || null); // backend returns { success, data }
        setLeases([]);
      } else {
        const [unitRes, leasesRes] = await Promise.all([
          API.get(`/units/${unitId}`),
          API.get("/leases", { params: { unitId } }),
        ]);
        setUnit(unitRes.data?.data || null); // backend returns { success, data }
        setLeases(leasesRes.data?.data || []);
      }
    } catch {
      toast.error("Failed to load unit details");
    } finally {
      setLoading(false);
    }
  }, [unitId, isTenant]);

  useEffect(() => {
    if (!unitId || unitId === "undefined") {
      navigate(backTarget);
      return;
    }
    loadUnit();
  }, [unitId, loadUnit, navigate, backTarget]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Unit Detail"
          subtitle="Loading unit details..."
        />
        <DashboardCard title="Unit Information">
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
          </div>
        </DashboardCard>
        <DashboardCard title="Lease History">
          <SkeletonTable rows={4} columns={5} />
        </DashboardCard>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-danger-600">Unit not found.</p>
        <button
          onClick={() => navigate(backTarget)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          {backLabel}
        </button>
      </div>
    );
  }

  const activeLease = leases.find((l) => l.status === "ACTIVE");
  const unitStatusClass =
    unit.status === "VACANT"
      ? "bg-success-100 text-success-700"
      : unit.status === "MAINTENANCE"
      ? "bg-warning-100 text-warning-700"
      : "bg-neutral-100 text-neutral-700";
  const leaseStatusClass = (value) =>
    value === "ACTIVE"
      ? "bg-success-100 text-success-700"
      : value === "ENDED"
      ? "bg-neutral-100 text-neutral-700"
      : "bg-warning-100 text-warning-700";

  return (
    <div className="space-y-6">
      <PageHeader
        title={unit.name || "Unit Detail"}
        subtitle={`${unit.address || "No address"} · Floor ${unit.floor ?? "N/A"} · ${unit.status}`}
        backTo={isFinanceStaff ? undefined : backTarget}
        backLabel={backLabel}
        actions={
          isFinanceStaff ? (
            <button
              type="button"
              onClick={() => navigate(backTarget)}
              className="btn-pill btn-outline btn-outline-neutral"
            >
              {backLabel}
            </button>
          ) : undefined
        }
      />

      {/* Unit info */}
      <ResponsiveSection title="Unit Information">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-neutral-500">Status</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${unitStatusClass} mt-2`}>
              {unit.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Base Price</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatCurrency(unit.basePriceEtb)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Type</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {unit.unitType || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Bedrooms</p>
            <p className="mt-1 text-sm">{unit.bedrooms ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Bathrooms</p>
            <p className="mt-1 text-sm">{unit.bathrooms ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Created</p>
            <p className="mt-1 text-sm">
              {unit.createdAt
                ? new Date(unit.createdAt).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>

      </ResponsiveSection>

      {!isTenant && (
        <ResponsiveSection
          title="Lease History"
          description="Current and past leases associated with this unit."
        >
          {leases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No leases found</div>
              <div className="empty-state-text">This unit has no lease history yet.</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200 text-xs">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                      Tenant
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                      Term
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                      Rent (ETB)
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {leases.map((lease) => (
                    <tr key={lease._id} className="hover:bg-neutral-50">
                      <td className="px-4 py-2">
                        {lease.tenantId?.fullName || "Tenant"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${leaseStatusClass(lease.status)}`}
                        >
                          {lease.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {lease.startDate
                          ? new Date(
                              lease.startDate
                            ).toLocaleDateString()
                          : "—"}{" "}
                        –{" "}
                        {lease.endDate
                          ? new Date(
                              lease.endDate
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {formatCurrency(getLeaseMonthlyRentEtb(lease))}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/leases/${lease._id}`}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                          View lease
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeLease && (
            <p className="mt-3 text-xs text-neutral-500">
              Active lease:{" "}
              <Link
                to={`/leases/${activeLease._id}`}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                {activeLease.tenantId?.fullName || "Tenant"}
              </Link>
              .
            </p>
          )}
        </ResponsiveSection>
      )}
      <MobileBackBar to={backTarget} label={backLabel} />
    </div>
  );
}
