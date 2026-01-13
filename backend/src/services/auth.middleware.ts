/**
 * JWT authentication middleware
 * Validates `Authorization: Bearer <token>` and attaches `authenticatedUser` to the request.
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: {
        id: string;
        email?: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Missing Authorization header." });
      return;
    }
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      res.status(401).json({ error: "Invalid Authorization format." });
      return;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT_SECRET not set on server." });
      return;
    }
    const payload = jwt.verify(token, secret) as any;
    const userId = payload.userId ?? payload.id;
    if (!userId) {
      res.status(401).json({ error: "Token payload missing user id." });
      return;
    }
    req.authenticatedUser = { id: userId, email: payload.email };
    next();
    return;
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }
}

// Alias for compatibility
export const authenticateJWT = requireAuth;
