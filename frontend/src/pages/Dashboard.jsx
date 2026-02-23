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

  const dueDateObj = new Date("October 25, 2026");
  const leaseEnd = new Date("December 31, 2026");

  /* PAYMENT STATUS LOGIC */

  useEffect(() => {
    const today = new Date();

    if (today > dueDateObj) {
      setPaymentStatus("Overdue");
    } else if (dueDateObj - today < 7 * 24 * 60 * 60 * 1000) {
      setPaymentStatus("Due Soon");
    } else {
      setPaymentStatus("Upcoming");
    }

    setLoading(false);
  }, []);

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

  const iconStyle = "w-5 h-5 text-emerald-500";

  /* LOADING SPINNER */
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tenant"
          eyebrowClassName="bg-emerald-100 text-emerald-700"
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
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Tenant Dashboard"
        subtitle="Review your rent, lease status, and recent maintenance activity."
      />

      {/*MONTHLY RENT*/}
      <Card>
        <div className="flex justify-between items-start mt-2">
          <div>
            <p className="text-slate-600 font-medium">Monthly Rent</p>
            <h2 className="text-emerald-600 text-3xl font-bold mt-2">
              ETB {rent.toLocaleString()}.00
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Due by {dueDate}
            </p>

            <button
              onClick={handleViewDetails}
              className="text-emerald-600 text-xs font-semibold uppercase tracking-wide mt-3 inline-block hover:underline"
            >
              View Details
            </button>
          </div>

          <Mail className="w-6 h-6 text-emerald-500" />
        </div>
      </Card>

      {/*PAYMENT STATUS*/}
      <Card>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={iconStyle} />
            <p className="font-medium text-slate-700">Payment Status</p>
          </div>

          <p
            className={`font-semibold mb-3 ${
              paymentStatus === "Overdue"
                ? "text-red-500"
                : paymentStatus === "Due Soon"
                ? "text-yellow-500"
                : paymentStatus === "Paid"
                ? "text-green-500"
                : "text-gray-600"
            }`}
          >
            {paymentStatus}
          </p>

          <button
            onClick={handleManagePayments}
            className="text-emerald-600 text-xs font-semibold uppercase tracking-wide hover:underline"
          >
            Manage Payments
          </button>
        </div>
      </Card>

      {/*LEASE EXPIRATION*/}
      <Card>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className={iconStyle} />
            <p className="font-medium">Lease Expiration</p>
          </div>

          <p className="text-emerald-600 text-sm">
            {daysRemaining > 0
              ? `${daysRemaining} days remaining`
              : "Lease expired"}
          </p>

          <button
            onClick={handleRenewLease}
            className="mt-3 rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 hover:bg-emerald-50"
          >
            Renew Lease
          </button>
        </div>
      </Card>

      {/* MAINTENACE */}
      <Card>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench className={iconStyle} />
            <p className="font-medium">Maintenance Request</p>
          </div>

          <p className="font-semibold mt-2">Leaky Faucet in Kitchen</p>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide bg-emerald-100/70 text-emerald-700 px-2.5 py-1 rounded-full">
              {maintenanceStatus}
            </span>

            <span className="text-xs text-slate-400">
              Last updated: October 15, 2024
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
