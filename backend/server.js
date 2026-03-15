// backend/server.js

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
// CORS – safest production setup (reflects any origin)
// No custom logic → no chance of throwing "Not allowed by CORS"
// ────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Explicit preflight handler (extra protection)
app.options("*", cors());

// ────────────────────────────────────────────────
// Body parser
// ────────────────────────────────────────────────
app.use(express.json());

// ────────────────────────────────────────────────
// Security middleware
// ────────────────────────────────────────────────
app.use(applyHelmet);

// Skip rate limiter on OPTIONS requests (prevents blocking preflight)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  rateLimiter(req, res, next);
});

// ────────────────────────────────────────────────
// Health endpoints (explicit 200 status)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Rental API is running",
    health: "/health",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ────────────────────────────────────────────────
// API routes
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
// Error handler – must be last
// ────────────────────────────────────────────────
app.use(errorHandler);

// ────────────────────────────────────────────────
// Start server – MUST use process.env.PORT for Railway
// ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    console.log("MongoDB connected");
    console.log("NODE_ENV:", process.env.NODE_ENV || "development");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message || error);
    process.exit(1);
  }
}

startServer();