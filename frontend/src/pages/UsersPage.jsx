// src/pages/UsersPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { useAuthStore } from "../store/authStore";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import SkeletonCard from "../components/SkeletonCard";
import Pagination from "../components/Pagination";

const ROLE_OPTIONS = ["ALL", "ADMIN", "PM", "GM", "FS", "TENANT"];
const STATUS_OPTIONS = ["ALL", "ACTIVE", "SUSPENDED", "INVITED"];

const RoleBadge = ({ role }) => {
  const map = {
    ADMIN: "status-emerald",
    PM: "status-teal",
    GM: "status-amber",
    FS: "status-sky",
    TENANT: "status-slate",
  };

  return (
    <span
      className={`status-pill ${map[role] || "status-slate"}`}
    >
      {role}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: "status-emerald",
    SUSPENDED: "status-rose",
    INVITED: "status-amber",
  };

  return (
    <span
      className={`status-pill ${map[status] || "status-slate"}`}
    >
      {status}
    </span>
  );
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const canDeactivate = currentUser?.role === "ADMIN";
  const canReactivate = currentUser?.role === "ADMIN";

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;

      // Backend: GET /api/users (listUsers)
      const res = await API.get("/users", { params });
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error(
        err.response?.data?.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
        );
      }),
    [users, search]
  );

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const PAGE_SIZE = 12;

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      // Backend: DELETE /api/users/:id -> sets status = SUSPENDED
      await API.delete(`/users/${id}`);
      toast.success("User deactivated");
      loadUsers();
    } catch (err) {
      console.error("Failed to deactivate user:", err);
      toast.error(
        err.response?.data?.message || "Failed to deactivate user"
      );
    }
  };

  const handleReactivate = async (id) => {
    try {
      // Backend: POST /api/users/:id/reactivate
      await API.post(`/users/${id}/reactivate`);
      toast.success("User reactivated");
      loadUsers();
    } catch (err) {
      console.error("Failed to reactivate user:", err);
      toast.error(
        err.response?.data?.message || "Failed to reactivate user"
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Users"
          eyebrowClassName="bg-primary-100 text-primary-700"
          title="Users"
          subtitle="Manage system users, roles, and access status."
        />
        <DashboardCard title="User Directory">
          <div className="py-8 text-center text-sm text-gray-500">
            Loading users...
          </div>
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Users"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Users"
        subtitle="Manage system users, roles, and access status."
        actions={
          currentUser?.role === "ADMIN" || currentUser?.role === "PM" ? (
            <Link
              to="/users/new"
              className="btn-primary inline-flex items-center text-xs font-semibold"
            >
              New User
            </Link>
          ) : null
        }
      />

      <DashboardCard title="User Directory">
      {/* Filters */}
      <div className="filter-panel mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            className="form-input text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="form-select text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Role: {r}
              </option>
            ))}
          </select>
          <select
            className="form-select text-sm"
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
      {filteredUsers.length === 0 ? (
        <div className="space-y-3">
          <SkeletonTable rows={4} columns={5} />
          <div className="empty-state">
            <div className="empty-state-title">No users match your filters</div>
            <div className="empty-state-text">Try adjusting role or status filters.</div>
          </div>
        </div>
      ) : (
        <div className="table-shell list-shell overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">
                  Name / Contact
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">
                  Role
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">
                  Created
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedUsers.map((u) => (
                <tr key={u._id} className="table-row stagger-item">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {u.fullName || "Unnamed"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {u.email}
                      {u.phone && (
                        <span className="ml-2 text-slate-400">
                          • {u.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {(canDeactivate || canReactivate) && (
                        <>
                          {u.status !== "SUSPENDED" && canDeactivate && (
                            <button
                              onClick={() => handleDeactivate(u._id)}
                              className="btn-pill btn-outline btn-outline-rose"
                            >
                              Deactivate
                            </button>
                          )}
                          {u.status === "SUSPENDED" && canReactivate && (
                            <button
                              onClick={() => handleReactivate(u._id)}
                              className="btn-pill btn-outline btn-outline-emerald"
                            >
                              Reactivate
                            </button>
                          )}
                        </>
                      )}
                      <Link
                        to={`/users/${u._id}`}
                        className="btn-pill btn-outline btn-outline-slate"
                      >
                        View
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
        total={filteredUsers.length}
        onPageChange={setPage}
      />
      </DashboardCard>
    </div>
  );
}
