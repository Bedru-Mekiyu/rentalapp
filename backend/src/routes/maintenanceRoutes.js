// src/routes/maintenanceRoutes.js
import express from "express";
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequestsByTenant,
  updateMaintenanceStatus,
  softDeleteMaintenanceRequest,
} from "../controllers/maintenanceController.js";
import { auth } from "../middleware/auth.js";
import { validateMaintenanceRequest } from "../middleware/validators.js";

const router = express.Router();

// Tenant creates a request
router.post(
  "/",
  auth(["TENANT", "ADMIN", "PM"]),
  validateMaintenanceRequest,
  createMaintenanceRequest
);

// Admin/PM/GM/FS: list all requests (FS is read-only)
router.get("/", auth(["ADMIN", "PM", "GM", "FS"]), getMaintenanceRequests);

// Tenant: list requests by tenant id
router.get(
  "/by-tenant/:tenantId",
  auth(["TENANT", "ADMIN", "PM", "GM", "FS"]),
  getMaintenanceRequestsByTenant
);

// Admin/PM: update status
router.patch("/:id/status", auth(["ADMIN", "PM"]), updateMaintenanceStatus);

// Soft delete
router.delete("/:id", auth(["ADMIN", "PM"]), softDeleteMaintenanceRequest);

export default router;
