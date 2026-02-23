import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Upload,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";

import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function Payments() {
  const [rent] = useState(4500);
  const [dueDate] = useState("October 31, 2026");
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const dueDateObj = new Date(dueDate);

  /* 🔹 Load payment history from localStorage */
  useEffect(() => {
    const saved = localStorage.getItem("paymentHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  /* 🔹 Save payment history */
  useEffect(() => {
    localStorage.setItem("paymentHistory", JSON.stringify(history));
  }, [history]);

  /* 🔹 Determine payment status */
  useEffect(() => {
    const today = new Date();
    if (history.length > 0 && history[0].status === "Paid") {
      setPaymentStatus("Paid");
      return;
    }

    if (today > dueDateObj) {
      setPaymentStatus("Overdue");
    } else if (dueDateObj - today < 7 * 24 * 60 * 60 * 1000) {
      setPaymentStatus("Due Soon");
    } else {
      setPaymentStatus("Upcoming");
    }
  }, [history]);

  /* 🔹 Digital Payment Handler */
  const handleDigitalPayment = async (method) => {
    setLoading(true);

    // Simulate API/delay
    await new Promise((r) => setTimeout(r, 1000));

    const newPayment = {
      id: Date.now(),
      amount: rent,
      date: new Date().toISOString(),
      status: "Paid",
      method,
      fileName: null,
    };

    setHistory((prev) => [newPayment, ...prev]);
    setLoading(false);
    toast.success(`${method} payment successful!`);
  };

  /* 🔹 Manual Receipt Handlers */
  const handleReceiptUpload = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Only image or PDF files allowed");
      setReceipt(null);
      return;
    }

    setError("");
    setReceipt(file);
  };

  const handleSubmitReceipt = async () => {
    if (!receipt) {
      setError("Please upload a receipt first");
      return;
    }

    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1500));

    const newPayment = {
      id: Date.now(),
      amount: rent,
      date: new Date().toISOString(),
      status: "Paid",
      method: "Manual Receipt",
      fileName: receipt.name,
    };

    setHistory((prev) => [newPayment, ...prev]);
    setReceipt(null);
    setLoading(false);

    toast.success("Receipt submitted and verified successfully!");
  };

  const statusColor =
    paymentStatus === "Overdue"
      ? "text-red-500"
      : paymentStatus === "Due Soon"
      ? "text-yellow-500"
      : paymentStatus === "Paid"
      ? "text-green-500"
      : "text-gray-600";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="Payments"
        subtitle="Track your monthly rent, make payments, and upload receipts."
      />

      {/* 🔹 Rent Overview */}
      <Card>
        <div>
          <div className="flex justify-between items-center">
            <p className="text-slate-600 font-medium">Current Monthly Rent</p>
            <CalendarDays className="text-emerald-500" />
          </div>

          <h2 className="text-emerald-600 text-3xl font-bold mt-2">
            ETB {rent.toLocaleString()}
          </h2>

          <p className="text-sm text-slate-400 mt-1">Due: {dueDate}</p>

          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4" />
            <span className={`font-medium ${statusColor}`}>
              {paymentStatus}
            </span>
          </div>
        </div>
      </Card>

      {/* 🔹 Digital Payments */}
      <Card title="Digital Payment Options">
        <div
          onClick={() => handleDigitalPayment("Telebirr")}
          className="flex justify-between items-center py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50"
        >
          <div>
            <p className="font-medium text-slate-900">Telebirr</p>
            <p className="text-sm text-slate-400">Linked account: +251-912-345-678</p>
          </div>
          <span>›</span>
        </div>

        <div
          onClick={() => handleDigitalPayment("CBE Birr")}
          className="flex justify-between items-center py-2 cursor-pointer hover:bg-slate-50"
        >
          <div>
            <p className="font-medium text-slate-900">CBE Birr</p>
            <p className="text-sm text-slate-400">Linked account: 1000012345678</p>
          </div>
          <span>›</span>
        </div>
      </Card>

      {/* 🔹 Manual Receipt Upload */}
      <Card
        title="Upload Manual Payment Receipt"
        description="Attach image or PDF of payment proof."
      >
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <label className="mt-3 flex items-center justify-center gap-2 rounded-full border border-slate-200 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 cursor-pointer hover:bg-slate-50">
          <Upload className="w-4 h-4" />
          Choose File
          <input
            type="file"
            accept="image/*,application/pdf"
            hidden
            onChange={(e) => handleReceiptUpload(e.target.files[0])}
          />
        </label>

        {receipt && (
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <FileText className="w-4 h-4" />
            {receipt.name}
          </div>
        )}

        <button
          onClick={handleSubmitReceipt}
          disabled={!receipt || loading}
          className={`w-full mt-4 rounded-full py-2 text-[11px] font-semibold uppercase tracking-wide text-white ${
            loading ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {loading ? "Verifying..." : "Submit Receipt"}
        </button>
      </Card>

      {/* 🔹 Payment History */}
      {history.length > 0 && (
        <Card title="Payment History">
          {history.map((item) => (
            <div key={item.id} className="stagger-item border-b border-slate-100 py-3">
              <div className="flex justify-between items-center">
                <p className="font-medium">
                  ETB {item.amount.toLocaleString()} - {item.method}
                </p>
                <span className="text-emerald-600 flex items-center gap-1 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {item.status}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                {new Date(item.date).toLocaleString()}
              </p>

              {item.fileName && (
                <p className="text-xs text-slate-500">File: {item.fileName}</p>
              )}
            </div>
          ))}
        </Card>
      )}

      {loading && history.length === 0 && (
        <Card title="Payment History">
          <div className="space-y-3">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-4 w-64" />
            <div className="skeleton h-4 w-52" />
          </div>
        </Card>
      )}
    </div>
  );
}
