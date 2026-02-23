// src/pages/TenantDetailPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import SkeletonCard from "../components/SkeletonCard";
import { useAuthStore } from "../store/authStore";

const statusClassMap = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  INVITED: "bg-amber-100 text-amber-700",
};

export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const canManage =
    currentUser?.role === "ADMIN" || currentUser?.role === "PM";

  const loadTenant = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await API.get(`/users/${id}`);
      const userData = userRes.data?.data || null;
      setProfile(userData);

      if (userData) {
        const leaseRes = await API.get(`/leases/by-tenant/${id}`).catch(() => ({
          data: { data: [] },
        }));
        setLeases(leaseRes.data?.data || []);
      }
    } catch {
      toast.error("Failed to load tenant profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      navigate("/tenants");
      return;
    }
    loadTenant();
  }, [id, loadTenant, navigate]);

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate this tenant?")) return;
    try {
      setUpdating(true);
      await API.delete(`/users/${id}`);
      toast.success("Tenant deactivated");
      loadTenant();
    } catch {
      toast.error("Failed to deactivate tenant");
    } finally {
      setUpdating(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setUpdating(true);
      await API.post(`/users/${id}/reactivate`);
      toast.success("Tenant reactivated");
      loadTenant();
    } catch {
      toast.error("Failed to reactivate tenant");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString() : "—";

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tenants"
          eyebrowClassName="bg-indigo-100 text-indigo-700"
          title="Tenant Detail"
          subtitle="Loading tenant profile..."
        />
        <SkeletonCard title="Tenant Overview">
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard title="Lease History">
          <SkeletonTable rows={4} columns={4} />
        </SkeletonCard>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Tenant not found.</p>
        <button
          onClick={() => navigate("/tenants")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Back to Tenants
        </button>
      </div>
    );
  }

  const statusClass = statusClassMap[profile.status] || "status-slate";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tenants"
        eyebrowClassName="bg-indigo-100 text-indigo-700"
        title={profile.fullName || "Tenant Detail"}
        subtitle={`${profile.email || "No email"} · Tenant`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/tenants")}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Back to Tenants
            </button>
            {canManage && profile.status !== "SUSPENDED" && (
              <button
                type="button"
                disabled={updating}
                onClick={handleDeactivate}
                className="rounded-md border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 disabled:opacity-60"
              >
                Deactivate
              </button>
            )}
            {canManage && profile.status === "SUSPENDED" && (
              <button
                type="button"
                disabled={updating}
                onClick={handleReactivate}
                className="rounded-md border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 disabled:opacity-60"
              >
                Reactivate
              </button>
            )}
          </div>
        }
      />

      <DashboardCard title="Tenant Overview">
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass} mt-2`}>
              {profile.status || "ACTIVE"}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500">Joined</p>
            <p className="mt-1 text-sm">{formatDate(profile.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Phone</p>
            <p className="mt-1 text-sm">{profile.phone || "—"}</p>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Lease History"
        description="Current and past leases for this tenant."
      >
        {leases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
            <div className="text-sm font-medium text-slate-700">No leases found</div>
            <div className="mt-1 text-xs text-slate-500">
              This tenant has no lease history yet.
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Unit
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Term
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {leases.map((lease) => (
                  <tr key={lease._id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      {lease.unitId?.name || lease.unitId?.unitNumber || "Unit"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          lease.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : lease.status === "ENDED"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {lease.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(lease.startDate)} – {formatDate(lease.endDate)}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/leases/${lease._id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
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
      </DashboardCard>
    </div>
  );
}
