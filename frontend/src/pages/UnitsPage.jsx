// src/pages/UnitsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import SkeletonTable from "../components/SkeletonTable";
import Pagination from "../components/Pagination";
import { useAuthStore } from "../store/authStore";

const statusFilters = ["All", "VACANT", "OCCUPIED", "UNDER_MAINTENANCE"];
const PAGE_SIZE = 10;

const isCanceledRequest = (error) =>
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError";

export default function UnitsPage() {
  const { user } = useAuthStore();
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);

  const canManage = user?.role === "ADMIN" || user?.role === "PM";

  const [form, setForm] = useState({
    unitNumber: "",
    floor: "",
    type: "",                      
                                       
    areaSqm: "",
    basePriceEtb: "",
    status: "VACANT",
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchUnits(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnits = async (signal) => {
    try {
      setLoading(true);
      const res = await API.get("/units", { signal });
      setUnits(res.data?.data || []); // { success, data }
    } catch (err) {
      if (!isCanceledRequest(err)) {
        toast.error("Failed to load units");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = useMemo(
    () =>
      units.filter((u) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          u.unitNumber?.toLowerCase().includes(q) ||
          u.type?.toLowerCase().includes(q);
        const matchesStatus =
          status === "All" || u.status === status;
        return matchesSearch && matchesStatus;
      }),
    [units, search, status]
  );

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const pagedUnits = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUnits.slice(start, start + PAGE_SIZE);
  }, [filteredUnits, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);

      const payload = {
        unitNumber: form.unitNumber,
        // propertyId: form.propertyId, // optional now
        floor: Number(form.floor),
        type: form.type,
        areaSqm: Number(form.areaSqm),
        basePriceEtb: Number(form.basePriceEtb),
        status: form.status,
      };

      const res = await API.post("/units", payload);
      toast.success("Unit created");
      setUnits((prev) => [...prev, res.data?.data].filter(Boolean));
      setForm({
        unitNumber: "",
        // propertyId: "",
        floor: "",
        type: "",
        areaSqm: "",
        basePriceEtb: "",
        status: "VACANT",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create unit"
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Units"
          subtitle="Manage units, pricing, and availability."
        />
        <DashboardCard>
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonRow className="h-10 w-64 rounded-2xl" />
            <SkeletonRow className="h-8 w-48 rounded-full" />
          </div>
        </DashboardCard>
        <DashboardCard title="Unit List">
          <SkeletonTable rows={5} columns={7} />
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Units"
        subtitle="Manage units, pricing, and availability."
        actions={
          canManage ? (
            <button
              onClick={() => {
                const el = document.getElementById("create-unit-form");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-primary text-sm font-semibold"
            >
              + New Unit
            </button>
          ) : null
        }
      />

      {/* Filters and search */}
      <DashboardCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:min-w-50">
            <input
              type="text"
              placeholder="Search by unit number or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-full bg-neutral-100 p-1 text-xs">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 ${
                  status === s
                    ? "bg-white text-neutral-900 border border-neutral-200"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {s === "All" ? "All" : s}
              </button>
            ))}
          </div>
          <div className="text-xs text-neutral-500">
            {filteredUnits.length} of {units.length} units shown
          </div>
        </div>
      </DashboardCard>

      {/* Units table */}
      <DashboardCard title="Unit List">
        {filteredUnits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No units found</div>
            <div className="empty-state-text">Try clearing filters or add a new unit.</div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="w-full min-w-160 divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50/80">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 sm:px-4 whitespace-nowrap">
                    Unit Number
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 sm:px-4 whitespace-nowrap">
                    Floor
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 sm:px-4 whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 sm:px-4 whitespace-nowrap">
                    Area (sqm)
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 sm:px-4 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 sm:px-4 whitespace-nowrap">
                    Base Price (ETB)
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 sm:px-4 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {pagedUnits.map((u) => (
                  <tr key={u._id} className="table-row stagger-item">
                    <td className="px-2 py-2 text-sm sm:px-4 whitespace-nowrap">
                      {u.unitNumber || `Unit ${u._id.slice(-4)}`}
                    </td>
                    <td className="px-2 py-2 text-sm sm:px-4 whitespace-nowrap">
                      {u.floor ?? "-"}
                    </td>
                    <td className="px-2 py-2 text-sm sm:px-4 whitespace-nowrap">
                      {u.type || "-"}
                    </td>
                    <td className="px-2 py-2 text-sm sm:px-4 whitespace-nowrap">
                      {u.areaSqm ?? "-"}
                    </td>
                    <td className="px-2 py-2 text-sm sm:px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                          u.status === "VACANT"
                            ? "bg-success-100 text-success-700"
                            : u.status === "OCCUPIED"
                            ? "bg-primary-100 text-primary-700"
                            : u.status === "UNDER_MAINTENANCE"
                            ? "bg-warning-100 text-warning-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-sm sm:px-4 whitespace-nowrap">
                      {u.basePriceEtb ?? "-"}
                    </td>
                    <td className="px-2 py-2 text-sm sm:px-4 whitespace-nowrap">
                      <Link
                        to={`/units/${u._id}`}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        View
                      </Link>
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
          total={filteredUnits.length}
          onPageChange={setPage}
        />
      </DashboardCard>

      {/* Create unit form */}
      {canManage && (
        <DashboardCard
          title="Create New Unit"
          description="Quickly add a new unit to the system."
        >
          <form
            id="create-unit-form"
            onSubmit={handleCreate}
            className="grid gap-4 md:grid-cols-4 text-sm"
          >
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Unit Number
            </label>
              <input
                type="text"
                required
                value={form.unitNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unitNumber: e.target.value }))
                }
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. 10A"
              />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Floor</label>
              <input
                type="number"
                required
                value={form.floor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, floor: e.target.value }))
                }
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. 3"
              />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Type</label>
              <input
                type="text"
                required
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. 2BR, Studio"
              />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Area (sqm)
            </label>
              <input
                type="number"
                required
                value={form.areaSqm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, areaSqm: e.target.value }))
                }
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. 85"
              />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Base Price (ETB)
            </label>
              <input
                type="number"
                required
                value={form.basePriceEtb}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    basePriceEtb: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. 10000"
              />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              className="form-select text-sm"
            >
              <option value="VACANT">VACANT</option>
              <option value="OCCUPIED">OCCUPIED</option>
              <option value="UNDER_MAINTENANCE">
                UNDER_MAINTENANCE
              </option>
            </select>
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
              {creating ? "Creating..." : "Create Unit"}
            </button>
          </div>
          </form>
        </DashboardCard>
      )}
    </div>
  );
}
