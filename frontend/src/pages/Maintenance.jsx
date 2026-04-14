import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Wrench, AlertCircle } from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";
import API from "../services/api";
import SkeletonRow from "../components/SkeletonRow";

export default function Maintenance() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/maintenance");
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error("Maintenance load error", err);
      toast.error(
        err?.response?.data?.message || "Failed to load maintenance requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatusClass = (status) => {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Requests"
        subtitle="View and manage all maintenance requests across properties."
      />

      {loading ? (
        <DashboardCard>
          <div className="space-y-4">
            <SkeletonRow className="h-6 w-48" />
            <div className="space-y-3 mt-4">
              <SkeletonRow className="h-16 w-full" />
              <SkeletonRow className="h-16 w-full" />
              <SkeletonRow className="h-16 w-full" />
            </div>
          </div>
        </DashboardCard>
      ) : requests.length === 0 ? (
        <DashboardCard>
          <div className="text-center py-12">
            <Wrench className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
            <p className="text-sm font-medium text-neutral-700">No maintenance requests</p>
            <p className="text-xs text-neutral-500 mt-1">
              Requests submitted by tenants will appear here
            </p>
          </div>
        </DashboardCard>
      ) : (
        <DashboardCard
          title={`All Requests (${requests.length})`}
          subtitle="Manage and update maintenance request statuses"
        >
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req._id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white/60 p-4 transition-colors hover:bg-white/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`status-pill ${getRequestStatusClass(req.status)}`}>
                      {req.status}
                    </span>
                    {req.urgency && (
                      <span className={`status-pill ${getUrgencyClass(req.urgency)}`}>
                        {req.urgency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {req.category || "General"} - {req.description}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Unit: {req.unitId?.unitNumber || "N/A"} ·
                    {req.createdAt && new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {req.image && (
                  <div className="sm:ml-4">
                    <img
                      src={req.image}
                      alt="Attached"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
