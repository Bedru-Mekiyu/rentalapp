// backend/server.js — FIXED FOR RAILWAY HEALTHCHECK + PORT + PROBE

import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./src/config/db.js";
import errorHandler from "./src/middleware/errorHandler.js";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import financeRoutes from "./src/routes/finance.routes.js";
import leaseRoutes from "./src/routes/lease.routes.js";
import unitRoutes from "./src/routes/unit.routes.js";
import propertyRoutes from "./src/routes/property.routes.js";
import maintenanceRoutes from "./src/routes/maintenanceRoutes.js";

import { applyHelmet, rateLimiter } from "./src/middleware/security.js";

const app = express();

// Trust proxy for Railway (important for forwarded headers)
app.set("trust proxy", 1);

// ────────────────────────────────────────────────
// CORS – simple reflection (allows healthcheck probe too)
// ────────────────────────────────────────────────
app.use(
  cors({
    origin: true,  // Reflects any origin → works for Vercel previews + Railway probe
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Pre-flight explicit
app.options("*", cors());

// Body parser
app.use(express.json());

// Security
app.use(applyHelmet);

// Rate limit skip for OPTIONS + healthcheck (safety)
app.use((req, res, next) => {
  if (req.method === "OPTIONS" || req.path === "/health") {
    return next();
  }
  rateLimiter(req, res, next);
});

// ────────────────────────────────────────────────
// Healthcheck – explicit 200 + logging for debug
// ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  console.log(`[HEALTH] Probe hit /health from ${req.ip || req.headers['x-forwarded-for'] || 'unknown'} – responding 200`);
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "API running" });
});

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// Error handler last
app.use(errorHandler);

// ────────────────────────────────────────────────
// Listen – critical: use process.env.PORT + bind to 0.0.0.0
// ────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;  // fallback only for local

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log(`process.env.PORT was: ${process.env.PORT || '(not set – using fallback)'}`);
  console.log("Healthcheck probe should now reach /health");
});

async function startServer() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

startServer();