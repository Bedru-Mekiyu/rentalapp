// src/pages/LeasesPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import Pagination from "../components/Pagination";
import { useAuthStore } from "../store/authStore";
import { getLeaseMonthlyRentEtb } from "../utils/pricing";

const STATUS_FILTERS = ["All", "ACTIVE", "ENDED"];
const PAGE_SIZE = 20;

export default function LeasesPage() {
  const { user } = useAuthStore();
  const [leases, setLeases] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const canManage = user?.role === "ADMIN" || user?.role === "PM";

  useEffect(() => {
    const controller = new AbortController();
    loadLeases(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLeases = async (signal) => {
    try {
      setLoading(true);
      const res = await API.get("/leases", { signal }); // GET /api/leases[listAllLeases]
      setLeases(res.data?.data || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error("Failed to load leases");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLeases = useMemo(
    () =>
      leases.filter((l) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          l.unitId?.unitNumber?.toLowerCase().includes(q) ||
          l.unitId?.type?.toLowerCase().includes(q) ||
          l.tenantId?.fullName?.toLowerCase().includes(q) ||
          l.tenantId?.email?.toLowerCase().includes(q);
        const matchesStatus = status === "All" || l.status === status;
        return matchesSearch && matchesStatus;
      }),
    [leases, search, status]
  );

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const pagedLeases = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLeases.slice(start, start + PAGE_SIZE);
  }, [filteredLeases, page]);

  const formatCurrency = useCallback((v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0), []);

  const formatDate = useCallback((d) =>
    d ? new Date(d).toLocaleDateString() : "—", []);

  const getLeaseStatusClass = useCallback((value) => {
    if (value === "ACTIVE") return "bg-success-100 text-success-700";
    if (value === "ENDED") return "bg-neutral-100 text-neutral-700";
    return "bg-warning-100 text-warning-700";
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Leases"
          subtitle="View and manage active and past leases."
        />
        <DashboardCard>
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonRow className="h-10 w-64 rounded-2xl" />
            <SkeletonRow className="h-8 w-48 rounded-full" />
          </div>
        </DashboardCard>
        <DashboardCard title="Lease List">
          <SkeletonTable rows={5} columns={6} />
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leases"
        subtitle="View and manage active and past leases."
        actions={
          canManage ? (
            <Link
              to="/leases/new"
              className="btn-primary text-sm font-semibold"
            >
              + New Lease
            </Link>
          ) : null
        }
      />

      {/* Filters */}
      <DashboardCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by unit or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div className="filter-shell">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`filter-chip ${
                  status === s ? "filter-chip-active" : ""
                }`}
              >
                {s === "All" ? "All" : s}
              </button>
            ))}
          </div>
          <div className="text-xs text-neutral-500">
            {filteredLeases.length} of {leases.length} leases shown
          </div>
        </div>
      </DashboardCard>

      {/* Leases table */}
      <DashboardCard title="Lease List">
        {filteredLeases.length === 0 ? (
          <div className="empty-state py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="empty-state-title">No leases found</div>
            <div className="empty-state-text">Try adjusting your search or filters.</div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[680px] divide-y divide-neutral-200 text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-neutral-600 uppercase tracking-wider sm:px-6 whitespace-nowrap">
                    Unit
                  </th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-neutral-600 uppercase tracking-wider sm:px-6 whitespace-nowrap">
                    Tenant
                  </th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-neutral-600 uppercase tracking-wider sm:px-6 whitespace-nowrap">
                    Term
                  </th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-neutral-600 uppercase tracking-wider sm:px-6 whitespace-nowrap">
                    Rent
                  </th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-neutral-600 uppercase tracking-wider sm:px-6 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left text-[10px] font-bold text-neutral-600 uppercase tracking-wider sm:px-6 whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {pagedLeases.map((l, index) => (
                  <tr key={l._id} className={`table-row stagger-item ${index % 2 === 0 ? "bg-white" : "bg-neutral-50/30"}`}>
                    <td className="px-2 py-3 sm:px-6">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">
                          Unit {l.unitId?.unitNumber || "N/A"}
                        </div>
                        {l.unitId?.type && (
                          <div className="mt-1 inline-block rounded-full bg-neutral-100/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 whitespace-nowrap">
                            {l.unitId.type}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 sm:px-6">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 truncate max-w-[140px] sm:max-w-[180px]">
                          {l.tenantId?.fullName || "Tenant"}
                        </div>
                        {l.tenantId?.email && (
                          <div className="text-xs text-neutral-500 truncate max-w-[140px] sm:max-w-[180px]">
                            {l.tenantId.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 sm:px-6 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-neutral-900">
                          {formatDate(l.startDate)}
                        </div>
                        <div className="text-neutral-500 text-[10px]">to</div>
                        <div className="font-medium text-neutral-900">
                          {formatDate(l.endDate)}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 sm:px-6 whitespace-nowrap">
                      <div className="text-base font-bold text-neutral-900">
                        {formatCurrency(getLeaseMonthlyRentEtb(l))}
                      </div>
                    </td>
                    <td className="px-2 py-3 sm:px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getLeaseStatusClass(l.status)}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {l.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 sm:px-6 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <Link
                          to={`/leases/${l._id}`}
                          className="btn-pill btn-soft btn-soft-success"
                        >
                          Lease
                        </Link>
                        {l.unitId?._id && (
                          <Link
                            to={`/units/${l.unitId._id}`}
                            className="btn-pill btn-soft btn-soft-neutral"
                          >
                            Unit
                          </Link>
                        )}
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
          total={filteredLeases.length}
          onPageChange={setPage}
        />
      </DashboardCard>
    </div>
  );
}
