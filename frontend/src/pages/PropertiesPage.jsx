// src/pages/PropertiesPage.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../services/api";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const res = await API.get("/properties");
      setProperties(res.data?.data || []);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await API.post("/properties", form);
      toast.success("Property saved");
      setProperties(res.data?.data ? [res.data.data] : []); // only one active property
      setForm({ name: "", address: "", description: "" });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save property"
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Property"
          subtitle="Configure your main building/property details."
        />
        <DashboardCard title="Current Property">
          <div className="space-y-3">
            <SkeletonRow className="h-5 w-1/2" />
            <SkeletonRow className="h-4 w-2/3" />
            <SkeletonRow className="h-4 w-1/3" />
          </div>
        </DashboardCard>
        <DashboardCard title="Create Property">
          <div className="grid gap-4 md:grid-cols-4">
            <SkeletonRow className="h-10 w-full md:col-span-2" />
            <SkeletonRow className="h-10 w-full md:col-span-2" />
            <SkeletonRow className="h-20 w-full md:col-span-4" />
          </div>
        </DashboardCard>
      </div>
    );
  }

  const property = properties[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property"
        subtitle="Configure your main building/property details."
      />

      <DashboardCard title="Current Property">
        {property ? (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-neutral-900">
              {property.name}
            </p>
            <p className="text-neutral-600">{property.address}</p>
            {property.description && (
              <p className="text-xs text-neutral-500">
                {property.description}
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-400">
              ID: {property._id}
            </p>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            No property configured yet. Use the form below to create
            one.
          </p>
        )}
      </DashboardCard>

      <DashboardCard
        title={property ? "Update Property" : "Create Property"}
        description="You will use this property's ID when creating units."
      >
        <form
          onSubmit={handleCreate}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm"
        >
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className="form-input text-sm"
              placeholder="e.g. Main Apartment Building"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              className="form-input text-sm"
              placeholder="e.g. Addis Ababa, Bole, XYZ Street"
            />
          </div>
          <div className="space-y-1 md:col-span-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: e.target.value,
                }))
              }
              className="form-textarea text-sm"
              rows={3}
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="btn-primary text-xs font-semibold disabled:opacity-60"
            >
              {creating ? "Saving..." : "Save Property"}
            </button>
          </div>
        </form>
      </DashboardCard>
    </div>
  );
}
