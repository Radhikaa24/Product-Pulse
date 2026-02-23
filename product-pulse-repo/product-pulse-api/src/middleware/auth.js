// src/middleware/auth.js
// ─────────────────────────────────────────────────────────────────────────────
// Authentication Middleware
//
// Two modes:
//   requireAuth  — 401 if no valid token (protected routes)
//   optionalAuth — sets req.userId if token exists, continues regardless
//
// Tokens: JWT in Authorization header (Bearer <token>) or httpOnly cookie.
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");

function getToken(req) {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Fallback to cookie
  return req.cookies?.token || null;
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-in-production";
  return jwt.verify(token, secret);
}

/**
 * Required auth — returns 401 if no valid token.
 */
function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional auth — sets req.userId if token is valid, continues regardless.
 * Used for endpoints that work for both anonymous and logged-in users.
 */
function optionalAuth(req, res, next) {
  const token = getToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      req.userId = payload.userId;
      req.userEmail = payload.email;
    } catch {
      // Invalid token — treat as anonymous, don't block
      req.userId = null;
    }
  } else {
    req.userId = null;
  }
  next();
}

/**
 * Generate a JWT for a user (used after OAuth login).
 */
function generateToken(userId, email) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-in-production";
  return jwt.sign({ userId, email }, secret, { expiresIn: "7d" });
}

module.exports = { requireAuth, optionalAuth, generateToken };
