// src/pages/PaymentDetailPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import SkeletonCard from "../components/SkeletonCard";
import { useAuthStore } from "../store/authStore";

export default function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const canVerify = user?.role === "PM" || user?.role === "ADMIN";

  const loadPayment = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/payments/${id}`);
      setPayment(res.data?.data || null);
    } catch {
      toast.error("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      navigate("/payments");
      return;
    }
    loadPayment();
  }, [id, loadPayment, navigate]);

  const handleUpdateStatus = async (status) => {
    if (!window.confirm(`Change payment status to ${status}?`)) return;
    try {
      setUpdating(true);
      const res = await API.patch(`/payments/${id}/status`, { status });
      setPayment(res.data?.data || null);
      toast.success("Payment status updated");
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  const statusClass =
    payment?.status === "VERIFIED"
      ? "status-emerald"
      : payment?.status === "REJECTED"
      ? "status-rose"
      : "status-amber";

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Payments"
          eyebrowClassName="bg-emerald-100 text-emerald-700"
          title="Payment Detail"
          subtitle="Loading payment details..."
        />
        <SkeletonCard title="Payment Overview">
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard title="References">
          <SkeletonTable rows={3} columns={3} />
        </SkeletonCard>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Payment not found.</p>
        <button
          onClick={() => navigate("/payments")}
          className="btn-pill btn-outline btn-outline-slate"
        >
          Back to Payments
        </button>
      </div>
    );
  }

  const lease = payment.leaseId;
  const tenantName = lease?.tenantId?.fullName || "Tenant";
  const unitName = lease?.unitId?.name || lease?.unitId?.unitNumber || "Unit";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Payment Detail"
        subtitle={`${tenantName} · ${unitName}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/payments")}
              className="btn-pill btn-outline btn-outline-slate"
            >
              Back to Payments
            </button>
            {canVerify && payment.status !== "VERIFIED" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("VERIFIED")}
                className="btn-pill btn-soft btn-soft-emerald disabled:opacity-60"
              >
                Verify
              </button>
            )}
            {canVerify && payment.status !== "REJECTED" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("REJECTED")}
                className="btn-pill btn-soft btn-soft-rose disabled:opacity-60"
              >
                Reject
              </button>
            )}
          </div>
        }
      />

      <DashboardCard title="Payment Overview">
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <span className={`status-pill ${statusClass} mt-2`}>
              {payment.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500">Amount</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatCurrency(payment.amountEtb)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Transaction Date</p>
            <p className="mt-1 text-sm">{formatDate(payment.transactionDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Payment Method</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {payment.paymentMethod || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Transaction ID</p>
            <p className="mt-1 text-sm">
              {payment.externalTransactionId || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Verified At</p>
            <p className="mt-1 text-sm">{formatDate(payment.verifiedAt)}</p>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title="References"
        description="Linked lease and tenant details."
      >
        <div className="table-shell">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">
                  Lease
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">
                  Tenant
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">
                  Unit
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr className="table-row">
                <td className="px-4 py-2">{lease?._id || "—"}</td>
                <td className="px-4 py-2">{tenantName}</td>
                <td className="px-4 py-2">{unitName}</td>
                <td className="px-4 py-2">
                  {lease?._id ? (
                    <Link
                      to={`/leases/${lease._id}`}
                      className="link-action link-action-emerald"
                    >
                      View lease
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
