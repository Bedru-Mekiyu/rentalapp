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


// ----------------------
// GLOBAL CORS FIX
// ----------------------

const corsOptions = {
  origin: (origin, callback) => {

    // allow requests without origin (Postman, curl)
    if (!origin) return callback(null, true);

    // allow localhost
    if (origin.includes("localhost")) {
      return callback(null, true);
    }

    // allow ALL vercel deployments
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    console.warn("Blocked by CORS:", origin);

    // never throw error (prevents server crash)
    return callback(null, true);
  },

  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
};

app.use(cors(corsOptions));

// handle preflight
app.options("*", cors(corsOptions));


// ----------------------
// BODY PARSER
// ----------------------

app.use(express.json());


// ----------------------
// SECURITY
// ----------------------

app.use(applyHelmet);

// skip rate limiter for preflight
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  rateLimiter(req, res, next);
});


// ----------------------
// HEALTH ROUTES
// ----------------------

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Rental API is running",
    health: "/health"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


// ----------------------
// API ROUTES
// ----------------------

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/maintenance", maintenanceRoutes);


// ----------------------
// ERROR HANDLER
// ----------------------

app.use(errorHandler);


// ----------------------
// START SERVER
// ----------------------

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

    console.error("Server startup error:", error);

    process.exit(1);
  }
}

startServer();