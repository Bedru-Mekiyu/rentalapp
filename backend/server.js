// server.js — CRASH-PROOF VERSION (deploy this exactly)

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

app.set("trust proxy", 1);

// ────────────────────────────────────────────────
// SAFEST CORS SETUP – no rejection, no throw, reflects any origin (perfect for dev/preview)
// ────────────────────────────────────────────────
app.use(
  cors({
    origin: true,                     // echoes the requesting Origin → Vercel previews work instantly
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
  })
);

// Extra preflight safety (handles OPTIONS before anything else can interfere)
app.options("*", cors());

// ────────────────────────────────────────────────
// BODY PARSER
// ────────────────────────────────────────────────
app.use(express.json());

// ────────────────────────────────────────────────
// SECURITY
// ────────────────────────────────────────────────
app.use(applyHelmet);

// Bypass rate-limiter on OPTIONS (prevents it from blocking preflight)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  rateLimiter(req, res, next);
});

// ────────────────────────────────────────────────
// HEALTH (test this first in browser)
// ────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", message: "API running" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ────────────────────────────────────────────────
// ROUTES
// ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// ────────────────────────────────────────────────
// ERROR HANDLER – must be last
// ────────────────────────────────────────────────
app.use(errorHandler);

// ────────────────────────────────────────────────
// START
// ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

startServer();