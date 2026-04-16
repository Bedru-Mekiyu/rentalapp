// src/pages/FinancePage.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DollarSign, AlertTriangle, CheckCircle, Calendar, Wrench } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";

export default function FinancePage() {
  const [leases, setLeases] = useState([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState("ALL");
  const [summary, setSummary] = useState(null);
  const [loadingLeases, setLoadingLeases] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  useEffect(() => {
    loadLeases();
    loadMaintenanceRequests();
  }, []);

  useEffect(() => {
    loadSummary(selectedLeaseId);
  }, [selectedLeaseId]);

  const loadLeases = async () => {
    try {
      setLoadingLeases(true);
      const res = await API.get("/leases"); // list all leases for selector
      setLeases(res.data?.data || []);
    } catch {
      toast.error("Failed to load leases for finance summary");
    } finally {
      setLoadingLeases(false);
    }
  };

  const loadSummary = async (leaseId) => {
    if (leaseId === "ALL") {
      try {
        setLoadingSummary(true);
        const res = await API.get("/finance/portfolio/summary");
        setSummary(res.data?.data || res.data);
      } catch {
        toast.error("Failed to load portfolio summary");
        setSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    } else {
      try {
        setLoadingSummary(true);
        const res = await API.get(`/finance/lease/${leaseId}/summary`);
        setSummary(res.data?.data || res.data);
      } catch (err) {
        const msg =
          err.response?.status === 404
            ? "Lease not found for summary"
            : "Failed to load financial summary";
        toast.error(msg);
        setSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    }
  };

  const loadMaintenanceRequests = async () => {
    try {
      setLoadingMaintenance(true);
      const res = await API.get("/maintenance");
      setMaintenanceRequests(res.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load maintenance requests");
      setMaintenanceRequests([]);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const formatCompactCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v || 0);

  const leaseChartData = [
    { name: "Billed", amount: summary?.totalBilledEtb || 0, fill: "var(--chart-primary)" },
    { name: "Paid", amount: summary?.totalPaidEtb || 0, fill: "var(--chart-secondary)" },
    { name: "Outstanding", amount: summary?.outstandingBalanceEtb || 0, fill: "var(--chart-axis)" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Lease Analytics"
        subtitle="View financial KPIs and per-lease payment summaries."
        actions={
          <button
            type="button"
            className="btn-secondary text-xs font-semibold"
            onClick={() => {
              const section = document.getElementById("maintenance-report-section");
              if (section) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            Maintenance Report
          </button>
        }
      />

      {/* Financial Summary */}
      <DashboardCard
        title="Financial Summary"
        description="Select a lease to see its financial summary, or view aggregate for all leases."
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Lease
            </label>
            {loadingLeases ? (
              <SkeletonRow className="h-12 w-full" />
            ) : (
              <select
                value={selectedLeaseId}
                onChange={(e) => setSelectedLeaseId(e.target.value)}
                disabled={leases.length === 0}
                className="form-select text-sm disabled:opacity-60"
              >
                <option value="ALL">All Leases (Aggregate)</option>
                {leases.map((lease) => (
                  <option key={lease._id} value={lease._id}>
                    {lease.unitId?.unitNumber || "Unit"} ·{" "}
                    {lease.tenantId?.fullName || "Tenant"} ·{" "}
                    {lease.status}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="min-w-0 text-xs text-neutral-500">
            Choose a lease to fetch its financial summary from the backend
            service. Aggregate shows portfolio-level data for all leases.
          </div>
        </div>

        {loadingSummary && (
          <div className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardCard>
                <SkeletonRow className="h-3 w-28" />
                <div className="mt-3">
                  <SkeletonRow className="h-8 w-32" />
                </div>
              </DashboardCard>
              <DashboardCard>
                <SkeletonRow className="h-3 w-32" />
                <div className="mt-3">
                  <SkeletonRow className="h-8 w-32" />
                </div>
              </DashboardCard>
              <DashboardCard>
                <SkeletonRow className="h-3 w-32" />
                <div className="mt-3">
                  <SkeletonRow className="h-8 w-24" />
                </div>
              </DashboardCard>
            </div>
            <div className="surface-panel analytics-panel p-4 sm:p-5">
              <SkeletonRow className="h-48 w-full" />
            </div>
          </div>
        )}

        {!loadingSummary && summary && selectedLeaseId === "ALL" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow card-reveal stagger-item p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-success-700">Total Revenue (YTD)</p>
                  <p className="text-xl sm:text-2xl font-semibold text-success-900 mt-2">
                    {formatCurrency(summary.totalRevenueYTD)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow card-reveal stagger-item p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-danger-700">Outstanding Balance</p>
                  <p className="text-xl sm:text-2xl font-semibold text-danger-900 mt-2">
                    {formatCurrency(summary.outstandingBalance)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-danger-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow card-reveal stagger-item p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-700">On-time Payment Rate</p>
                  <p className="text-xl sm:text-2xl font-semibold text-secondary-900 mt-2">
                    {summary.onTimePaymentRate}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-secondary-600" />
              </div>
            </div>
          </div>
        )}

        {!loadingSummary && summary && selectedLeaseId !== "ALL" && (
          <>
            <div className="surface-panel analytics-panel mb-4 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Billing vs Payments
                </p>
                <span className="text-[11px] text-neutral-500">Amount (ETB)</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={leaseChartData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--chart-axis)"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    width={74}
                    tickFormatter={(value) => formatCompactCurrency(value)}
                    stroke="var(--chart-axis)"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    cursor={{ fill: "var(--chart-grid)", fillOpacity: 0.28 }}
                    labelStyle={{ color: "var(--chart-axis)", fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: 'var(--chart-tooltip-bg)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow: 'var(--chart-tooltip-shadow)'
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={70}
                    activeBar={{ className: 'chart-active-dot' }}
                  >
                    {leaseChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow card-reveal stagger-item p-4">
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Total Billed</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {formatCurrency(summary.totalBilledEtb)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow card-reveal stagger-item p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-success-600">Total Paid</p>
                    <p className="text-lg font-semibold text-success-900">
                      {formatCurrency(summary.totalPaidEtb)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow card-reveal stagger-item p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-danger-600" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-danger-600">Outstanding Balance</p>
                    <p className="text-lg font-semibold text-danger-900">
                      {formatCurrency(summary.outstandingBalanceEtb)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow card-reveal stagger-item p-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-secondary-600" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-600">Next Due Date</p>
                    <p className="text-sm font-semibold text-secondary-900">
                      {summary.nextDueDate
                        ? new Date(summary.nextDueDate).toLocaleDateString()
                        : "No upcoming due date"}
                    </p>
                    {summary.daysOverdue > 0 && (
                      <p className="text-xs text-danger-600 mt-1">
                        {summary.daysOverdue} days overdue
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!loadingSummary && !summary && selectedLeaseId !== "ALL" && (
          <p className="mt-2 text-xs text-neutral-500">
            No financial summary available for this lease.
          </p>
        )}
      </DashboardCard>

      <div id="maintenance-report-section">
      <DashboardCard
        title="Maintenance Request Report"
        description="Read-only maintenance request feed for finance visibility."
      >
        {loadingMaintenance ? (
          <div className="space-y-3">
            <SkeletonRow className="h-10 w-full" />
            <SkeletonRow className="h-10 w-full" />
            <SkeletonRow className="h-10 w-full" />
          </div>
        ) : maintenanceRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No maintenance requests found</div>
            <div className="empty-state-text">Requests will appear here when submitted by tenants.</div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="w-full min-w-150 divide-y divide-neutral-200 text-xs">
              <thead className="table-head">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-neutral-500 whitespace-nowrap">Date</th>
                  <th className="px-2 py-2 text-left font-semibold text-neutral-500 whitespace-nowrap">Unit</th>
                  <th className="px-2 py-2 text-left font-semibold text-neutral-500 whitespace-nowrap">Category</th>
                  <th className="px-2 py-2 text-left font-semibold text-neutral-500 whitespace-nowrap">Urgency</th>
                  <th className="px-2 py-2 text-left font-semibold text-neutral-500 whitespace-nowrap">Status</th>
                  <th className="px-2 py-2 text-left font-semibold text-neutral-500">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {maintenanceRequests.slice(0, 15).map((request) => (
                  <tr key={request._id} className="table-row">
                    <td className="px-2 py-2 whitespace-nowrap text-neutral-600">
                      {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-neutral-700">
                      {request.unitId?.unitNumber || "N/A"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-neutral-700">
                      {request.category || "General"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-neutral-700">
                      {request.urgency || "Normal"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className="status-pill status-neutral">{request.status || "Pending"}</span>
                    </td>
                    <td className="px-2 py-2 text-neutral-700">
                      <div className="max-w-60 truncate" title={request.description || ""}>
                        {request.description || "-"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
          <div className="inline-flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Read-only feed for finance team and general managers.
          </div>
          <button
            type="button"
            className="link-action link-action-primary"
            onClick={loadMaintenanceRequests}
          >
            Refresh maintenance data
          </button>
        </div>
      </DashboardCard>
      </div>
    </div>
  );
}
