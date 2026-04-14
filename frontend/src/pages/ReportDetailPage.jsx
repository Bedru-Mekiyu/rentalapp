// src/pages/ReportDetailPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ResponsiveSection from "../components/ResponsiveSection";
import PageHeader from "../components/PageHeader";
import MobileBackBar from "../components/MobileBackBar";
import API from "../services/api";

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatCompactCurrency = (value) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value || 0);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/finance/reports/${reportId}`);
        setReport(res.data?.data || null);
      } catch (err) {
        if (err.response?.status !== 404) {
          toast.error(
            err.response?.data?.message || "Failed to load report"
          );
        }
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    if (!reportId) {
      setLoading(false);
      setReport(null);
      return;
    }

    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Report Detail"
          subtitle="Loading report data..."
          actions={
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-pill btn-outline btn-outline-neutral"
            >
              Back
            </button>
          }
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-danger-600">Report not found.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={report.title}
        subtitle={report.subtitle}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-pill btn-outline btn-outline-neutral"
          >
            Back
          </button>
        }
      />

      <ResponsiveSection title="Report Summary">
        <p className="text-sm text-neutral-600">{report.summary}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.metrics.map((metric) => (
            <div key={metric.label} className="surface-panel p-4">
              <p className="text-xs font-medium text-neutral-500">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{metric.value}</p>
            </div>
          ))}
        </div>
      </ResponsiveSection>

      {reportId === "monthly-revenue" &&
        Array.isArray(report.monthlyRevenueTrend) &&
        report.monthlyRevenueTrend.length > 0 && (
          <ResponsiveSection title="Revenue Trend">
            <div className="surface-panel analytics-panel p-4 sm:p-5">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={report.monthlyRevenueTrend}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="var(--chart-axis)"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    width={74}
                    tickFormatter={(value) => formatCompactCurrency(value)}
                    stroke="var(--chart-axis)"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    cursor={{
                      stroke: "var(--chart-grid)",
                      strokeWidth: 2,
                      strokeDasharray: "3 3",
                    }}
                    labelStyle={{ color: "var(--chart-axis)", fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: "var(--chart-tooltip-bg)",
                      border: "none",
                      borderRadius: "0.5rem",
                      boxShadow: "var(--chart-tooltip-shadow)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-primary)"
                    strokeWidth={3}
                    dot={{ fill: "var(--chart-primary)", strokeWidth: 2, r: 4 }}
                    activeDot={{
                      r: 6,
                      stroke: "var(--chart-primary)",
                      strokeWidth: 2,
                      className: "chart-active-dot",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ResponsiveSection>
        )}

      <ResponsiveSection title="Highlights">
        <ul className="space-y-2 text-sm text-neutral-600">
          {report.highlights.map((item) => (
            <li key={item} className="surface-panel p-4">
              {item}
            </li>
          ))}
        </ul>
      </ResponsiveSection>
      <MobileBackBar to={-1} label="Back" />
    </div>
  );
}
