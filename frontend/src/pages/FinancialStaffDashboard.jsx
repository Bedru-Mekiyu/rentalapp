// src/pages/FinancialStaffDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonCard from "../components/SkeletonCard";

const Avatar = ({ name }) => {
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-semibold text-white shadow-sm ring-2 ring-white">
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

      // TODO: replace with a real staff-wide payments endpoint: GET /payments
      // For now, use mocked data so backend is not called with invalid ids.
      const mocked = [
        {
          _id: "1",
          tenantName: "Alice Johnson",
          amountEtb: 15000,
          paymentMethod: "BANK_TRANSFER",
          status: "PENDING",
          transactionDate: "2025-12-01T00:00:00.000Z",
          externalTransactionId: "TXN001",
        },
        {
          _id: "2",
          tenantName: "Bob Williams",
          amountEtb: 12000,
          paymentMethod: "CASH",
          status: "VERIFIED",
          transactionDate: "2025-11-25T00:00:00.000Z",
          externalTransactionId: "TXN002",
        },
      ];

      const allPayments = mocked;
      setPayments(allPayments);

      const pending = allPayments.filter((p) => p.status === "PENDING");
      setQueue(pending);

      const totalRevenue = allPayments
        .filter((p) => p.status === "VERIFIED")
        .reduce((sum, p) => sum + (p.amountEtb || 0), 0);

      setSummary({
        totalRevenue,
        pendingPayments: pending.length,
        overdueAmount: 7500,
        processedPayments: allPayments.filter(
          (p) => p.status === "VERIFIED"
        ).length,
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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Finance"
          eyebrowClassName="bg-emerald-100 text-emerald-700"
          title="Financial Staff Dashboard"
          subtitle="View invoices, payment status, and financial reports."
        />
        <div className="grid gap-4 md:grid-cols-4">
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
        eyebrowClassName="bg-emerald-100 text-emerald-700"
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

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total Revenue (verified)">
          <p className="text-xl font-semibold text-slate-900">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </DashboardCard>
        <DashboardCard title="Pending Payments">
          <p className="text-xl font-semibold text-amber-600">
            {summary.pendingPayments}
          </p>
        </DashboardCard>
        <DashboardCard title="Overdue Amount">
          <p className="text-xl font-semibold text-red-600">
            {formatCurrency(summary.overdueAmount)}
          </p>
        </DashboardCard>
        <DashboardCard title="Processed Payments">
          <p className="text-xl font-semibold text-emerald-600">
            {summary.processedPayments}
          </p>
        </DashboardCard>
      </div>

      {/* Invoice preview */}
      <DashboardCard
        title="Invoice Details Preview"
        description="Preview invoice fields (creation handled by management)."
      >
        <div className="grid gap-3 md:grid-cols-3 text-xs">
          <div className="space-y-1">
            <p className="text-slate-600">Tenant Name</p>
            <p className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-slate-500">
              e.g. Alice Johnson
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-600">Invoice Amount (ETB)</p>
            <p className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-slate-500">
              15,000
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-600">Due Date</p>
            <p className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-slate-500">
              2025‑01‑31
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
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
                className="stagger-item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={item.tenantName || "Tenant"} />
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.tenantName || "Tenant"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatCurrency(item.amountEtb)} · {item.paymentMethod}
                    </p>
                  </div>
                </div>
                <span className="inline-flex rounded-full bg-amber-100/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  Awaiting manager decision
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      {/* Payment history + reports */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DashboardCard
          title="Payment History"
          description="Recent payment records."
        >
          <div className="table-shell">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="table-head">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Tenant
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Method
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payments.slice(0, 6).map((p) => (
                  <tr key={p._id} className="table-row">
                    <td className="px-3 py-2 text-slate-600">
                      {p.transactionDate
                        ? new Date(p.transactionDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {p.tenantName || "Tenant"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatCurrency(p.amountEtb || 0)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{p.paymentMethod}</td>
                    <td className="px-3 py-2">
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
            <li className="stagger-item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">
              <span>Monthly Revenue Report</span>
              <Link
                to="#"
                className="text-emerald-600 hover:text-emerald-700"
              >
                View
              </Link>
            </li>
            <li className="stagger-item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">
              <span>Delinquency Report</span>
              <Link
                to="#"
                className="text-emerald-600 hover:text-emerald-700"
              >
                View
              </Link>
            </li>
            <li className="stagger-item flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">
              <span>Expense Report</span>
              <Link
                to="#"
                className="text-emerald-600 hover:text-emerald-700"
              >
                View
              </Link>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            Export actions are handled by accounting; this section is for
            reference only.
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}
