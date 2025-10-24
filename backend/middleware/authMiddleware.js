// backend/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware: Verify JWT and attach user object to request
 * - Works for both Youth & Trusted users
 * - Handles invalid / expired / missing tokens
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    // Verify token using secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Fetch user (without password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Optional: auto-update lastLoginAt timestamp
    user.lastLoginAt = new Date();
    await user.save();

    req.user = user; // attach full user document
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }
    return res.status(401).json({ message: "Not authorized, token verification failed" });
  }
};

/**
 * Middleware factory: Require specific role or roles
 * Usage:
 *    router.get('/trusted-only', protect, requireRole('Trusted'), handler)
 * or:
 *    router.get('/multi', protect, requireRole(['Trusted', 'Admin']), handler)
 */
export const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized, user missing" });
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const userHasRole =
    allowedRoles.includes(req.user.role) ||
    (Array.isArray(req.user.roles) &&
      req.user.roles.some((r) => allowedRoles.includes(r)));

  if (!userHasRole) {
    return res.status(403).json({ message: "Access denied: insufficient permissions" });
  }

  next();
};

/**
 * Middleware: Require verified email (optional enhancement)
 */
export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user?.emailVerified) {
    return res.status(403).json({ message: "Please verify your email to continue" });
  }
  next();
};

export { protect };
export default protect;
