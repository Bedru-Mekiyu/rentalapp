// src/pages/PaymentsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { useAuthStore } from "../store/authStore";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import SkeletonCard from "../components/SkeletonCard";
import Pagination from "../components/Pagination";
import { getLeaseMonthlyRentEtb } from "../utils/pricing";

const STATUS_FILTERS = ["All", "PENDING", "VERIFIED", "REJECTED"];
const METHOD_FILTERS = ["All", "CASH", "BANK_TRANSFER", "CARD", "OTHER"];
const PAGE_SIZE = 25;

export default function PaymentsPage() {
  const { user } = useAuthStore();

  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingLeases, setLoadingLeases] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(1);
  const [leaseOptions, setLeaseOptions] = useState([]);

  const [form, setForm] = useState({
    leaseId: "",
    amountEtb: "",
    transactionDate: "",
    paymentMethod: "CASH",
    externalTransactionId: "",
  });

  const canCreate =
    user?.role === "TENANT" || user?.role === "ADMIN";
  const canVerify = user?.role === "PM" || user?.role === "ADMIN";

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        if (user.role === "TENANT") {
          const res = await API.get(`/payments/by-tenant/${user.id}`);
          setPayments(res.data?.data || []);
          return;
        }

        if (user.role === "PM" || user.role === "ADMIN" || user.role === "FS") {
          const res = await API.get("/payments");
          setPayments(res.data?.data || []);
          return;
        }

        setPayments([]);
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to load payments"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchLeases = async () => {
      if (!user || !canCreate) {
        setLeaseOptions([]);
        return;
      }

      try {
        setLoadingLeases(true);
        const endpoint =
          user.role === "TENANT"
            ? `/leases/by-tenant/${user.id}`
            : "/leases";
        const res = await API.get(endpoint);
        setLeaseOptions(res.data?.data || []);
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to load leases"
        );
        setLeaseOptions([]);
      } finally {
        setLoadingLeases(false);
      }
    };

    fetchLeases();
  }, [user, canCreate]);

  const getLeaseLabel = (lease) => {
    const unit = lease.unitId?.unitNumber || "Unit";
    const tenant = lease.tenantId?.fullName || "Tenant";
    const statusLabel = lease.status || "ACTIVE";
    return `${unit} · ${tenant} · ${statusLabel}`;
  };

  useEffect(() => {
    if (!form.leaseId) return;
    const selectedLease = leaseOptions.find((lease) => lease._id === form.leaseId);
    if (!selectedLease) return;

    setForm((prev) => ({
      ...prev,
      amountEtb:
        getLeaseMonthlyRentEtb(selectedLease) > 0
          ? String(getLeaseMonthlyRentEtb(selectedLease))
          : prev.amountEtb,
    }));
  }, [form.leaseId, leaseOptions]);

  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        const q = search.toLowerCase();

        const matchesSearch =
          !q ||
          p.externalTransactionId?.toLowerCase().includes(q) ||
          p.paymentMethod?.toLowerCase().includes(q);

        const matchesStatus = status === "All" || p.status === status;
        const matchesMethod = method === "All" || p.paymentMethod === method;

        return matchesSearch && matchesStatus && matchesMethod;
      }),
    [payments, search, status, method]
  );

  useEffect(() => {
    setPage(1);
  }, [search, status, method]);

  const pagedPayments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPayments.slice(start, start + PAGE_SIZE);
  }, [filteredPayments, page]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString() : "—";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);

      const payload = {
        leaseId: form.leaseId,
        amountEtb: Number(form.amountEtb),
        transactionDate: form.transactionDate,
        paymentMethod: form.paymentMethod,
        externalTransactionId:
          form.externalTransactionId || undefined,
      };

      const res = await API.post("/payments", payload); // POST /api/payments
      toast.success("Payment recorded");

      setPayments((prev) => [res.data?.data, ...prev].filter(Boolean));

      setForm({
        leaseId: "",
        amountEtb: "",
        transactionDate: "",
        paymentMethod: "CASH",
        externalTransactionId: "",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create payment"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!window.confirm(`Change payment status to ${newStatus}?`)) return;

    try {
      setUpdatingId(id);
      const res = await API.patch(`/payments/${id}/status`, {
        status: newStatus,
      }); // PATCH /api/payments/:id/status

      setPayments((prev) =>
        prev.map((p) => (p._id === id ? res.data?.data : p))
      );

      toast.success(
        newStatus === "VERIFIED"
          ? "Payment verified"
          : newStatus === "REJECTED"
          ? "Payment rejected"
          : "Payment status updated"
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update payment status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Payments"
          eyebrowClassName="bg-primary-100 text-primary-700"
          title="Payments"
          subtitle="Record tenant payments and verify them once confirmed."
        />
        <SkeletonCard>
          <div className="space-y-3">
            <SkeletonRow className="h-4 w-48" />
            <SkeletonTable rows={5} columns={7} />
          </div>
        </SkeletonCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments"
        eyebrowClassName="bg-primary-100 text-primary-700"
        title="Payments"
        subtitle="Record tenant payments and verify them once confirmed."
      />

      <DashboardCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search by method or transaction ID"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-200 sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-200"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-200"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHOD_FILTERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canCreate && (
          <form
            id="payment-create-form"
            onSubmit={handleCreate}
            className="mb-6 rounded-2xl border border-neutral-200 bg-white/90 p-4 text-xs"
          >
            <div className="mb-3 font-semibold text-neutral-700">
              New Payment
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-neutral-600">
                  Lease
                </label>
                <select
                  name="leaseId"
                  value={form.leaseId}
                  onChange={handleChange}
                  required
                  disabled={loadingLeases || leaseOptions.length === 0}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">
                    {loadingLeases ? "Loading leases..." : "Select lease"}
                  </option>
                  {leaseOptions.map((lease) => (
                    <option key={lease._id} value={lease._id}>
                      {getLeaseLabel(lease)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-neutral-600">
                  Amount (ETB)
                </label>
                <input
                  type="number"
                  name="amountEtb"
                  value={form.amountEtb}
                  onChange={handleChange}
                  required
                  min={0}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-neutral-600">
                  Transaction date
                </label>
                <input
                  type="date"
                  name="transactionDate"
                  value={form.transactionDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-neutral-600">
                  Method
                </label>
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                >
                  {METHOD_FILTERS.filter((m) => m !== "All").map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-neutral-600">
                  Transaction / Receipt ID
                </label>
                <input
                  type="text"
                  name="externalTransactionId"
                  value={form.externalTransactionId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className={`btn-primary text-[11px] uppercase tracking-wide ${
                  creating ? "opacity-70" : ""
                }`}
              >
                {creating ? "Saving..." : "Record payment"}
              </button>
            </div>
          </form>
        )}

        {filteredPayments.length === 0 ? (
          <div className="space-y-3 py-6 text-center text-xs text-neutral-500">
            <SkeletonTable rows={4} columns={7} />
            <div className="mt-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-6 text-center">
              <div className="text-sm font-medium text-neutral-700">No payments recorded</div>
              <div className="mt-1 text-xs text-neutral-500">
                Records will appear once payments are submitted.
              </div>
            </div>
          </div>
        ) : (
          <div className="table-shell list-shell text-xs">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">
                    Method
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">
                    Transaction ID
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">
                    Lease
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {pagedPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2">
                      {formatDate(p.transactionDate)}
                    </td>
                    <td className="px-3 py-2">
                      {formatCurrency(p.amountEtb)}
                    </td>
                    <td className="px-3 py-2">
                      {p.paymentMethod || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          p.status === "VERIFIED"
                            ? "bg-success-100 text-success-700"
                            : p.status === "REJECTED"
                            ? "bg-danger-100 text-danger-700"
                            : "bg-warning-100 text-warning-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {p.externalTransactionId || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {p.leaseId ? (
                        <Link
                          to={`/leases/${typeof p.leaseId === "object" ? p.leaseId._id : p.leaseId}`}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                          View lease
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/payments/${p._id}`}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                        >
                          View
                        </Link>
                        {canVerify && p.status !== "VERIFIED" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(p._id, "VERIFIED")
                            }
                            disabled={updatingId === p._id}
                            className="rounded-md bg-success-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {updatingId === p._id ? "Saving..." : "Verify"}
                          </button>
                        )}
                        {canVerify && p.status !== "REJECTED" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(p._id, "REJECTED")
                            }
                            disabled={updatingId === p._id}
                            className="rounded-md bg-danger-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {updatingId === p._id ? "Saving..." : "Reject"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filteredPayments.length}
          onPageChange={setPage}
        />
      </DashboardCard>
    </div>
  );
}
