// src/routes/payment.routes.js (ESM)

import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  listByLease,
  listByTenant,
  listPayments,
} from "../controllers/paymentController.js";
import { validateCreatePayment } from "../middleware/validators.js";

const router = Router();

// roles that can view payment data (read-only for GM)
const PAYMENT_VIEW_ROLES = ["PM", "ADMIN", "FS", "GM"];

// roles that can manage/verify payments
const PAYMENT_MANAGE_ROLES = ["PM", "ADMIN", "FS"];

// PM + ADMIN + FS can see all payments (verification dashboard)
router.get("/", auth(PAYMENT_VIEW_ROLES), listPayments);

// Tenants + admin can create a payment record (no FS; add "PM" if you want)
router.post(
  "/",
  auth(["TENANT", "ADMIN"]),
  validateCreatePayment,
  createPayment
);

// Only PM and ADMIN can change status (verify/reject)
router.patch("/:id/status", auth(PAYMENT_MANAGE_ROLES), updatePaymentStatus);

// Only PM and ADMIN see payments by lease (back-office view)
router.get("/by-lease/:leaseId", auth(PAYMENT_VIEW_ROLES), listByLease);

// Tenants + PM + ADMIN + FS can see payments for a tenant
router.get(
  "/by-tenant/:tenantId",
  auth(["TENANT", ...PAYMENT_VIEW_ROLES]),
  listByTenant
);

// Payment detail for tenant or staff
router.get("/:id", auth(["TENANT", ...PAYMENT_VIEW_ROLES]), getPaymentById);

export default router;
