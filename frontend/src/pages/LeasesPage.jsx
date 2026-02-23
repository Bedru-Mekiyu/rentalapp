// src/pages/LeasesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import SkeletonCard from "../components/SkeletonCard";

const STATUS_FILTERS = ["All", "ACTIVE", "ENDED"];
const PAGE_SIZE = 20;

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeases();
  }, []);

  const loadLeases = async () => {
    try {
      setLoading(true);
      const res = await API.get("/leases"); // GET /api/leases[listAllLeases]
      setLeases(res.data?.data || []);
    } catch {
      toast.error("Failed to load leases");
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

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString() : "—";

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Leases"
          eyebrowClassName="bg-emerald-100 text-emerald-700"
          title="Leases"
          subtitle="View and manage active and past leases."
        />
        <SkeletonCard>
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonRow className="h-10 w-64 rounded-2xl" />
            <SkeletonRow className="h-8 w-48 rounded-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard title="Lease List">
          <SkeletonTable rows={5} columns={6} />
        </SkeletonCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leases"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Leases"
        subtitle="View and manage active and past leases."
        actions={
          <Link
            to="/leases/new"
            className="btn-primary text-xs font-semibold"
          >
            + New Lease
          </Link>
        }
      />

      {/* Filters */}
      <DashboardCard>
        <div className="filter-panel flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by unit or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input text-sm"
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
          <div className="text-xs text-slate-500">
            {filteredLeases.length} of {leases.length} leases shown
          </div>
        </div>
      </DashboardCard>

      {/* Leases table */}
      <DashboardCard title="Lease List">
        {filteredLeases.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="mx-auto max-w-xs space-y-2">
              <SkeletonRow className="h-4 w-3/4" />
              <SkeletonRow className="h-4 w-2/3" />
            </div>
            <div className="mt-4">
              <SkeletonTable rows={4} columns={6} />
            </div>
            <div className="empty-state mt-4">
              <div className="empty-state-title">No leases found</div>
              <div className="empty-state-text">Try adjusting your search or filters.</div>
            </div>
          </div>
        ) : (
          <div className="table-shell">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Unit Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Tenant Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Lease Term
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Monthly Rent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLeases.slice(0, PAGE_SIZE).map((l, index) => (
                  <tr key={l._id} className={`table-row stagger-item ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold shadow-sm">
                          {l.unitId?.unitNumber || "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            Unit {l.unitId?.unitNumber || "N/A"}
                          </div>
                          {l.unitId?.type && (
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100/80 rounded-full px-2 py-0.5 inline-block mt-1">
                              {l.unitId.type}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold shadow-sm">
                          {(l.tenantId?.fullName || "T").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {l.tenantId?.fullName || "Tenant"}
                          </div>
                          {l.tenantId?.email && (
                            <div className="text-xs text-slate-500">
                              {l.tenantId.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">
                          {formatDate(l.startDate)}
                        </div>
                        <div className="text-slate-500">to</div>
                        <div className="font-medium text-slate-900">
                          {formatDate(l.endDate)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-slate-900">
                        {formatCurrency(l.monthlyRentEtb)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          l.status === "ACTIVE"
                            ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
                            : l.status === "ENDED"
                            ? "bg-slate-100/70 text-slate-700 border border-slate-200"
                            : "bg-slate-100/70 text-slate-700 border border-slate-300"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          l.status === "ACTIVE" ? "bg-emerald-500" :
                          l.status === "ENDED" ? "bg-slate-500" : "bg-slate-400"
                        }`}></div>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link
                          to={`/leases/${l._id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all duration-200"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Link>
                        {l.unitId?._id && (
                          <Link
                            to={`/units/${l.unitId._id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
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
      </DashboardCard>
    </div>
  );
}
