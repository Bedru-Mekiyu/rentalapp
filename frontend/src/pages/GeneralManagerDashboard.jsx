
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
import SkeletonCard from "../components/SkeletonCard";

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

  const [reports, setReports] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [unitsRes, leasesRes] = await Promise.all([
        API.get("/units"),
        API.get("/leases"),
      ]); // /api/units + /api/leases

      const units = unitsRes.data?.data || [];
      const leases = leasesRes.data?.data || [];

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

      // Simple revenue trend & stats (placeholder using active leases)
      const estMonthlyRevenue = leases
        .filter((l) => l.status === "ACTIVE")
        .reduce((sum, l) => sum + (l.monthlyRentEtb || 0), 0);

      const revenueTrendData = [
        { month: "Jan", revenue: estMonthlyRevenue * 0.8 },
        { month: "Feb", revenue: estMonthlyRevenue * 0.9 },
        { month: "Mar", revenue: estMonthlyRevenue * 1.0 },
        { month: "Apr", revenue: estMonthlyRevenue * 1.05 },
        { month: "May", revenue: estMonthlyRevenue * 1.1 },
      ];

      const avgPerUnit =
        occupiedUnits > 0
          ? Math.round(estMonthlyRevenue / occupiedUnits)
          : 0;

      setKpis({
        totalProperties,
        activeLeases,
        occupancyRate: Number(occupancyRate.toFixed(1)),
      });

      setOccupancyStats({
        vacantUnits,
        turnoverRate: 0, // could be computed when you track move-outs
      });

      setRevenueStats({
        currentMonth: estMonthlyRevenue,
        monthToDate: estMonthlyRevenue * 0.9,
        avgPerUnit,
      });

      setOccupancyByType(occupancyByTypeData);
      setRevenueTrend(revenueTrendData);

      setReports([
        {
          id: "RPT-001",
          name: "Monthly Portfolio Overview",
          date: "This month",
          status: "Ready",
        },
        {
          id: "RPT-002",
          name: "Occupancy & Vacancy Report",
          date: "This month",
          status: "Ready",
        },
      ]);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Financial Reports", 20, 20);
    reports.forEach((r, i) => {
      doc.text(`${r.id}: ${r.name} - ${r.status}`, 20, 40 + i * 10);
    });
    doc.save("reports.pdf");
  };

  const exportCSV = () => {
    const csv = Papa.unparse(reports);
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
        <SkeletonCard>
          <div className="skeleton h-4 w-24" />
          <div className="mt-3 space-y-2">
            <div className="skeleton h-8 w-72" />
            <div className="skeleton h-3 w-96" />
          </div>
        </SkeletonCard>
        <div className="grid gap-6 md:grid-cols-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        <SkeletonCard>
          <div className="skeleton h-5 w-48" />
          <div className="mt-6 skeleton h-56 w-full" />
        </SkeletonCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Portfolio"
        eyebrowClassName="bg-emerald-100 text-emerald-700"
        title="General Manager Dashboard"
        subtitle={`Welcome back, ${user?.fullName || "General Manager"}. Here's your portfolio overview.`}
      />

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <KpiCard
          label="Total Properties"
          value={kpis.totalProperties}
          icon="🏢"
          gradient="from-emerald-500 to-teal-500"
        />
        <KpiCard
          label="Active Leases"
          value={kpis.activeLeases}
          icon="📄"
          gradient="from-amber-500 to-orange-500"
        />
        <KpiCard
          label="Overall Occupancy"
          value={`${kpis.occupancyRate}%`}
          icon="📊"
          gradient="from-teal-600 to-emerald-500"
        />
      </div>

      {/* Revenue analytics */}
      <section className="surface-panel analytics-panel card-reveal p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
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
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="month" stroke="var(--chart-axis)" />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} stroke="var(--chart-axis)" />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
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
            <div className="surface-panel p-4">
              <Stat
                label="Current Month Revenue"
                value={formatCurrency(revenueStats.currentMonth)}
                icon="📈"
              />
            </div>
            <div className="surface-panel p-4">
              <Stat
                label="Month-to-Date Revenue"
                value={formatCurrency(revenueStats.monthToDate)}
                icon="📊"
              />
            </div>
            <div className="surface-panel p-4">
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
      <section className="surface-panel analytics-panel p-4">
        <h2 className="panel-title text-sm">
          Occupancy Analytics
        </h2>
        <p className="panel-subtitle mb-4">
          Current occupancy rates across property categories.
        </p>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyByType}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="type" stroke="var(--chart-axis)" />
                <YAxis stroke="var(--chart-axis)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: 'none', borderRadius: '0.5rem', boxShadow: 'var(--chart-tooltip-shadow)' }} />
                <Bar dataKey="occupancy" fill="var(--chart-secondary)" />
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
      <section className="surface-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="panel-title text-sm">
            Financial Reports
          </h2>
          <div className="flex gap-2">
            <button className="rounded-md bg-slate-100 px-3 py-1 text-xs" onClick={exportPDF}>
              Export to PDF
            </button>
            <button className="rounded-md bg-slate-100 px-3 py-1 text-xs" onClick={exportCSV}>
              Export to CSV
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Report ID</th>
                <th className="px-3 py-2">Report Name</th>
                <th className="px-3 py-2">Date Generated</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reports.map((r) => (
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

function KpiCard({ label, value, icon, gradient }) {
  return (
    <div className={`surface-panel card-reveal stagger-item p-6 hover:scale-[1.02] transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="panel-subtitle mb-2 text-sm">{label}</p>
          <p className="text-4xl font-bold text-slate-900">
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
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
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
}
