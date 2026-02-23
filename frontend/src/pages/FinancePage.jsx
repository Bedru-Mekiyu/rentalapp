// src/pages/FinancePage.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonCard from "../components/SkeletonCard";

export default function FinancePage() {
  const [leases, setLeases] = useState([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState("ALL");
  const [summary, setSummary] = useState(null);
  const [loadingLeases, setLoadingLeases] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadLeases();
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

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Finance & Lease Analytics"
        subtitle="View financial KPIs and per-lease payment summaries."
      />

      {/* Financial Summary */}
      <DashboardCard
        title="Financial Summary"
        description="Select a lease to see its financial summary, or view aggregate for all leases."
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
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
          <div className="text-xs text-slate-500">
            Choose a lease to fetch its financial summary from the backend
            service. Aggregate shows portfolio-level data for all leases.
          </div>
        </div>

        {loadingSummary && (
          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <SkeletonCard>
                <SkeletonRow className="h-3 w-28" />
                <div className="mt-3">
                  <SkeletonRow className="h-8 w-32" />
                </div>
              </SkeletonCard>
              <SkeletonCard>
                <SkeletonRow className="h-3 w-32" />
                <div className="mt-3">
                  <SkeletonRow className="h-8 w-32" />
                </div>
              </SkeletonCard>
              <SkeletonCard>
                <SkeletonRow className="h-3 w-32" />
                <div className="mt-3">
                  <SkeletonRow className="h-8 w-24" />
                </div>
              </SkeletonCard>
            </div>
            <div className="surface-panel analytics-panel p-5">
              <SkeletonRow className="h-48 w-full" />
            </div>
          </div>
        )}

        {!loadingSummary && summary && selectedLeaseId === "ALL" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="surface-panel card-reveal hover-lift stagger-item p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Revenue (YTD)</p>
                  <p className="text-2xl font-semibold text-emerald-900 mt-2">
                    {formatCurrency(summary.totalRevenueYTD)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <div className="surface-panel card-reveal hover-lift stagger-item p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Outstanding Balance</p>
                  <p className="text-2xl font-semibold text-red-900 mt-2">
                    {formatCurrency(summary.outstandingBalance)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="surface-panel card-reveal hover-lift stagger-item p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">On-time Payment Rate</p>
                  <p className="text-2xl font-semibold text-teal-900 mt-2">
                    {summary.onTimePaymentRate}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-teal-600" />
              </div>
            </div>
          </div>
        )}

        {!loadingSummary && summary && selectedLeaseId !== "ALL" && (
          <>
            <div className="surface-panel analytics-panel mb-4 p-5">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Billed', amount: summary.totalBilledEtb },
                  { name: 'Paid', amount: summary.totalPaidEtb },
                  { name: 'Outstanding', amount: summary.outstandingBalanceEtb },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="name" stroke="var(--chart-axis)" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="var(--chart-axis)" />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'var(--chart-tooltip-bg)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow: 'var(--chart-tooltip-shadow)'
                    }}
                  />
                  <Bar dataKey="amount" fill="var(--chart-secondary)" activeBar={{ className: 'chart-active-dot' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="surface-panel card-reveal hover-lift stagger-item p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Billed</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(summary.totalBilledEtb)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="surface-panel card-reveal hover-lift stagger-item p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Total Paid</p>
                    <p className="text-lg font-semibold text-emerald-900">
                      {formatCurrency(summary.totalPaidEtb)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="surface-panel card-reveal hover-lift stagger-item p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Outstanding Balance</p>
                    <p className="text-lg font-semibold text-red-900">
                      {formatCurrency(summary.outstandingBalanceEtb)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="surface-panel card-reveal hover-lift stagger-item p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600">Next Due Date</p>
                    <p className="text-sm font-semibold text-teal-900">
                      {summary.nextDueDate
                        ? new Date(summary.nextDueDate).toLocaleDateString()
                        : "No upcoming due date"}
                    </p>
                    {summary.daysOverdue > 0 && (
                      <p className="text-xs text-red-600 mt-1">
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
          <p className="mt-2 text-xs text-slate-500">
            No financial summary available for this lease.
          </p>
        )}
      </DashboardCard>
    </div>
  );
}
