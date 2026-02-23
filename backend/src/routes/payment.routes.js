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

// staff roles that can manage/verify payments
const STAFF_ROLES = ["PM", "ADMIN"];

// PM + ADMIN can see all payments (verification dashboard)
router.get("/", auth(STAFF_ROLES), listPayments);

// Tenants + admin can create a payment record (no FS; add "PM" if you want)
router.post(
  "/",
  auth(["TENANT", "ADMIN"]),
  validateCreatePayment,
  createPayment
);

// Only PM and ADMIN can change status (verify/reject)
router.patch("/:id/status", auth(STAFF_ROLES), updatePaymentStatus);

// Only PM and ADMIN see payments by lease (back-office view)
router.get("/by-lease/:leaseId", auth(STAFF_ROLES), listByLease);

// Tenants + PM + ADMIN can see payments for a tenant
router.get(
  "/by-tenant/:tenantId",
  auth(["TENANT", ...STAFF_ROLES]),
  listByTenant
);

// Payment detail for tenant or staff
router.get("/:id", auth(["TENANT", ...STAFF_ROLES]), getPaymentById);

export default router;
