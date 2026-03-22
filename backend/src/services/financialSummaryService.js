// src/services/financialSummaryService.js (ESM)

import Payment from "../models/Payment.js";
import Lease from "../models/Lease.js";
import { calculateUnitPrice } from "./pricingService.js";

const VERIFIED_STATUS = "VERIFIED";
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

function asDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

function minDate(dateA, dateB) {
  return dateA <= dateB ? dateA : dateB;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonthsWithDayClamp(baseDate, monthOffset) {
  const targetMonthIndex = baseDate.getMonth() + monthOffset;
  const targetYear =
    baseDate.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const day = Math.min(
    baseDate.getDate(),
    daysInMonth(targetYear, normalizedMonth)
  );

  return new Date(targetYear, normalizedMonth, day, 23, 59, 59, 999);
}

function buildDueDates(leaseStartDate, leaseEndDate, asOfDate) {
  const startDate = asDate(leaseStartDate);
  const endDate = asDate(leaseEndDate);
  const asOf = asDate(asOfDate) || new Date();

  if (!startDate || !endDate) return [];

  const effectiveEnd = minDate(endOfDay(endDate), endOfDay(asOf));
  if (effectiveEnd < startOfDay(startDate)) return [];

  const dueDates = [];
  for (let monthOffset = 0; monthOffset < 600; monthOffset += 1) {
    const dueDate = addMonthsWithDayClamp(startDate, monthOffset);
    if (dueDate > effectiveEnd) break;
    dueDates.push(dueDate);
  }

  return dueDates;
}

function getNextDueDate(leaseStartDate, leaseEndDate, asOfDate) {
  const startDate = asDate(leaseStartDate);
  const endDate = asDate(leaseEndDate);
  const asOf = asDate(asOfDate) || new Date();

  if (!startDate || !endDate) return null;

  const maxDate = endOfDay(endDate);
  for (let monthOffset = 0; monthOffset < 600; monthOffset += 1) {
    const dueDate = addMonthsWithDayClamp(startDate, monthOffset);
    if (dueDate > maxDate) break;
    if (dueDate > asOf) return dueDate;
  }

  return null;
}

function roundToSingleDecimal(value) {
  return Math.round(value * 10) / 10;
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

function analyzeLeaseFinancials(lease, leasePayments = [], asOfDate = new Date()) {
  const asOf = asDate(asOfDate) || new Date();
  const monthlyRentEtb = resolveMonthlyRentEtb(lease);

  const dueDates = buildDueDates(lease?.startDate, lease?.endDate, asOf);

  const verifiedPaymentsSorted = leasePayments
    .map((payment) => ({
      amountEtb: Number(payment?.amountEtb || 0),
      transactionDate: asDate(payment?.transactionDate),
    }))
    .filter((payment) => payment.transactionDate && payment.transactionDate <= asOf)
    .sort((a, b) => a.transactionDate - b.transactionDate);

  let cumulativePaidByDueDate = 0;
  let paymentCursor = 0;
  let onTimeInstallmentsCount = 0;
  let firstMissedDueDate = null;

  dueDates.forEach((dueDate, index) => {
    while (
      paymentCursor < verifiedPaymentsSorted.length &&
      verifiedPaymentsSorted[paymentCursor].transactionDate <= dueDate
    ) {
      cumulativePaidByDueDate +=
        verifiedPaymentsSorted[paymentCursor].amountEtb;
      paymentCursor += 1;
    }

    const expectedByThisDueDate = monthlyRentEtb * (index + 1);
    if (cumulativePaidByDueDate + 0.01 >= expectedByThisDueDate) {
      onTimeInstallmentsCount += 1;
    } else if (!firstMissedDueDate) {
      firstMissedDueDate = dueDate;
    }
  });

  const totalPaidEtb = verifiedPaymentsSorted.reduce(
    (sum, payment) => sum + payment.amountEtb,
    0
  );

  const totalBilledEtb = monthlyRentEtb * dueDates.length;
  const outstandingBalanceEtb = Math.max(totalBilledEtb - totalPaidEtb, 0);

  let daysOverdue = 0;
  if (outstandingBalanceEtb > 0 && firstMissedDueDate) {
    const diffMs = startOfDay(asOf).getTime() - startOfDay(firstMissedDueDate).getTime();
    if (diffMs > 0) {
      daysOverdue = Math.floor(diffMs / ONE_DAY_MS);
    }
  }

  const nextDueDate = getNextDueDate(lease?.startDate, lease?.endDate, asOf);

  return {
    totalBilledEtb,
    totalPaidEtb,
    outstandingBalanceEtb,
    nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
    daysOverdue,
    dueInstallmentsCount: dueDates.length,
    onTimeInstallmentsCount,
  };
}

/**
 * Compute portfolio financial summary
 */
export async function getPortfolioFinancialSummary() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const firstTrendMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [trackedLeases, verifiedPayments, pendingPaymentsCount] = await Promise.all([
    Lease.find({ status: { $in: ["ACTIVE", "ENDED"] } })
      .select("_id startDate endDate monthlyRentEtb status unitId")
      .populate("unitId"),
    Payment.find({ status: VERIFIED_STATUS }).select(
      "leaseId amountEtb transactionDate"
    ),
    Payment.countDocuments({ status: "PENDING" }),
  ]);

  const paymentsByLeaseId = new Map();
  verifiedPayments.forEach((payment) => {
    const leaseId = String(payment.leaseId);
    const existing = paymentsByLeaseId.get(leaseId) || [];
    existing.push(payment);
    paymentsByLeaseId.set(leaseId, existing);
  });

  let totalBilledEtb = 0;
  let totalPaidEtb = 0;
  let totalDueInstallments = 0;
  let totalOnTimeInstallments = 0;

  trackedLeases.forEach((lease) => {
    const leaseAnalysis = analyzeLeaseFinancials(
      lease,
      paymentsByLeaseId.get(String(lease._id)) || [],
      now
    );

    totalBilledEtb += leaseAnalysis.totalBilledEtb;
    totalPaidEtb += leaseAnalysis.totalPaidEtb;
    totalDueInstallments += leaseAnalysis.dueInstallmentsCount;
    totalOnTimeInstallments += leaseAnalysis.onTimeInstallmentsCount;
  });

  const totalRevenueYTD = verifiedPayments
    .filter((payment) => {
      const date = asDate(payment.transactionDate);
      return date && date >= yearStart && date <= now;
    })
    .reduce((sum, payment) => sum + Number(payment.amountEtb || 0), 0);

  const trendBuckets = [];
  const trendMap = new Map();
  for (let offset = 0; offset < 6; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-US", { month: "short" });
    trendBuckets.push({ key, month: label, revenue: 0 });
    trendMap.set(key, trendBuckets[trendBuckets.length - 1]);
  }

  verifiedPayments.forEach((payment) => {
    const date = asDate(payment.transactionDate);
    if (!date || date < firstTrendMonth || date > now) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = trendMap.get(key);
    if (bucket) {
      bucket.revenue += Number(payment.amountEtb || 0);
    }
  });

  const currentMonthRevenue = trendBuckets[trendBuckets.length - 1]?.revenue || 0;
  const activeLeasesCount = trackedLeases.filter(
    (lease) => lease.status === "ACTIVE"
  ).length;
  const avgRevenuePerOccupiedUnit =
    activeLeasesCount > 0
      ? Math.round(currentMonthRevenue / activeLeasesCount)
      : 0;

  return {
    totalRevenueYTD,
    outstandingBalance: Math.max(totalBilledEtb - totalPaidEtb, 0),
    onTimePaymentRate:
      totalDueInstallments > 0
        ? roundToSingleDecimal(
            (totalOnTimeInstallments / totalDueInstallments) * 100
          )
        : 0,
    monthlyRevenueTrend: trendBuckets.map(({ month, revenue }) => ({
      month,
      revenue,
    })),
    currentMonthRevenue,
    monthToDateRevenue: currentMonthRevenue,
    avgRevenuePerOccupiedUnit,
    pendingPayments: pendingPaymentsCount,
    verifiedPaymentsCount: verifiedPayments.length,
  };
}

/**
 * Compute financial summary for a tenant (all their leases)
 */
export async function getTenantFinancialSummary(tenantId) {
  const leases = await Lease.find({ tenantId, status: "ACTIVE" }).populate("unitId");

  if (leases.length === 0) {
    throw new Error("No active leases found for this tenant");
  }

  const now = new Date();
  const leaseIds = leases.map((lease) => lease._id);

  const verifiedPayments = await Payment.find({
    leaseId: { $in: leaseIds },
    status: VERIFIED_STATUS,
  }).select("leaseId amountEtb transactionDate");

  const paymentsByLeaseId = new Map();
  verifiedPayments.forEach((payment) => {
    const leaseId = String(payment.leaseId);
    const existing = paymentsByLeaseId.get(leaseId) || [];
    existing.push(payment);
    paymentsByLeaseId.set(leaseId, existing);
  });

  const analyses = leases.map((lease) =>
    analyzeLeaseFinancials(
      lease,
      paymentsByLeaseId.get(String(lease._id)) || [],
      now
    )
  );

  const totalBilledEtb = analyses.reduce(
    (sum, analysis) => sum + analysis.totalBilledEtb,
    0
  );
  const totalPaidEtb = analyses.reduce(
    (sum, analysis) => sum + analysis.totalPaidEtb,
    0
  );
  const outstandingBalanceEtb = Math.max(totalBilledEtb - totalPaidEtb, 0);

  const nextDueDateCandidate = analyses
    .map((analysis) => asDate(analysis.nextDueDate))
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  const daysOverdue = analyses.reduce(
    (maxOverdue, analysis) => Math.max(maxOverdue, analysis.daysOverdue || 0),
    0
  );

  return {
    totalBilledEtb,
    totalPaidEtb,
    outstandingBalanceEtb,
    nextDueDate: nextDueDateCandidate
      ? nextDueDateCandidate.toISOString()
      : null,
    daysOverdue,
  };
}

/**
 * Compute simple financial summary for a lease:
 * - totalBilledEtb
 * - totalPaidEtb
 * - outstandingBalanceEtb
 * - nextDueDate
 * - daysOverdue
 */
export async function getLeaseFinancialSummary(leaseId) {
  const lease = await Lease.findById(leaseId)
    .populate("tenantId", "fullName")
    .populate("unitId");
  if (!lease) {
    throw new Error("Lease not found");
  }

  const verifiedPayments = await Payment.find({
    leaseId,
    status: VERIFIED_STATUS,
  }).select("amountEtb transactionDate leaseId");

  const analysis = analyzeLeaseFinancials(lease, verifiedPayments, new Date());

  return {
    totalBilledEtb: analysis.totalBilledEtb,
    totalPaidEtb: analysis.totalPaidEtb,
    outstandingBalanceEtb: analysis.outstandingBalanceEtb,
    nextDueDate: analysis.nextDueDate,
    daysOverdue: analysis.daysOverdue,
  };
}
