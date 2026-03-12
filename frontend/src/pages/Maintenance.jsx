import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Upload,
  FileText,
  Check,
  Wrench,
} from "lucide-react";

import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function Maintenance() {
  const [category, setCategory] = useState("Plumbing");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem("maintenanceRequests");
    return saved ? JSON.parse(saved) : [];
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const statusTimersRef = useRef([]);

  /*  Save to localStorage */
  useEffect(() => {
    localStorage.setItem("maintenanceRequests", JSON.stringify(requests));
  }, [requests]);

  /*  Handle image selection */
  const handleImage = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    setError("");
    setImage(file);
  };

  /*  Image preview */
  const preview = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    return () => {
      statusTimersRef.current.forEach((timer) => clearTimeout(timer));
      statusTimersRef.current = [];
    };
  }, []);

  /*  Submit handler */
  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setError("");
    setSubmitting(true);

    await new Promise((r) => setTimeout(r, 1000));

    const newRequest = {
      id: Date.now(),
      category,
      description,
      image: preview,
      status: "Received",
      createdAt: new Date().toISOString(),
    };

    statusTimersRef.current.forEach((timer) => clearTimeout(timer));
    setCurrentStatus("Received");
    const t1 = setTimeout(() => {
      setCurrentStatus("In Progress");
    }, 3000);
    const t2 = setTimeout(() => {
      setCurrentStatus("Completed");
    }, 6000);
    statusTimersRef.current = [t1, t2];

    setRequests((prev) => [newRequest, ...prev]);

    setDescription("");
    setImage(null);
    setSubmitting(false);

    toast.success("Maintenance request submitted!");
  };

  const getRequestStatusClass = (status) => {
    const normalized = status?.toLowerCase() || "";
    if (normalized.includes("completed") || normalized.includes("resolved")) {
      return "status-success";
    }
    if (normalized.includes("progress")) {
      return "status-warning";
    }
    if (normalized.includes("received") || normalized.includes("pending")) {
      return "status-neutral";
    }
    return "status-neutral";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Maintenance"
        eyebrowClassName="bg-primary-100 text-primary-700"
        title="Maintenance Requests"
        subtitle="Report issues, attach photos, and track request status."
      />

      {/*  Submit Form */}
      <Card>
        <h2 className="panel-title mb-3 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-success-500" />
          Submit New Request
        </h2>

        {error && (
          <p className="text-sm text-danger-500 mb-2">{error}</p>
        )}

        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Issue Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-select mt-1 mb-3 text-sm"
        >
          <option>Plumbing</option>
          <option>Electrical</option>
          <option>HVAC</option>
          <option>Other</option>
        </select>

        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-textarea mt-1 mb-3 text-sm"
          rows="3"
          placeholder="Describe the issue in detail..."
        />

        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Attach Photo (Optional)</label>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleImage(e.dataTransfer.files[0]);
          }}
          className="border border-dashed rounded-2xl border-neutral-200 p-4 mt-1 text-center cursor-pointer hover:border-primary-400 transition"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="upload"
            onChange={(e) => handleImage(e.target.files[0])}
          />

          <label htmlFor="upload" className="block cursor-pointer">
            {!preview ? (
              <>
                <Upload className="mx-auto text-neutral-400 mb-2" />
                <p className="text-sm text-neutral-400">
                  Drag and drop or click to upload
                </p>
              </>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-32 object-contain rounded"
              />
            )}
          </label>

          {image && (
            <div className="flex items-center justify-center mt-3 bg-neutral-100/80 rounded-full px-3 py-2 text-xs gap-2">
              <FileText className="w-4 h-4" />
              {image.name}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!description.trim() || submitting}
          className={`w-full mt-4 rounded-full py-2 text-[11px] font-semibold uppercase tracking-wide text-white ${
            submitting
              ? "bg-success-400 cursor-not-allowed"
              : "bg-success-600 hover:bg-success-700"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </Card>

      {/* 🔹 Status Tracker */}
      {currentStatus && (
        <Card title="Current Request Status">
          <div className="flex justify-between items-center">
            <StatusStep label="Received" active />
            <Line active={currentStatus !== "Received"} />
            <StatusStep
              label="In Progress"
              active={
                currentStatus === "In Progress" ||
                currentStatus === "Completed"
              }
            />
            <Line active={currentStatus === "Completed"} />
            <StatusStep
              label="Completed"
              active={currentStatus === "Completed"}
            />
          </div>
        </Card>
      )}

      {/*  Request History */}
      {requests.length > 0 && (
        <Card title="Your Requests">
          {requests.map((req) => (
            <div key={req.id} className="stagger-item border-b border-neutral-100 py-3">
              <p className="font-medium">{req.category}</p>
              <p className="text-sm text-neutral-600">
                {req.description}
              </p>
              <p className="text-xs text-neutral-400">
                {new Date(req.createdAt).toLocaleString()}
              </p>

              {req.image && (
                <img
                  src={req.image}
                  alt="Attached"
                  className="mt-2 h-20 rounded object-contain"
                />
              )}

              <span
                className={`status-pill ${getRequestStatusClass(currentStatus || req.status)}`}
              >
                {currentStatus || req.status}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* Helper Components */

function StatusStep({ label, active }) {
  return (
    <div
      className={`flex flex-col items-center ${
        active ? "text-success-500" : "text-neutral-400"
      }`}
    >
      <div
        className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
          active ? "border-success-500" : "border-neutral-300"
        }`}
      >
        {active && <Check className="w-4 h-4" />}
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wide mt-1">{label}</span>
    </div>
  );
}

function Line({ active }) {
  return (
    <div
      className={`h-0.5 w-full mx-2 ${
        active ? "bg-success-500" : "bg-neutral-300"
      }`}
    />
  );
}
