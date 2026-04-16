
// src/pages/GeneralManagerDashboard.jsx
import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import Papa from "papaparse";
import PageHeader from "../components/PageHeader";
import DashboardCard from "../components/DashboardCard";
import { Sparkles } from "lucide-react";

export default function GeneralManagerDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const [kpis, setKpis] = useState({
    totalProperties: 0,
    activeLeases: 0,
    occupancyRate: 0,
  });

  const [revenueTrend, setRevenueTrend] = useState([]);
  const [occupancyByType, setOccupancyByType] = useState([]);

  const [revenueStats, setRevenueStats] = useState({
    currentMonth: 0,
    monthToDate: 0,
    avgPerUnit: 0,
  });

  const [occupancyStats, setOccupancyStats] = useState({
    vacantUnits: 0,
    turnoverRate: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [unitsRes, leasesRes, financeRes] = await Promise.all([
        API.get("/units"),
        API.get("/leases"),
        API.get("/finance/portfolio/summary"),
      ]); // /api/units + /api/leases

      const units = unitsRes.data?.data || [];
      const leases = leasesRes.data?.data || [];
      const portfolioSummary = financeRes.data?.data || {};

      // Distinct properties from units
      const propertyIds = new Set(
        units
          .map((u) => String(u.propertyId || ""))
          .filter((id) => id && id !== "undefined")
      );
      const totalProperties = propertyIds.size;

      const totalUnits = units.length;
      const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
      const vacantUnits = units.filter((u) => u.status === "VACANT").length;
      const activeLeases = leases.filter((l) => l.status === "ACTIVE").length;

      const occupancyRate =
        totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Occupancy by unit type
      const typeMap = new Map();
      units.forEach((u) => {
        const t = u.type || "Unknown";
        if (!typeMap.has(t)) {
          typeMap.set(t, { type: t, total: 0, occupied: 0 });
        }
        const entry = typeMap.get(t);
        entry.total += 1;
        if (u.status === "OCCUPIED") entry.occupied += 1;
      });
      const occupancyByTypeData = Array.from(typeMap.values()).map((t) => ({
        type: t.type,
        occupancy:
          t.total > 0 ? Math.round((t.occupied / t.total) * 100) : 0,
      }));

      const revenueTrendData = portfolioSummary.monthlyRevenueTrend || [];

      const avgPerUnit =
        Number(portfolioSummary.avgRevenuePerOccupiedUnit || 0);

      const recentEndedLeases = leases.filter((lease) => {
        if (lease.status !== "ENDED") return false;
        const leaseEndDate = new Date(lease.endDate);
        if (Number.isNaN(leaseEndDate.getTime())) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return leaseEndDate >= thirtyDaysAgo;
      }).length;

      const turnoverRate =
        totalUnits > 0
          ? Number(((recentEndedLeases / totalUnits) * 100).toFixed(1))
          : 0;

      setKpis({
        totalProperties,
        activeLeases,
        occupancyRate: Number(occupancyRate.toFixed(1)),
      });

      setOccupancyStats({
        vacantUnits,
        turnoverRate,
      });

      setRevenueStats({
        currentMonth: Number(portfolioSummary.currentMonthRevenue || 0),
        monthToDate: Number(portfolioSummary.monthToDateRevenue || 0),
        avgPerUnit,
      });

      setOccupancyByType(occupancyByTypeData);
      setRevenueTrend(revenueTrendData);

    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const reportRows = [
    {
      id: "monthly-revenue",
      name: "Monthly Portfolio Overview",
      date: new Date().toLocaleDateString(),
      status: revenueTrend.length > 0 ? "Ready" : "No Data",
    },
    {
      id: "delinquency",
      name: "Occupancy & Vacancy Report",
      date: new Date().toLocaleDateString(),
      status: occupancyByType.length > 0 ? "Ready" : "No Data",
    },
    {
      id: "expense",
      name: "Operations Expense Proxy",
      date: new Date().toLocaleDateString(),
      status: "Ready",
    },
  ];

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const formatCompactCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v || 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Financial Reports", 20, 20);
    reportRows.forEach((r, i) => {
      doc.text(`${r.id}: ${r.name} - ${r.status}`, 20, 40 + i * 10);
    });
    doc.save("reports.pdf");
  };

  const exportCSV = () => {
    const csv = Papa.unparse(reportRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "reports.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardCard>
          <div className="skeleton h-4 w-24" />
          <div className="mt-3 space-y-2">
            <div className="skeleton h-8 w-72" />
            <div className="skeleton h-3 w-96" />
          </div>
        </DashboardCard>
        <div className="grid gap-6 md:grid-cols-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <DashboardCard>
          <div className="skeleton h-5 w-48" />
          <div className="mt-6 skeleton h-56 w-full" />
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="General Manager Dashboard"
        subtitle={`Welcome back, ${user?.fullName || "General Manager"}. Here's your portfolio overview.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-secondary text-xs font-semibold"
              onClick={exportCSV}
            >
              Export CSV
            </button>
            <button
              className="btn-primary text-xs font-semibold"
              onClick={exportPDF}
            >
              Export PDF
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <KpiCard
          label="Total Properties"
          value={kpis.totalProperties}
          icon="🏢"
          gradient="from-primary-500 to-success-500"
        />
        <KpiCard
          label="Active Leases"
          value={kpis.activeLeases}
          icon="📄"
          gradient="from-warning-500 to-warning-400"
        />
        <KpiCard
          label="Overall Occupancy"
          value={`${kpis.occupancyRate}%`}
          icon="📊"
          gradient="from-primary-600 to-success-500"
        />
      </div>

      {/* Revenue analytics */}
      <section className="surface-panel analytics-panel card-reveal p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
            <span className="text-lg">💰</span>
          </div>
          <div>
            <h2 className="panel-title text-lg">
              Revenue Analytics
            </h2>
            <p className="panel-subtitle">
              Overview of monthly revenue performance and key financial indicators.
            </p>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--chart-axis)"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  width={74}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                  stroke="var(--chart-axis)"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  cursor={{ stroke: "var(--chart-grid)", strokeWidth: 2, strokeDasharray: "3 3" }}
                  labelStyle={{ color: "var(--chart-axis)", fontWeight: 600 }}
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--chart-tooltip-shadow)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#revenueGradient)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--chart-primary)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'var(--chart-primary)', strokeWidth: 2, className: 'chart-active-dot' }}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="bg-neutral-50/80 rounded-xl border border-neutral-100 p-4">
              <Stat
                label="Current Month Revenue"
                value={formatCurrency(revenueStats.currentMonth)}
                icon="📈"
              />
            </div>
            <div className="bg-neutral-50/80 rounded-xl border border-neutral-100 p-4">
              <Stat
                label="Month-to-Date Revenue"
                value={formatCurrency(revenueStats.monthToDate)}
                icon="📊"
              />
            </div>
            <div className="bg-neutral-50/80 rounded-xl border border-neutral-100 p-4">
              <Stat
                label="Avg Revenue per Occupied Unit"
                value={formatCurrency(revenueStats.avgPerUnit)}
                icon="🏠"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Occupancy analytics */}
      <section className="surface-panel analytics-panel p-6">
        <h2 className="panel-title">
          Occupancy Analytics
        </h2>
        <p className="panel-subtitle mb-4">
          Current occupancy rates across property categories.
        </p>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyByType} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="type"
                  stroke="var(--chart-axis)"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  stroke="var(--chart-axis)"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v) => `${v}%`}
                  cursor={{ fill: "var(--chart-grid)", fillOpacity: 0.28 }}
                  labelStyle={{ color: "var(--chart-axis)", fontWeight: 600 }}
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--chart-tooltip-shadow)'
                  }}
                />
                <Bar dataKey="occupancy" fill="var(--chart-secondary)" radius={[8, 8, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 text-xs">
            <Stat
              label="Vacant Units"
              value={occupancyStats.vacantUnits}
            />
            <Stat
              label="Turnover Rate"
              value={`${occupancyStats.turnoverRate}%`}
            />
          </div>
        </div>
      </section>

      {/* Reports */}
      <section className="surface-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="panel-title">Financial Reports</h2>
            <p className="panel-subtitle">
              Export and archive portfolio performance packs.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white/90">
          <table className="w-full min-w-140 text-xs">
            <thead className="bg-neutral-50/80 text-left text-neutral-500">
              <tr>
                <th className="px-3 py-2">Report ID</th>
                <th className="px-3 py-2">Report Name</th>
                <th className="px-3 py-2">Date Generated</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {reportRows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="surface-panel card-reveal hover-lift stagger-item p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="kpi-label mb-2">{label}</p>
          <p className="kpi-value-lg">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600">
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="surface-panel p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-28" />
        </div>
        <div className="skeleton h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="kpi-label">
        {label}
      </p>
      <p className="kpi-value-sm">{value}</p>
    </div>
  );
}
