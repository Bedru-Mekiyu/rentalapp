import Lease from "../models/Lease.js";
import Payment from "../models/Payment.js";
import MaintenanceRequest from "../models/MaintenanceRequest.js";
import {
  getLeaseFinancialSummary,
  getPortfolioFinancialSummary,
} from "./financialSummaryService.js";
import { calculateUnitPrice } from "./pricingService.js";

function formatCurrencyEtb(value) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value) {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(1)}%`;
}

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function resolveMonthlyRentEtb(lease) {
  try {
    if (lease?.unitId && typeof lease.unitId === "object") {
      return Number(calculateUnitPrice(lease.unitId) || 0);
    }
  } catch {
  }

  return 0;
}

async function buildMonthlyRevenueReport() {
  const portfolio = await getPortfolioFinancialSummary();
  const trend = portfolio.monthlyRevenueTrend || [];

  const latest = trend[trend.length - 1]?.revenue || 0;
  const previous = trend[trend.length - 2]?.revenue || 0;
  const monthOverMonthGrowth =
    previous > 0 ? ((latest - previous) / previous) * 100 : latest > 0 ? 100 : 0;

  const { start, end } = monthBounds(new Date());
  const activeLeases = await Lease.find({
    status: "ACTIVE",
    startDate: { $lte: end },
    endDate: { $gte: start },
  })
    .select("monthlyRentEtb unitId")
    .populate("unitId");

  const expectedThisMonth = activeLeases.reduce(
    (sum, lease) => sum + resolveMonthlyRentEtb(lease),
    0
  );

  const collectionRate = expectedThisMonth > 0 ? (latest / expectedThisMonth) * 100 : 0;

  return {
    title: "Monthly Revenue Report",
    subtitle: "Revenue trends and collections by month.",
    summary:
      "Summarizes verified monthly collections and compares them with expected active-lease billing.",
    metrics: [
      { label: "Latest Month", value: formatCurrencyEtb(latest) },
      { label: "Month-over-Month", value: formatPercent(monthOverMonthGrowth) },
      { label: "Collection Rate", value: formatPercent(collectionRate) },
      { label: "YTD Revenue", value: formatCurrencyEtb(portfolio.totalRevenueYTD || 0) },
    ],
    highlights: [
      monthOverMonthGrowth >= 0
        ? `Collections increased by ${formatPercent(monthOverMonthGrowth)} versus the prior month.`
        : `Collections decreased by ${formatPercent(Math.abs(monthOverMonthGrowth))} versus the prior month.`,
      `Outstanding portfolio balance is ${formatCurrencyEtb(portfolio.outstandingBalance || 0)}.`,
      `On-time payment rate is ${formatPercent(portfolio.onTimePaymentRate || 0)} across due installments.`,
    ],
    monthlyRevenueTrend: trend,
  };
}

async function buildDelinquencyReport() {
  const activeLeases = await Lease.find({ status: "ACTIVE" }).select("_id");

  const summaries = await Promise.all(
    activeLeases.map((lease) => getLeaseFinancialSummary(lease._id))
  );

  const delinquent = summaries.filter(
    (summary) => Number(summary.outstandingBalanceEtb || 0) > 0
  );

  const buckets = {
    currentTo30: 0,
    day31To60: 0,
    day61Plus: 0,
  };

  delinquent.forEach((summary) => {
    const overdueDays = Number(summary.daysOverdue || 0);
    const amount = Number(summary.outstandingBalanceEtb || 0);

    if (overdueDays <= 30) {
      buckets.currentTo30 += amount;
    } else if (overdueDays <= 60) {
      buckets.day31To60 += amount;
    } else {
      buckets.day61Plus += amount;
    }
  });

  const totalDelinquentBalance =
    buckets.currentTo30 + buckets.day31To60 + buckets.day61Plus;
  const avgOverdueDays =
    delinquent.length > 0
      ? delinquent.reduce((sum, summary) => sum + Number(summary.daysOverdue || 0), 0) /
        delinquent.length
      : 0;

  const dominantBucket =
    buckets.day61Plus >= buckets.day31To60 && buckets.day61Plus >= buckets.currentTo30
      ? "61+ days"
      : buckets.day31To60 >= buckets.currentTo30
      ? "31-60 days"
      : "0-30 days";

  return {
    title: "Delinquency Report",
    subtitle: "Aging buckets for outstanding balances.",
    summary:
      "Breakdown of overdue balances across active leases by delinquency age bucket.",
    metrics: [
      { label: "Past Due (0-30d)", value: formatCurrencyEtb(buckets.currentTo30) },
      { label: "Past Due (31-60d)", value: formatCurrencyEtb(buckets.day31To60) },
      { label: "Past Due (61d+)", value: formatCurrencyEtb(buckets.day61Plus) },
      { label: "Total Delinquent", value: formatCurrencyEtb(totalDelinquentBalance) },
    ],
    highlights: [
      `${delinquent.length} active lease(s) currently carry overdue balances.`,
      `Average overdue age is ${Math.round(avgOverdueDays)} day(s).`,
      `Largest delinquency bucket is ${dominantBucket}.`,
    ],
  };
}

async function buildExpenseProxyReport() {
  const now = new Date();
  const last30Start = new Date(now);
  last30Start.setDate(last30Start.getDate() - 30);
  const prev30Start = new Date(last30Start);
  prev30Start.setDate(prev30Start.getDate() - 30);

  const [openCount, inProgressCount, resolvedLast30, highUrgencyOpen, createdLast30, createdPrev30, verifiedPaymentsYtd] =
    await Promise.all([
      MaintenanceRequest.countDocuments({ isDeleted: false, status: "open" }),
      MaintenanceRequest.countDocuments({ isDeleted: false, status: "in_progress" }),
      MaintenanceRequest.countDocuments({
        isDeleted: false,
        status: { $in: ["resolved", "closed"] },
        updatedAt: { $gte: last30Start, $lte: now },
      }),
      MaintenanceRequest.countDocuments({ isDeleted: false, status: "open", urgency: "high" }),
      MaintenanceRequest.countDocuments({ isDeleted: false, createdAt: { $gte: last30Start, $lte: now } }),
      MaintenanceRequest.countDocuments({
        isDeleted: false,
        createdAt: { $gte: prev30Start, $lt: last30Start },
      }),
      Payment.countDocuments({
        status: "VERIFIED",
        transactionDate: { $gte: new Date(now.getFullYear(), 0, 1), $lte: now },
      }),
    ]);

  const requestTrend = createdPrev30 > 0 ? ((createdLast30 - createdPrev30) / createdPrev30) * 100 : 0;

  return {
    title: "Expense Report",
    subtitle: "Maintenance and operational workload overview.",
    summary:
      "Operational expense proxy derived from maintenance workload and processing throughput.",
    metrics: [
      { label: "Open Requests", value: String(openCount) },
      { label: "In Progress", value: String(inProgressCount) },
      { label: "Resolved (30d)", value: String(resolvedLast30) },
      { label: "High Urgency Open", value: String(highUrgencyOpen) },
    ],
    highlights: [
      `Maintenance intake changed by ${formatPercent(requestTrend)} in the last 30 days.`,
      `${verifiedPaymentsYtd} verified payment(s) processed year-to-date support operational cash flow.`,
      "Use this report as a live operational signal until direct expense ledger entries are introduced.",
    ],
  };
}

export async function getReportDetail(reportId) {
  if (reportId === "monthly-revenue") {
    return buildMonthlyRevenueReport();
  }

  if (reportId === "delinquency") {
    return buildDelinquencyReport();
  }

  if (reportId === "expense") {
    return buildExpenseProxyReport();
  }

  throw new Error("Report not found");
}
