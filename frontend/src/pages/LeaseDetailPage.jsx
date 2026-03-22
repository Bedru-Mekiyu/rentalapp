// src/pages/LeaseDetailPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import ResponsiveSection from "../components/ResponsiveSection";
import { useAuthStore } from "../store/authStore";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import SkeletonCard from "../components/SkeletonCard";
import MobileBackBar from "../components/MobileBackBar";
import { getLeaseMonthlyRentEtb } from "../utils/pricing";

export default function LeaseDetailPage() {
  const { id: leaseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isTenant = user?.role === "TENANT";
  const isFinanceStaff = user?.role === "FS";
  const useRightStackedBackAction = isTenant || isFinanceStaff;
  const canEndLease = user?.role === "ADMIN" || user?.role === "PM";
  const backTarget = useRightStackedBackAction ? "/dashboard" : "/leases";
  const backLabel = useRightStackedBackAction ? "Back to Dashboard" : "Back to Leases";

  const [lease, setLease] = useState(null);
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);

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
        const getPaymentLeaseId = (payment) => {
          const value = payment?.leaseId;
          if (!value) return null;
          if (typeof value === "string") return value;
          if (typeof value === "object") return value._id || null;
          return String(value);
        };
        const filtered = allPayments.filter(
          (p) => {
            const paymentLeaseId = getPaymentLeaseId(p);
            return !paymentLeaseId || String(paymentLeaseId) === String(leaseId);
          }
        );
        setPayments(filtered);
      }
    } catch {
      toast.error("Failed to load lease details");
    } finally {
      setLoading(false);
    }
  }, [leaseId]);

  useEffect(() => {
    if (!leaseId || leaseId === "undefined") {
      navigate("/leases");
      return;
    }
    loadLease();
  }, [leaseId, loadLease, navigate]);

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
          eyebrowClassName="bg-primary-100 text-primary-700"
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
        <p className="text-sm text-danger-600">Lease not found.</p>
        <button
          onClick={() => navigate(backTarget)}
          className="btn-pill btn-outline btn-outline-neutral"
        >
          {backLabel}
        </button>
      </div>
    );
  }

  const statusClass =
    lease.status === "ACTIVE"
      ? "status-success"
      : lease.status === "PENDING"
      ? "status-warning"
      : ["ENDED", "TERMINATED", "CANCELLED"].includes(lease.status)
      ? "status-danger"
      : "status-neutral";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lease"
        eyebrowClassName="bg-primary-100 text-primary-700"
        title="Lease Detail"
        subtitle={`${lease.unitId?.name || "Unit"} · ${lease.tenantId?.fullName || "Tenant"}`}
        backTo={useRightStackedBackAction ? undefined : backTarget}
        backLabel={backLabel}
        actions={
          <div className={`flex gap-2 ${useRightStackedBackAction ? "flex-col items-end" : ""}`}>
            {useRightStackedBackAction && (
              <button
                type="button"
                onClick={() => navigate(backTarget)}
                className="btn-pill btn-outline btn-outline-neutral"
              >
                {backLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                navigate(
                  lease.unitId?._id ? `/units/${lease.unitId._id}` : "/units"
                )
              }
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              View Unit
            </button>
            {lease.status === "ACTIVE" && canEndLease && (
              <button
                type="button"
                disabled={ending}
                onClick={handleEndLease}
                className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {ending ? "Ending..." : "End Lease"}
              </button>
            )}
          </div>
        }
      />

      {/* Lease info */}
      <ResponsiveSection title="Lease Information">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-neutral-500">Status</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
              {lease.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Monthly Rent</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatCurrency(getLeaseMonthlyRentEtb(lease))}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Tax Rate</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {lease.taxRate ?? 0}%
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Start Date</p>
            <p className="mt-1 text-sm">{formatDate(lease.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">End Date</p>
            <p className="mt-1 text-sm">{formatDate(lease.endDate)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Created</p>
            <p className="mt-1 text-sm">
              {formatDate(lease.createdAt)}
            </p>
          </div>
        </div>
      </ResponsiveSection>

      {/* Finance summary */}
      <ResponsiveSection
        title="Financial Summary"
        description="Aggregate billing and payments for this lease."
      >
        {summary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-neutral-500">Total Billed</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {formatCurrency(summary.totalBilledEtb)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total Paid</p>
              <p className="mt-2 text-lg font-semibold text-success-600">
                {formatCurrency(summary.totalPaidEtb)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">
                Outstanding Balance
              </p>
              <p className="mt-2 text-lg font-semibold text-danger-600">
                {formatCurrency(summary.outstandingBalanceEtb)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Next Due Date</p>
              <p className="mt-2 text-sm font-semibold text-neutral-900">
                {summary.nextDueDate
                  ? formatDate(summary.nextDueDate)
                  : "No upcoming due date"}
              </p>
              {summary.daysOverdue > 0 && (
                <p className="text-xs text-danger-600">
                  {summary.daysOverdue} days overdue
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            No financial summary available.
          </p>
        )}
      </ResponsiveSection>

      {/* Payments */}
      <ResponsiveSection
        title="Payments for this Lease"
        description="Shows manual and digital payments linked to this tenant (filtered by lease when possible)."
      >
        {payments.length === 0 ? (
          <div className="space-y-3">
            <SkeletonTable rows={3} columns={5} />
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-6 text-center">
              <div className="text-sm font-medium text-neutral-700">No payments yet</div>
              <div className="mt-1 text-xs text-neutral-500">
                Payments will appear once recorded.
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-xs">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                    Method
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2">
                      {formatDate(p.transactionDate)}
                    </td>
                    <td className="px-4 py-2">
                      {formatCurrency(p.amountEtb || 0)}
                    </td>
                    <td className="px-4 py-2">{p.paymentMethod}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          p.status === "VERIFIED"
                            ? "status-success"
                            : p.status === "PENDING"
                            ? "status-warning"
                            : "status-danger"
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
      </ResponsiveSection>
      <MobileBackBar to={backTarget} label={backLabel} />
    </div>
  );
}
