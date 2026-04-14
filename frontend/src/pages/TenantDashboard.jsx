// src/pages/TenantDashboard.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API from "../services/api";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Home,
  CreditCard,
  Wrench,
  FileText,
  Bell,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Download,
  Eye,
  Building,
  MapPin,
  Plus,
  X,
  Sparkles,
  Upload,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import { getLeaseMonthlyRentEtb } from "../utils/pricing";

const maintenanceSchema = z.object({
  category: z.string(),
  description: z
    .string()
    .min(5, "Please describe the issue in detail (at least 5 characters)"),
  urgency: z.enum(["low", "medium", "high"]),
});

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const userId = user?._id || user?.id;

  const [loading, setLoading] = useState(true);
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Enhanced maintenance form state
  const [maintenanceImage, setMaintenanceImage] = useState(null);
  const [maintenanceError, setMaintenanceError] = useState("");
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const statusTimersRef = useRef([]);

  const getMaintenanceStatusClass = (status) => {
    const normalized = status?.toLowerCase() || "";
    if (normalized.includes("completed") || normalized.includes("resolved")) {
      return "status-success";
    }
    if (normalized.includes("in_progress") || normalized.includes("progress")) {
      return "status-primary";
    }
    if (normalized.includes("pending") || normalized.includes("received")) {
      return "status-warning";
    }
    return "status-neutral";
  };

  const getUrgencyClass = (urgency) => {
    const normalized = urgency?.toLowerCase() || "";
    if (normalized === "emergency") return "status-danger";
    if (normalized === "high") return "status-warning";
    if (normalized === "medium") return "status-primary";
    return "status-success";
  };

  // Image preview for maintenance form
  const maintenancePreview = useMemo(() => {
    if (!maintenanceImage) return null;
    return URL.createObjectURL(maintenanceImage);
  }, [maintenanceImage]);

  // Handle image selection
  const handleMaintenanceImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMaintenanceError("Only image files are allowed");
      return;
    }
    setMaintenanceError("");
    setMaintenanceImage(file);
  };

  // Cleanup status timers on unmount
  useEffect(() => {
    return () => {
      statusTimersRef.current.forEach((timer) => clearTimeout(timer));
      statusTimersRef.current = [];
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { urgency: "medium" },
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [leaseRes, paymentRes, maintenanceRes, financeRes] = await Promise.allSettled([
        API.get(`/leases/by-tenant/${userId}`).catch(() => ({ data: { data: [] } })),
        API.get(`/payments/by-tenant/${userId}`).catch(() => ({ data: { data: [] } })),
        API.get(`/maintenance/by-tenant/${userId}`).catch(() => ({ data: { data: [] } })),
        API.get(`/finance/tenant/${userId}/summary`).catch(() => ({ data: null })),
      ]);

      const leaseData =
        leaseRes.status === "fulfilled"
          ? leaseRes.value?.data?.data || []
          : [];
      const paymentData =
        paymentRes.status === "fulfilled"
          ? paymentRes.value?.data?.data || []
          : [];
      const maintenanceData =
        maintenanceRes.status === "fulfilled"
          ? maintenanceRes.value?.data?.data || []
          : [];

      const activeLease = leaseData.find(
        (item) => String(item?.status || "").toUpperCase() === "ACTIVE"
      );
      const latestLease = [...leaseData].sort(
        (a, b) =>
          new Date(b?.startDate || 0).getTime() -
          new Date(a?.startDate || 0).getTime()
      )[0];

      setLease(activeLease || latestLease || null);
      setPayments(paymentData);
      setRequests(maintenanceData);

      const resolvedFinanceSummary =
        financeRes?.status === "fulfilled"
          ? financeRes.value?.data?.data || financeRes.value?.data || null
          : null;

      const dynamicDocuments = [];

      if (leaseData[0]?.leasePdfUrl) {
        dynamicDocuments.push({
          id: `lease-${leaseData[0]._id || "agreement"}`,
          name: "Lease Agreement",
          url: leaseData[0].leasePdfUrl,
        });
      }

      paymentData
        .filter((p) => p?.receiptUrl)
        .forEach((payment) => {
          dynamicDocuments.push({
            id: `payment-${payment._id || payment.receiptUrl}`,
            name:
              payment.externalTransactionId
                ? `Receipt ${payment.externalTransactionId}`
                : `Receipt ${new Date(
                    payment.transactionDate || payment.createdAt || Date.now()
                  ).toLocaleDateString()}`,
            url: payment.receiptUrl,
          });
        });

      setDocuments(dynamicDocuments);

      const generatedNotifications = [];

      if (resolvedFinanceSummary?.nextDueDate) {
        generatedNotifications.push({
          message: `Next payment due on ${new Date(
            resolvedFinanceSummary.nextDueDate
          ).toLocaleDateString()}.`,
          date: "Finance summary",
        });
      }

      if (Number(resolvedFinanceSummary?.daysOverdue || 0) > 0) {
        generatedNotifications.push({
          message: `${resolvedFinanceSummary.daysOverdue} day(s) overdue on rent payment.`,
          date: "Finance summary",
        });
      }

      const inProgressMaintenance = maintenanceData.find((request) =>
        String(request.status || "").toLowerCase().includes("progress")
      );
      if (inProgressMaintenance) {
        generatedNotifications.push({
          message: "A maintenance request is currently in progress.",
          date: inProgressMaintenance.updatedAt
            ? new Date(inProgressMaintenance.updatedAt).toLocaleDateString()
            : "Maintenance",
        });
      }

      setNotifications(generatedNotifications);
    } catch (err) {
      console.error("TenantDashboard loadData error", err);
      // Don't show error toast for now, just log it
      // The component will still render with empty data
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [userId, loadData]); // loadData is memoized with useCallback

  const onMaintenanceSubmit = async (formData) => {
    console.log("Maintenance form submitted with data:", formData);
    if (!lease) {
      toast.error("Unable to submit maintenance request: No active lease found. Please contact your property manager.");
      return;
    }

    const unitId = typeof lease.unitId === 'object' ? lease.unitId?._id : lease.unitId;

    if (!unitId) {
      toast.error("Unable to submit maintenance request: Unit information is invalid. Please contact your property manager.");
      return;
    }

    setMaintenanceError("");
    setMaintenanceSubmitting(true);

    try {
      const payload = {
        ...formData,
        unitId,
        category: formData.category || "Other",
      };

      // If image is present, upload it first (assuming there's an upload endpoint)
      // For now, we'll include the image data in the payload
      if (maintenanceImage) {
        payload.image = maintenancePreview;
      }

      console.log("Maintenance payload:", payload);

      const response = await API.post("/maintenance", payload);
      console.log("Maintenance API response:", response);
      toast.success("Maintenance request submitted successfully!");

      // Reset form
      setMaintenanceImage(null);
      reset();
      loadData(); // Refresh requests list
    } catch (err) {
      console.error("TenantDashboard maintenance submit error", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to submit maintenance request"
      );
    } finally {
      setMaintenanceSubmitting(false);
    }
  };

  const handleDocumentDownload = (doc) => {
    if (!doc?.url) {
      toast.error("Document link is unavailable");
      return;
    }

    window.open(doc.url, "_blank", "noopener,noreferrer");
    toast.success(`Opened ${doc.name}`);
  };

  // Don't render anything if user is not available
  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tenant Dashboard"
          subtitle="Loading your workspace..."
        />
        <section className="surface-panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900">Heads up</div>
              <div className="text-xs text-neutral-500">
                Your next rent payment is due soon. Submit payment early to avoid late fees.
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              className="btn-primary w-full text-xs font-semibold uppercase tracking-wide sm:w-auto"
              onClick={() => document.getElementById("maintenance-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              New Request
            </button>
          </div>
        </section>
        <div className="surface-panel p-6">
          <SkeletonRow className="h-8 w-64" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <SkeletonRow className="h-28 w-full" />
            <SkeletonRow className="h-28 w-full" />
            <SkeletonRow className="h-28 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tenant Dashboard"
          subtitle="Loading your dashboard..."
        />
        <div className="surface-panel p-6">
          <SkeletonRow className="h-8 w-72" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <SkeletonRow className="h-28 w-full" />
            <SkeletonRow className="h-28 w-full" />
            <SkeletonRow className="h-28 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const latestPayment = payments.length
    ? [...payments].sort(
        (a, b) =>
          new Date(b.transactionDate || b.createdAt || 0) -
          new Date(a.transactionDate || a.createdAt || 0)
      )[0]
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(" ")[0] || "Tenant"}!`}
        subtitle={`Manage your lease, payments, and maintenance requests. ${formattedDate}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/my-lease"
              className="btn-secondary text-xs font-semibold uppercase tracking-wide"
            >
              My Lease
            </Link>
            <Link
              to="/payments"
              className="btn-primary text-xs font-semibold uppercase tracking-wide"
            >
              Payments
            </Link>
          </div>
        }
      />

      {/* Lease + payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lease summary */}
        <section className="lg:col-span-1 surface-panel p-6 hover-lift fade-in">
          <div className="flex items-center space-x-2 mb-4">
            <div className="rounded-lg bg-success-100 p-2">
              <Home className="h-5 w-5 text-success-600" />
            </div>
            <h2 className="panel-title text-lg">
              My Lease
            </h2>
          </div>
          {!lease ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">
                No active lease found.
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Contact your property manager
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white/90 p-3">
                <Building className="h-5 w-5 text-neutral-400" />
                <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                  <p className="text-xs text-neutral-500">Property</p>
                  <p className="text-right font-medium text-neutral-900">
                    {lease?.propertyId?.name || lease?.propertyName || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white/90 p-3">
                <MapPin className="h-5 w-5 text-neutral-400" />
                <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                  <p className="text-xs text-neutral-500">Unit</p>
                  <p className="text-right font-medium text-neutral-900">
                    {lease?.unitId?.unitNumber || lease?.unitNumber || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white/90 p-3">
                <DollarSign className="h-5 w-5 text-neutral-400" />
                <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                  <p className="text-xs text-neutral-500">Monthly Rent</p>
                  <p className="text-right font-medium text-neutral-900">
                    {getLeaseMonthlyRentEtb(lease)
                      ? `${getLeaseMonthlyRentEtb(lease).toLocaleString()} ETB`
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white/90 p-3">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                  <p className="text-xs text-neutral-500">Lease Period</p>
                  <p className="text-right font-medium text-neutral-900">
                    {lease.startDate
                      ? new Date(lease.startDate).toLocaleDateString()
                      : "—"} - {lease.endDate
                      ? new Date(lease.endDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center pt-2">
                <span className="status-pill status-success">
                  <CheckCircle className="h-3 w-3" />
                  <span>{lease.status || "ACTIVE"}</span>
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Payments snapshot */}
        <section className="lg:col-span-1 surface-panel p-6 hover-lift fade-in">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-primary-100 p-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="panel-title text-lg">Payments Snapshot</h2>
                <p className="text-xs text-neutral-500">
                  Recent payment details and quick access.
                </p>
              </div>
            </div>
            <Link
              to="/payments"
              className="btn-secondary text-xs font-semibold uppercase tracking-wide"
            >
              View All
            </Link>
          </div>

          {!latestPayment ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">No payments recorded yet.</p>
              <p className="text-xs text-neutral-400 mt-1">
                Record your first rent payment.
              </p>
              <Link
                to="/payments"
                className="btn-primary mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-wide"
              >
                Record Payment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white/90 p-3">
                <DollarSign className="h-5 w-5 text-neutral-400" />
                <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                  <p className="text-xs text-neutral-500">Last Amount</p>
                  <p className="text-right font-medium text-neutral-900">
                    {latestPayment.amountEtb
                      ? `${Number(latestPayment.amountEtb).toLocaleString()} ETB`
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white/90 p-3">
                <User className="h-5 w-5 text-neutral-400" />
                <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                  <p className="text-xs text-neutral-500">Method</p>
                  <p className="text-right font-medium text-neutral-900">
                    {latestPayment.paymentMethod || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white/90 p-3">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-2">
                  <p className="text-xs text-neutral-500">Date</p>
                  <p className="text-right font-medium text-neutral-900">
                    {latestPayment.transactionDate || latestPayment.createdAt
                      ? new Date(
                          latestPayment.transactionDate || latestPayment.createdAt
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white/90 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="text-xs text-neutral-500">Total payments</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">
                  {payments.length}
                </span>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* Maintenance + documents + notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Maintenance */}
        <section className="lg:col-span-2 surface-panel p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-warning-100 p-2">
                <Wrench className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <h2 className="panel-title text-lg">
                  Maintenance Requests
                </h2>
                <p className="text-xs text-neutral-500">
                  Submit new requests and track their status.
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Form */}
          <form
            id="maintenance-form"
            onSubmit={handleSubmit(onMaintenanceSubmit)}
            className="mb-6 space-y-4 rounded-2xl border border-neutral-200 bg-white/90 p-4"
          >
            {maintenanceError && (
              <p className="text-sm text-danger-500 mb-2">{maintenanceError}</p>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Issue Category</label>
              <select
                className="form-select mt-1 mb-3 text-sm"
                {...register("category")}
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="form-textarea text-sm"
                placeholder="Describe the issue in detail..."
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-danger-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Attach Photo (Optional)</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleMaintenanceImage(e.dataTransfer.files[0]);
                }}
                className="border border-dashed rounded-2xl border-neutral-200 p-4 mt-1 text-center cursor-pointer hover:border-primary-400 transition"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="maintenance-upload"
                  onChange={(e) => handleMaintenanceImage(e.target.files[0])}
                />
                <label htmlFor="maintenance-upload" className="block cursor-pointer">
                  {!maintenancePreview ? (
                    <>
                      <Upload className="mx-auto text-neutral-400 mb-2" />
                      <p className="text-sm text-neutral-400">
                        Drag and drop or click to upload
                      </p>
                    </>
                  ) : (
                    <img
                      src={maintenancePreview}
                      alt="Preview"
                      className="mx-auto h-32 object-contain rounded"
                    />
                  )}
                </label>
                {maintenanceImage && (
                  <div className="flex items-center justify-center mt-3 bg-neutral-100/80 rounded-full px-3 py-2 text-xs gap-2">
                    <FileText className="w-4 h-4" />
                    {maintenanceImage.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <label
                  htmlFor="urgency"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Urgency Level
                </label>
                <select
                  id="urgency"
                  className="form-select text-sm"
                  {...register("urgency")}
                >
                  <option value="low">🟢 Low - Can wait</option>
                  <option value="medium">🟡 Medium - Soon</option>
                  <option value="high">🟠 High - Important</option>
                </select>
                {errors.urgency && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.urgency.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={maintenanceSubmitting}
                className={`btn-primary w-full inline-flex items-center justify-center space-x-2 text-xs font-semibold sm:w-auto ${
                  maintenanceSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {maintenanceSubmitting ? "Submitting..." : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Requests list */}
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">
                No maintenance requests yet.
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Submit your first request above
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li
                  key={r._id}
                  className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white/90 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-800 mb-2">
                      {r.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-neutral-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>Unit {r?.unitId?.unitNumber || r?.unitNumber || "N/A"}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className={`status-pill ${getMaintenanceStatusClass(r.status)} gap-1.5`}>
                      {r.status?.toLowerCase().includes('completed') && <CheckCircle className="h-3 w-3" />}
                      {r.status?.toLowerCase().includes('progress') && <Clock className="h-3 w-3" />}
                      <span>{r.status?.replace(/_/g, ' ') || 'Unknown'}</span>
                    </span>
                    <span className={`status-pill ${getUrgencyClass(r.urgency)} gap-1.5`}>
                      <AlertCircle className="h-3 w-3" />
                      <span>{r.urgency || 'Low'}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Documents + notifications */}
        <div className="space-y-4">
          <section className="surface-panel p-6 hover-lift">
            <div className="flex items-center space-x-2 mb-4">
              <div className="rounded-lg bg-secondary-100 p-2">
                <FileText className="h-5 w-5 text-secondary-600" />
              </div>
              <h2 className="panel-title text-lg">
                Documents
              </h2>
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">
                  No documents available.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white/90 p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700">{doc.name}</span>
                    </div>
                    <button
                      className="btn-pill btn-outline btn-outline-primary"
                      onClick={() => handleDocumentDownload(doc)}
                    >
                      <Download className="h-3 w-3" />
                      <span>View</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface-panel p-6 hover-lift">
            <div className="flex items-center space-x-2 mb-4">
              <div className="rounded-lg bg-warning-100 p-2">
                <Bell className="h-5 w-5 text-warning-600" />
              </div>
              <h2 className="panel-title text-lg">
                Notifications
              </h2>
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-6">
                <Bell className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">
                  No notifications yet.
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  You'll see updates here
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n, idx) => (
                  <li
                    key={`${n.date}-${n.message}-${idx}`}
                    className="flex items-start space-x-3 rounded-2xl border border-neutral-100 bg-white/90 p-3"
                  >
                    <div className="rounded-full bg-warning-100 p-1.5 mt-0.5">
                      <Bell className="h-3 w-3 text-warning-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800 mb-1">
                        {n.message}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {n.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
