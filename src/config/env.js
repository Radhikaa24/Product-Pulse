// src/config/env.js
// Centralized environment configuration with validation

const requiredVars = ["DATABASE_URL"];
const optionalVars = {
  PORT: "3001",
  NODE_ENV: "development",
  REDIS_URL: "redis://localhost:6379",
  OPENAI_API_KEY: "",          // for AI-powered summary generation
  PRODUCT_HUNT_TOKEN: "",      // Product Hunt API v2
  JWT_SECRET: "dev-secret-change-in-production",
  EDITION_PUBLISH_HOUR_UTC: "6", // 6 AM UTC default
};

function loadConfig() {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const config = {};
  for (const key of requiredVars) {
    config[key] = process.env[key];
  }
  for (const [key, fallback] of Object.entries(optionalVars)) {
    config[key] = process.env[key] || fallback;
  }

  config.PORT = parseInt(config.PORT, 10);
  config.EDITION_PUBLISH_HOUR_UTC = parseInt(config.EDITION_PUBLISH_HOUR_UTC, 10);
  config.IS_PROD = config.NODE_ENV === "production";

  return Object.freeze(config);
}

module.exports = { loadConfig };
