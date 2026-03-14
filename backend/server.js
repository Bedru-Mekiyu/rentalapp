// server.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { connectDB } from './src/config/db.js'
import errorHandler from './src/middleware/errorHandler.js'

import authRoutes from './src/routes/auth.routes.js'
import userRoutes from './src/routes/user.routes.js'
import paymentRoutes from './src/routes/payment.routes.js'
import financeRoutes from './src/routes/finance.routes.js'
import leaseRoutes from './src/routes/lease.routes.js'
import unitRoutes from './src/routes/unit.routes.js'
import propertyRoutes from './src/routes/property.routes.js'
import maintenanceRoutes from './src/routes/maintenanceRoutes.js'

import { applyHelmet, rateLimiter } from './src/middleware/security.js'

const app = express()

// important when deployed behind Railway proxy
app.set('trust proxy', 1)


// --------------------
// CORS CONFIGURATION
// --------------------

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://rentalapp2.vercel.app"
]

const corsOptions = {
  origin: function (origin, callback) {

    // allow server-to-server / Postman
    if (!origin) return callback(null, true)

    // allow local dev
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // allow all vercel preview deployments
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, true)
    }

    console.warn("Blocked by CORS:", origin)

    // do NOT crash server
    return callback(null, false)
  },

  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  optionsSuccessStatus: 204
}

// apply CORS BEFORE routes
app.use(cors(corsOptions))
app.options("*", cors(corsOptions))


// --------------------
// SECURITY
// --------------------

app.use(applyHelmet)
app.use(rateLimiter)


// --------------------
// BODY PARSER
// --------------------

app.use(express.json())


// --------------------
// HEALTH ROUTES
// --------------------

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Rental API is running",
    health: "/health"
  })
})

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})


// --------------------
// API ROUTES
// --------------------

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/finance", financeRoutes)
app.use("/api/leases", leaseRoutes)
app.use("/api/units", unitRoutes)
app.use("/api/properties", propertyRoutes)
app.use("/api/maintenance", maintenanceRoutes)


// --------------------
// ERROR HANDLER
// --------------------

app.use(errorHandler)


// --------------------
// SERVER START
// --------------------

const PORT = process.env.PORT || 5000

async function startServer() {
  try {

    await connectDB()
    console.log("MongoDB connected")

    console.log("NODE_ENV:", process.env.NODE_ENV || "development")

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

  } catch (error) {

    console.error("Failed to start server:", error)
    process.exit(1)

  }
}

startServer()