// src/pages/TenantsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { useAuthStore } from "../store/authStore";
import { Users, Search, Filter, UserPlus, Eye, UserX, UserCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import SkeletonCard from "../components/SkeletonCard";
import Pagination from "../components/Pagination";

const STATUS_OPTIONS = ["ALL", "ACTIVE", "SUSPENDED", "INVITED"];

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    SUSPENDED: "bg-rose-100 text-rose-700",
    INVITED: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
};

export default function TenantsPage() {
  const { user: currentUser } = useAuthStore();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const canDeactivate =
    currentUser?.role === "ADMIN" || currentUser?.role === "PM";
  const canReactivate =
    currentUser?.role === "ADMIN" || currentUser?.role === "PM";

  const loadTenants = async () => {
    try {
      setLoading(true);
      const params = { role: "TENANT" };
      if (statusFilter !== "ALL") params.status = statusFilter;

      // GET /api/users?role=TENANT&status=...
      const res = await API.get("/users", { params });
      setTenants(res.data?.data || []);
    } catch (err) {
      console.error("TenantsPage loadTenants error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load tenants"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredTenants = useMemo(
    () =>
      tenants.filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.fullName?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.phone?.toLowerCase().includes(q)
        );
      }),
    [tenants, search]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const PAGE_SIZE = 12;

  const pagedTenants = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTenants.slice(start, start + PAGE_SIZE);
  }, [filteredTenants, page]);

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this tenant?")) return;
    try {
      await API.delete(`/users/${id}`); // DELETE /api/users/:id
      toast.success("Tenant deactivated");
      loadTenants();
    } catch (err) {
      console.error("TenantsPage deactivate error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to deactivate tenant"
      );
    }
  };

  const handleReactivate = async (id) => {
    try {
      await API.post(`/users/${id}/reactivate`); // POST /api/users/:id/reactivate
      toast.success("Tenant reactivated");
      loadTenants();
    } catch (err) {
      console.error("TenantsPage reactivate error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to reactivate tenant"
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tenants"
          eyebrowClassName="bg-indigo-100 text-indigo-700"
          title="Tenant Management"
          subtitle="Manage tenant accounts, access status, and profiles."
        />
        <SkeletonCard title="Tenant Management">
          <SkeletonTable rows={5} columns={4} />
        </SkeletonCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tenants"
        eyebrowClassName="bg-indigo-100 text-indigo-700"
        title="Tenant Management"
        subtitle="Manage tenant accounts, access status, and profiles."
        actions={
          currentUser?.role === "ADMIN" || currentUser?.role === "PM" ? (
            <Link
              to="/users/new?role=TENANT"
              className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>New Tenant</span>
            </Link>
          ) : null
        }
      />

      <DashboardCard title="Tenant Directory">
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone"
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredTenants.length === 0 ? (
        <div className="space-y-3">
          <SkeletonTable rows={4} columns={4} />
          <div className="empty-state">
            <div className="empty-state-title">No tenants match your filters</div>
            <div className="empty-state-text">Try adjusting your search or status.</div>
          </div>
        </div>
      ) : (
        <div className="table-shell list-shell overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                  Name / Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedTenants.map((t) => (
                <tr key={t._id} className="table-row stagger-item">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {t.fullName || "Unnamed"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t.email}
                      {t.phone && (
                        <span className="ml-2 text-slate-400">
                          • {t.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {canDeactivate && t.status !== "SUSPENDED" && (
                        <button
                          onClick={() => handleDeactivate(t._id)}
                          className="btn-pill btn-outline btn-outline-rose"
                        >
                          <UserX className="h-3 w-3" />
                          <span>Deactivate</span>
                        </button>
                      )}
                      {canReactivate && t.status === "SUSPENDED" && (
                        <button
                          onClick={() => handleReactivate(t._id)}
                          className="btn-pill btn-outline btn-outline-emerald"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span>Reactivate</span>
                        </button>
                      )}
                      <Link
                        to={`/tenants/${t._id}`}
                        className="btn-pill btn-outline btn-outline-slate"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={filteredTenants.length}
        onPageChange={setPage}
      />
      </DashboardCard>
    </div>
  );
}
