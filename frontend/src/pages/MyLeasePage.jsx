// src/pages/MyLeasePage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API from "../services/api";
import toast from "react-hot-toast";
import DashboardCard from "../components/DashboardCard";
import { FileText, AlertCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";

export default function MyLeasePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLease = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/leases/by-tenant/${user._id}`);
      const leases = res.data?.data || [];

      if (leases.length > 0) {
        // If tenant has leases, redirect to the first active one
        const activeLease = leases.find((l) => l.status === "ACTIVE") || leases[0];
        navigate(`/leases/${activeLease._id}`, { replace: true });
        return;
      }

      setLease(null);
    } catch (err) {
      console.error("MyLeasePage loadLease error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to load lease information"
      );
      setLease(null); // Show no lease message on error too
    } finally {
      setLoading(false);
    }
  }, [user._id, navigate]);

  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }
    loadLease();
  }, [user, loadLease]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Lease"
          eyebrowClassName="bg-emerald-100 text-emerald-700"
          title="My Lease"
          subtitle="View your current lease details and status."
        />
        <DashboardCard>
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow className="h-6 w-3/4" />
            <SkeletonRow className="h-6 w-2/3" />
          </div>
        </DashboardCard>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Lease"
          eyebrowClassName="bg-emerald-100 text-emerald-700"
          title="My Lease"
          subtitle="View your current lease details and status."
        />
        <DashboardCard>
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Lease Found
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              You don't have an active lease at this time. Please contact your property manager for assistance.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary inline-flex items-center space-x-2 text-xs font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        </DashboardCard>
      </div>
    );
  }

  // This should not be reached due to the redirect above
  return null;
}