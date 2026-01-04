import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * We extend Express's Request type so we can attach req.user
 * after verifying the token.
 */
export type AuthenticatedRequest = Request & {
  user?: { id: string; email?: string };
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Read Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;

    // If header doesn't exist, user isn't logged in
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header." });
    }

    // Split "Bearer token"
    const [scheme, token] = authHeader.split(" ");

    // Must be Bearer
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Invalid Authorization format." });
    }

    // Verify the token using your JWT_SECRET from .env
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET not set on server." });
    }

    // Decode token payload (your auth.service decides what's inside)
    const payload = jwt.verify(token, secret) as any;

    // Most apps store user id like payload.userId or payload.id
    const userId = payload.userId ?? payload.id;

    if (!userId) {
      return res.status(401).json({ error: "Token payload missing user id." });
    }

    // Attach user info to req for later routes to use
    req.user = { id: userId, email: payload.email };

    next(); // allow request to continue to the route handler
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
