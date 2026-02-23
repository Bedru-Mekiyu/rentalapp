// src/pages/LeaseDetailPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { useAuthStore } from "../store/authStore";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import SkeletonCard from "../components/SkeletonCard";

export default function LeaseDetailPage() {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const canEndLease = user?.role === "ADMIN" || user?.role === "PM";

  const [lease, setLease] = useState(null);
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!leaseId || leaseId === 'undefined') {
      navigate('/leases');
      return;
    }
    loadLease();
  }, [leaseId, loadLease, navigate]);

  const loadLease = useCallback(async () => {
    try {
      setLoading(true);
      const [leaseRes, summaryRes] = await Promise.all([
        API.get(`/leases/${leaseId}`), // you can add this route or reuse list + filter
        API.get(`/finance/lease/${leaseId}/summary`).catch(() => ({
          data: null,
        })), // finance summary
      ]);
      const leaseData = leaseRes.data?.data;
      setLease(leaseData);
      setSummary(summaryRes.data?.data || summaryRes.data);

      if (leaseData?.tenantId?._id) {
        const payRes = await API.get(
          `/payments/by-tenant/${leaseData.tenantId._id}`
        ); // list tenant payments
        // filter only this lease's payments if leaseId field exists
        const allPayments = payRes.data?.data || [];
        const filtered = allPayments.filter(
          (p) => !p.leaseId || p.leaseId === leaseId
        );
        setPayments(filtered);
      }
    } catch {
      toast.error("Failed to load lease details");
    } finally {
      setLoading(false);
    }
  }, [leaseId]);

  const handleEndLease = async () => {
    if (!window.confirm("End this lease and mark unit as VACANT?")) return;
    try {
      setEnding(true);
      await API.patch(`/leases/${leaseId}/end`); // controller updates status + unit
      toast.success("Lease ended");
      await loadLease();
    } catch {
      toast.error("Failed to end lease");
    } finally {
      setEnding(false);
    }
  };

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
          eyebrow="Lease"
          eyebrowClassName="bg-slate-100 text-slate-700"
          title="Lease Detail"
          subtitle="Loading lease details..."
        />
        <SkeletonCard title="Lease Overview">
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard title="Payment Summary">
          <SkeletonTable rows={4} columns={4} />
        </SkeletonCard>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Lease not found.</p>
        <button
          onClick={() => navigate(user?.role === "TENANT" ? "/dashboard" : "/leases")}
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700"
        >
          Back to {user?.role === "TENANT" ? "Dashboard" : "Leases"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lease"
        eyebrowClassName="bg-slate-100 text-slate-700"
        title="Lease Detail"
        subtitle={`${lease.unitId?.name || "Unit"} · ${lease.tenantId?.fullName || "Tenant"}`}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  lease.unitId?._id ? `/units/${lease.unitId._id}` : "/units"
                )
              }
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700"
            >
              View Unit
            </button>
            {lease.status === "ACTIVE" && canEndLease && (
              <button
                type="button"
                disabled={ending}
                onClick={handleEndLease}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-60"
              >
                {ending ? "Ending..." : "End Lease"}
              </button>
            )}
          </div>
        }
      />

      {/* Lease info */}
      <DashboardCard title="Lease Information">
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <span className="mt-2 inline-flex rounded-full bg-slate-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              {lease.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500">Monthly Rent</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatCurrency(lease.monthlyRentEtb)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Tax Rate</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {lease.taxRate ?? 0}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Start Date</p>
            <p className="mt-1 text-sm">{formatDate(lease.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">End Date</p>
            <p className="mt-1 text-sm">{formatDate(lease.endDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Created</p>
            <p className="mt-1 text-sm">
              {formatDate(lease.createdAt)}
            </p>
          </div>
        </div>
      </DashboardCard>

      {/* Finance summary */}
      <DashboardCard
        title="Financial Summary"
        description="Aggregate billing and payments for this lease."
      >
        {summary ? (
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Total Billed</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {formatCurrency(summary.totalBilledEtb)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="mt-2 text-lg font-semibold text-emerald-600">
                {formatCurrency(summary.totalPaidEtb)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">
                Outstanding Balance
              </p>
              <p className="mt-2 text-lg font-semibold text-red-600">
                {formatCurrency(summary.outstandingBalanceEtb)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Next Due Date</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {summary.nextDueDate
                  ? formatDate(summary.nextDueDate)
                  : "No upcoming due date"}
              </p>
              {summary.daysOverdue > 0 && (
                <p className="text-xs text-red-600">
                  {summary.daysOverdue} days overdue
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No financial summary available.
          </p>
        )}
      </DashboardCard>

      {/* Payments */}
      <DashboardCard
        title="Payments for this Lease"
        description="Shows manual and digital payments linked to this tenant (filtered by lease when possible)."
      >
        {payments.length === 0 ? (
          <div className="space-y-3">
            <SkeletonTable rows={3} columns={5} />
            <div className="empty-state">
              <div className="empty-state-title">No payments yet</div>
              <div className="empty-state-text">Payments will appear once recorded.</div>
            </div>
          </div>
        ) : (
          <div className="table-shell">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Method
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payments.map((p) => (
                  <tr key={p._id} className="table-row">
                    <td className="px-4 py-2">
                      {formatDate(p.transactionDate)}
                    </td>
                    <td className="px-4 py-2">
                      {formatCurrency(p.amountEtb || 0)}
                    </td>
                    <td className="px-4 py-2">{p.paymentMethod}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          p.status === "VERIFIED"
                            ? "bg-emerald-100/70 text-emerald-700"
                            : p.status === "PENDING"
                            ? "bg-amber-100/70 text-amber-700"
                            : "bg-red-100/70 text-red-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {p.externalTransactionId || "—"}
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
