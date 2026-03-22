// src/controllers/financeController.js (ESM)

import { getLeaseFinancialSummary, getPortfolioFinancialSummary, getTenantFinancialSummary } from "../services/financialSummaryService.js";
import { getReportDetail } from "../services/reportService.js";
import Lease from "../models/Lease.js";

export async function getLeaseSummary(req, res) {
  try {
    const { leaseId } = req.params;

    if (req.user?.role === "TENANT") {
      const lease = await Lease.findById(leaseId).select("tenantId");
      if (!lease) {
        return res
          .status(404)
          .json({ success: false, message: "Lease not found" });
      }
      if (String(lease.tenantId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    const summary = await getLeaseFinancialSummary(leaseId);
    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error("getLeaseSummary error:", err);
    if (err.message === "Lease not found") {
      return res
        .status(404)
        .json({ success: false, message: "Lease not found" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to compute financial summary" });
  }
}

export async function getPortfolioSummary(req, res) {
  try {
    const summary = await getPortfolioFinancialSummary();
    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error("getPortfolioSummary error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to compute portfolio summary" });
  }
}

export async function getTenantSummary(req, res) {
  try {
    const { tenantId } = req.params;

    if (
      req.user?.role === "TENANT" &&
      String(tenantId) !== String(req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const summary = await getTenantFinancialSummary(tenantId);
    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error("getTenantSummary error:", err);
    if (err.message === "No active leases found for this tenant") {
      return res.status(404).json({
        success: false,
        message: "No active leases found for this tenant",
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to compute tenant financial summary" });
  }
}

export async function getReport(req, res) {
  try {
    const { reportId } = req.params;
    const report = await getReportDetail(reportId);
    return res.json({ success: true, data: report });
  } catch (err) {
    console.error("getReport error:", err);
    if (err.message === "Report not found") {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to compute report" });
  }
}
