// src/server.js
// ─────────────────────────────────────────────────────────────────────────────
// Product Pulse API Server
//
// Entry point. Wires up Express with middleware, routes, and error handling.
//
// Start:  node src/server.js
// Dev:    npx nodemon src/server.js
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { loadConfig } = require("./config/env");
const { disconnect } = require("./config/database");
const apiRoutes = require("./routes/api.routes");

// ─── INIT ────────────────────────────────────────────────────────────────────

const config = loadConfig();
const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: config.IS_PROD
    ? ["https://productpulse.app", "https://www.productpulse.app"]
    : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Request logging (dev only)
if (!config.IS_PROD) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(`${req.method} ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", apiRoutes);

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (!config.IS_PROD) console.error(err.stack);

  const status = err.status || 500;
  res.status(status).json({
    error: config.IS_PROD ? "Internal server error" : err.message,
  });
});

// ─── START ───────────────────────────────────────────────────────────────────

const server = app.listen(config.PORT, () => {
  console.log(`\n  Product Pulse API`);
  console.log(`  ─────────────────────────────`);
  console.log(`  Environment:  ${config.NODE_ENV}`);
  console.log(`  Port:         ${config.PORT}`);
  console.log(`  Database:     ${config.DATABASE_URL.replace(/\/\/.*@/, "//***@")}`);
  console.log(`  ─────────────────────────────\n`);
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(async () => {
    await disconnect();
    console.log("Server closed. Goodbye.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = app; // for testing
