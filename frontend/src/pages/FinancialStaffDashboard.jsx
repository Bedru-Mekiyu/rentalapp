// src/pages/FinancialStaffDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonCard from "../components/SkeletonCard";
import { Sparkles } from "lucide-react";

const Avatar = ({ name }) => {
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white ring-2 ring-white">
      {initials || "T"}
    </div>
  );
};

export default function FinancialStaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    overdueAmount: 0,
    processedPayments: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [paymentsRes, portfolioRes] = await Promise.all([
        API.get("/payments"),
        API.get("/finance/portfolio/summary"),
      ]);

      const allPayments = paymentsRes.data?.data || [];
      const portfolioSummary = portfolioRes.data?.data || {};

      const enrichedPayments = allPayments
        .map((payment) => {
          const relatedLease =
            payment.leaseId && typeof payment.leaseId === "object"
              ? payment.leaseId
              : null;
          return {
            ...payment,
            tenantName:
              relatedLease?.tenantId?.fullName || payment.tenantName || "Tenant",
          };
        })
        .sort(
          (a, b) =>
            new Date(b.transactionDate || 0).getTime() -
            new Date(a.transactionDate || 0).getTime()
        );

      setPayments(enrichedPayments);

      const pending = enrichedPayments.filter((p) => p.status === "PENDING");
      setQueue(pending);

      const totalRevenue = enrichedPayments
        .filter((p) => p.status === "VERIFIED")
        .reduce((sum, p) => sum + (p.amountEtb || 0), 0);

      const processedPayments = enrichedPayments.filter(
        (p) => p.status === "VERIFIED"
      ).length;

      setSummary({
        totalRevenue,
        pendingPayments: pending.length,
        overdueAmount: Number(portfolioSummary.outstandingBalance || 0),
        processedPayments,
      });
    } catch {
      toast.error("Failed to load financial dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v);

  const invoicePreview = queue[0] || payments[0] || null;
  const invoicePreviewDate = invoicePreview?.transactionDate
    ? new Date(invoicePreview.transactionDate).toLocaleDateString()
    : "—";

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Finance"
          eyebrowClassName="bg-primary-100 text-primary-700"
          title="Financial Staff Dashboard"
          subtitle="View invoices, payment status, and financial reports."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard>
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-28" />
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonRow className="h-3 w-24" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-16" />
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonRow className="h-3 w-28" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-24" />
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonRow className="h-3 w-28" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-20" />
            </div>
          </SkeletonCard>
        </div>
        <SkeletonCard>
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </SkeletonCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        eyebrowClassName="bg-primary-100 text-primary-700"
        title="Financial Staff Dashboard"
        subtitle="View invoices, payment status, and financial reports."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/payments"
              className="btn-secondary text-xs font-semibold"
            >
              Payments
            </Link>
            <Link
              to="/finance"
              className="btn-primary text-xs font-semibold"
            >
              Summary
            </Link>
          </div>
        }
      />

      <section className="insight-banner">
        <div className="insight-icon">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="insight-title">Queue spotlight</div>
          <div className="insight-text">
            {summary.pendingPayments} manual payments are waiting for review. Verify high-value payments first to reduce overdue balance.
          </div>
        </div>
        <div className="insight-actions">
          <Link to="/payments" className="btn-pill btn-outline btn-outline-success w-full justify-center sm:w-auto">
            Review Payments
          </Link>
          <Link to="/finance" className="btn-pill btn-outline btn-outline-primary w-full justify-center sm:w-auto">
            View Summary
          </Link>
        </div>
      </section>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Total Revenue (verified)">
          <p className="text-base font-semibold text-neutral-900 sm:text-lg">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </DashboardCard>
        <DashboardCard title="Pending Payments">
          <p className="kpi-value text-warning-600">
            {summary.pendingPayments}
          </p>
        </DashboardCard>
        <DashboardCard title="Overdue Amount">
          <p className="kpi-value text-danger-600">
            {formatCurrency(summary.overdueAmount)}
          </p>
        </DashboardCard>
        <DashboardCard title="Processed Payments">
          <p className="kpi-value text-success-600">
            {summary.processedPayments}
          </p>
        </DashboardCard>
      </div>

      {/* Invoice preview */}
      <DashboardCard
        title="Invoice Details Preview"
        description="Preview invoice fields (creation handled by management)."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div className="space-y-1">
            <p className="text-neutral-600">Tenant Name</p>
            <p className="rounded-2xl border border-neutral-100 bg-neutral-50/70 px-3 py-2 text-neutral-500">
              {invoicePreview?.tenantName || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-neutral-600">Invoice Amount (ETB)</p>
            <p className="rounded-2xl border border-neutral-100 bg-neutral-50/70 px-3 py-2 text-neutral-500">
              {invoicePreview ? formatCurrency(invoicePreview.amountEtb || 0) : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-neutral-600">Due Date</p>
            <p className="rounded-2xl border border-neutral-100 bg-neutral-50/70 px-3 py-2 text-neutral-500">
              {invoicePreviewDate}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-neutral-500">
          Invoice creation and approval are handled by managers. This section is
          read‑only.
        </p>
      </DashboardCard>

      {/* Manual payment queue (read-only) */}
      <DashboardCard
        title="Manual Payment Queue"
        description="Pending manual payments that await manager decision."
      >
        {queue.length === 0 ? (
          <div className="space-y-2">
            <SkeletonRow className="h-4 w-2/3" />
            <SkeletonRow className="h-4 w-1/2" />
            <div className="empty-state">
              <div className="empty-state-title">No pending manual payments</div>
              <div className="empty-state-text">Queue will populate when payments are submitted.</div>
            </div>
          </div>
        ) : (
          <ul className="space-y-2 text-xs">
            {queue.map((item) => (
              <li
                key={item._id}
                className="stagger-item flex flex-col gap-2 rounded-2xl border border-neutral-100 bg-neutral-50/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={item.tenantName || "Tenant"} />
                  <div>
                    <p className="font-medium text-neutral-900">
                      {item.tenantName || "Tenant"}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {formatCurrency(item.amountEtb)} · {item.paymentMethod}
                    </p>
                  </div>
                </div>
                <span className="status-pill status-warning">
                  Awaiting manager decision
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      {/* Payment history + reports */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DashboardCard
          title="Payment History"
          description="Recent payment records."
        >
          <div className="table-shell">
            <table className="min-w-full divide-y divide-neutral-200 text-xs">
              <thead className="table-head">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500">
                    Tenant
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500">
                    Method
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {payments.slice(0, 6).map((p) => (
                  <tr key={p._id} className="table-row">
                    <td className="px-3 py-2 text-neutral-600">
                      {p.transactionDate
                        ? new Date(p.transactionDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      {p.tenantName || "Tenant"}
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      {formatCurrency(p.amountEtb || 0)}
                    </td>
                    <td className="px-3 py-2 text-neutral-600">{p.paymentMethod}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`status-pill ${
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Financial Reports"
          description="Key financial reports (view‑only)."
        >
          <ul className="space-y-2 text-xs">
            <li className="stagger-item flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50/70 px-3 py-2">
              <span>Monthly Revenue Report</span>
              <Link
                to="/reports/monthly-revenue"
                className="link-action link-action-primary"
              >
                View
              </Link>
            </li>
            <li className="stagger-item flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50/70 px-3 py-2">
              <span>Delinquency Report</span>
              <Link
                to="/reports/delinquency"
                className="link-action link-action-primary"
              >
                View
              </Link>
            </li>
            <li className="stagger-item flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50/70 px-3 py-2">
              <span>Expense Report</span>
              <Link
                to="/reports/expense"
                className="link-action link-action-primary"
              >
                View
              </Link>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-neutral-500">
            Export actions are handled by accounting; this section is for
            reference only.
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}
