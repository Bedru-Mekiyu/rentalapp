// src/pages/TenantDetailPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import ResponsiveSection from "../components/ResponsiveSection";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import DashboardCard from "../components/DashboardCard";
import { useAuthStore } from "../store/authStore";
import MobileBackBar from "../components/MobileBackBar";

const statusClassMap = {
  ACTIVE: "bg-success-100 text-success-700",
  SUSPENDED: "bg-danger-100 text-danger-700",
  INVITED: "bg-warning-100 text-warning-700",
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
          title="Tenant Detail"
          subtitle="Loading tenant profile..."
        />
        <DashboardCard title="Tenant Overview">
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
          </div>
        </DashboardCard>
        <DashboardCard title="Lease History">
          <SkeletonTable rows={4} columns={4} />
        </DashboardCard>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-danger-600">Tenant not found.</p>
        <button
          onClick={() => navigate("/tenants")}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Back to Tenants
        </button>
      </div>
    );
  }

  const statusClass = statusClassMap[profile.status] || "status-neutral";

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile.fullName || "Tenant Detail"}
        subtitle={`${profile.email || "No email"} · Tenant`}
        backTo="/tenants"
        backLabel="Back to Tenants"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage && profile.status !== "SUSPENDED" && (
              <button
                type="button"
                disabled={updating}
                onClick={handleDeactivate}
                className="rounded-md border border-danger-200 px-4 py-2 text-sm font-medium text-danger-600 disabled:opacity-60"
              >
                Deactivate
              </button>
            )}
            {canManage && profile.status === "SUSPENDED" && (
              <button
                type="button"
                disabled={updating}
                onClick={handleReactivate}
                className="rounded-md border border-success-200 px-4 py-2 text-sm font-medium text-success-600 disabled:opacity-60"
              >
                Reactivate
              </button>
            )}
          </div>
        }
      />

      <ResponsiveSection title="Tenant Overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-neutral-500">Status</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass} mt-2`}>
              {profile.status || "ACTIVE"}
            </span>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Joined</p>
            <p className="mt-1 text-sm">{formatDate(profile.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Phone</p>
            <p className="mt-1 text-sm">{profile.phone || "—"}</p>
          </div>
        </div>
      </ResponsiveSection>

      <ResponsiveSection
        title="Lease History"
        description="Current and past leases for this tenant."
      >
        {leases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-8 text-center">
            <div className="text-sm font-medium text-neutral-700">No leases found</div>
            <div className="mt-1 text-xs text-neutral-500">
              This tenant has no lease history yet.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-xs">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                    Unit
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                    Term
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
                      {lease.unitId?.name || lease.unitId?.unitNumber || "Unit"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          lease.status === "ACTIVE"
                            ? "bg-success-100 text-success-700"
                            : lease.status === "ENDED"
                            ? "bg-neutral-100 text-neutral-700"
                            : "bg-warning-100 text-warning-700"
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
      </ResponsiveSection>
      <MobileBackBar to="/tenants" label="Back to Tenants" />
    </div>
  );
}
