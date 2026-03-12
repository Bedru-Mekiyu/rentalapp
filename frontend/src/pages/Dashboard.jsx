import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Mail,
  Clock,
  CalendarDays,
  Wrench,
} from "lucide-react";

import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";

export default function Dashboard() {
  const [rent] = useState(8500);
  const [dueDate] = useState("October 25, 2024");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [maintenanceStatus] = useState("In Progress");

  const leaseEnd = new Date("December 31, 2026");

  /* PAYMENT STATUS LOGIC */

  useEffect(() => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);

    if (today > dueDateObj) {
      setPaymentStatus("Overdue");
    } else if (dueDateObj - today < 7 * 24 * 60 * 60 * 1000) {
      setPaymentStatus("Due Soon");
    } else {
      setPaymentStatus("Upcoming");
    }

    setLoading(false);
  }, [dueDate]);

  /* LEASE DAYS REMAINING */

  const today = new Date();
  const daysRemaining = Math.ceil(
    (leaseEnd - today) / (1000 * 60 * 60 * 24)
  );

  /* HANDLERS */

  const handleViewDetails = () => {
    toast.success("Opening rent details...");
  };

  const handleManagePayments = async () => {
    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPaymentStatus("Paid");
      toast.success("Payment completed successfully!");
    } catch {
      toast.error("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewLease = () => {
    toast.success("Renewal request sent to property manager");
  };

  /*ICON STYLE*/

  const iconStyle = "w-5 h-5 text-success-500";

  const paymentStatusClass =
    paymentStatus === "Overdue"
      ? "status-danger"
      : paymentStatus === "Due Soon"
      ? "status-warning"
      : paymentStatus === "Paid"
      ? "status-success"
      : "status-neutral";

  const maintenanceStatusClass =
    maintenanceStatus === "Resolved" || maintenanceStatus === "Completed"
      ? "status-success"
      : maintenanceStatus === "In Progress" || maintenanceStatus === "Pending"
      ? "status-warning"
      : "status-neutral";

  /* LOADING SPINNER */
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tenant"
          eyebrowClassName="bg-primary-100 text-primary-700"
          title="Tenant Dashboard"
          subtitle="Loading your rent and lease insights..."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <SkeletonRow className="h-4 w-32" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-40" />
            </div>
          </Card>
          <Card>
            <SkeletonRow className="h-4 w-32" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-40" />
            </div>
          </Card>
          <Card>
            <SkeletonRow className="h-4 w-32" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-40" />
            </div>
          </Card>
          <Card>
            <SkeletonRow className="h-4 w-32" />
            <div className="mt-3">
              <SkeletonRow className="h-8 w-40" />
            </div>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tenant"
        eyebrowClassName="bg-primary-100 text-primary-700"
        title="Tenant Dashboard"
        subtitle="Review your rent, lease status, and recent maintenance activity."
      />

      {/*MONTHLY RENT*/}
      <Card title="Monthly Rent" actions={<Mail className={iconStyle} />}>
        <div>
          <h2 className="kpi-value text-success-600">
            ETB {rent.toLocaleString()}.00
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Due by {dueDate}
          </p>

          <button
            onClick={handleViewDetails}
            className="link-action link-action-caps link-action-primary mt-3"
          >
            View Details
          </button>
        </div>
      </Card>

      {/*PAYMENT STATUS*/}
      <Card title="Payment Status" actions={<Clock className={iconStyle} />}>
        <div>
          <span className={`status-pill ${paymentStatusClass}`}>
            {paymentStatus}
          </span>

          <button
            onClick={handleManagePayments}
            className="link-action link-action-caps link-action-primary mt-3"
          >
            Manage Payments
          </button>
        </div>
      </Card>

      {/*LEASE EXPIRATION*/}
      <Card title="Lease Expiration" actions={<CalendarDays className={iconStyle} />}>
        <div>
          <p className="text-success-600 text-sm">
            {daysRemaining > 0
              ? `${daysRemaining} days remaining`
              : "Lease expired"}
          </p>

          <button
            onClick={handleRenewLease}
            className="btn-pill btn-outline btn-outline-success mt-3"
          >
            Renew Lease
          </button>
        </div>
      </Card>

      {/* MAINTENACE */}
      <Card title="Maintenance Request" actions={<Wrench className={iconStyle} />}>
        <div>
          <p className="font-semibold">Leaky Faucet in Kitchen</p>

          <div className="flex items-center gap-2 mt-2">
            <span className={`status-pill ${maintenanceStatusClass}`}>
              {maintenanceStatus}
            </span>

            <span className="text-xs text-neutral-400">
              Last updated: October 15, 2024
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
