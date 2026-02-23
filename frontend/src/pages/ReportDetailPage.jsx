// src/pages/ReportDetailPage.jsx
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardCard from "../components/DashboardCard";
import PageHeader from "../components/PageHeader";

const REPORTS = {
  "monthly-revenue": {
    title: "Monthly Revenue Report",
    subtitle: "Revenue trends and collections by month.",
    summary: "Summarizes monthly collections and compares planned vs actual revenue.",
    metrics: [
      { label: "Latest Month", value: "ETB 1.48M" },
      { label: "YoY Growth", value: "+12.4%" },
      { label: "Collection Rate", value: "94%" },
    ],
    highlights: [
      "Revenue grew steadily across the last 6 months.",
      "Vacancy reductions improved collection stability.",
    ],
  },
  delinquency: {
    title: "Delinquency Report",
    subtitle: "Aging buckets for outstanding balances.",
    summary: "Breakdown of past-due balances by aging bucket and tenant segment.",
    metrics: [
      { label: "Past Due (30d)", value: "ETB 124k" },
      { label: "Past Due (60d)", value: "ETB 78k" },
      { label: "Past Due (90d+)", value: "ETB 34k" },
    ],
    highlights: [
      "Most delinquencies are in the 30-day bucket.",
      "Targeted follow-ups reduced 60+ day balances.",
    ],
  },
  expense: {
    title: "Expense Report",
    subtitle: "Maintenance and operational expenses overview.",
    summary: "Tracks expenses by category and compares against quarterly budgets.",
    metrics: [
      { label: "YTD Expenses", value: "ETB 620k" },
      { label: "Largest Category", value: "Repairs" },
      { label: "Budget Used", value: "58%" },
    ],
    highlights: [
      "Preventive maintenance reduced emergency costs.",
      "Utilities remain below budget targets.",
    ],
  },
};

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const report = useMemo(() => REPORTS[reportId], [reportId]);

  if (!report) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Report not found.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        eyebrowClassName="bg-indigo-100 text-indigo-700"
        title={report.title}
        subtitle={report.subtitle}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Back
          </button>
        }
      />

      <DashboardCard title="Report Summary">
        <p className="text-sm text-slate-600">{report.summary}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {report.metrics.map((metric) => (
            <div key={metric.label} className="surface-panel p-4">
              <p className="text-xs font-medium text-slate-500">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Highlights">
        <ul className="space-y-2 text-sm text-slate-600">
          {report.highlights.map((item) => (
            <li key={item} className="surface-panel p-4">
              {item}
            </li>
          ))}
        </ul>
      </DashboardCard>
    </div>
  );
}
