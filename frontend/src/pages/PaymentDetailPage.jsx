// src/pages/PaymentDetailPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import ResponsiveSection from "../components/ResponsiveSection";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import DashboardCard from "../components/DashboardCard";
import { useAuthStore } from "../store/authStore";
import MobileBackBar from "../components/MobileBackBar";

export default function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTenant = user?.role === "TENANT";
  const isFinanceStaff = user?.role === "FS";
  const isAdmin = user?.role === "ADMIN";
  const useDashboardBack = isTenant || isFinanceStaff;
  const useRightStackedBackAction = useDashboardBack || isAdmin;
  const backTarget = useDashboardBack ? "/dashboard" : "/payments";
  const backLabel = useDashboardBack ? "Back to Dashboard" : "Back to Payments";

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
      navigate(backTarget);
      return;
    }
    loadPayment();
  }, [id, loadPayment, navigate, backTarget]);

  const handleUpdateStatus = async (status) => {
    if (!window.confirm(`Change payment status to ${status}?`)) return;
    try {
      setUpdating(true);
      const res = await API.patch(`/payments/${id}/status`, { status });
      setPayment(res.data?.data || null);
      toast.success(
        status === "VERIFIED"
          ? "Payment verified"
          : status === "REJECTED"
          ? "Payment rejected"
          : "Payment status updated"
      );
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
      ? "bg-success-100 text-success-700"
      : payment?.status === "REJECTED"
      ? "bg-danger-100 text-danger-700"
      : "bg-warning-100 text-warning-700";

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payment Detail"
          subtitle="Loading payment details..."
        />
        <DashboardCard title="Payment Overview">
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
            <SkeletonRow className="h-16 w-full" />
          </div>
        </DashboardCard>
        <DashboardCard title="References">
          <SkeletonTable rows={3} columns={3} />
        </DashboardCard>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-danger-600">Payment not found.</p>
        <button
          onClick={() => navigate(backTarget)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          {backLabel}
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
        title={`Payment ${payment.externalTransactionId || payment._id?.slice(-6) || ""}`}
        subtitle={`${tenantName} · ${unitName}`}
        backTo={useRightStackedBackAction ? undefined : backTarget}
        backLabel={backLabel}
        actions={
          <div className={`flex flex-wrap items-center gap-2 ${useRightStackedBackAction ? "flex-col items-end" : ""}`}>
            {useRightStackedBackAction && (
              <button
                type="button"
                onClick={() => navigate(backTarget)}
                className="btn-pill btn-outline btn-outline-neutral"
              >
                {backLabel}
              </button>
            )}
            {canVerify && payment.status !== "VERIFIED" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("VERIFIED")}
                className="rounded-md bg-success-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Verify
              </button>
            )}
            {canVerify && payment.status !== "REJECTED" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("REJECTED")}
                className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Reject
              </button>
            )}
          </div>
        }
      />

      <ResponsiveSection title="Payment Overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-neutral-500">Status</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass} mt-2`}>
              {payment.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Amount</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatCurrency(payment.amountEtb)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Transaction Date</p>
            <p className="mt-1 text-sm">{formatDate(payment.transactionDate)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Payment Method</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {payment.paymentMethod || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Transaction ID</p>
            <p className="mt-1 text-sm">
              {payment.externalTransactionId || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Verified At</p>
            <p className="mt-1 text-sm">{formatDate(payment.verifiedAt)}</p>
          </div>
        </div>
      </ResponsiveSection>

      <ResponsiveSection
        title="References"
        description="Linked lease and tenant details."
      >
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-xs">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                  Lease
                </th>
                <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                  Tenant
                </th>
                <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                  Unit
                </th>
                <th className="px-4 py-2 text-left font-semibold text-neutral-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              <tr className="hover:bg-neutral-50">
                <td className="px-4 py-2">{lease?._id || "—"}</td>
                <td className="px-4 py-2">{tenantName}</td>
                <td className="px-4 py-2">{unitName}</td>
                <td className="px-4 py-2">
                  {lease?._id ? (
                    <Link
                      to={`/leases/${lease._id}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
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
      </ResponsiveSection>
      <MobileBackBar to={backTarget} label={backLabel} />
    </div>
  );
}
