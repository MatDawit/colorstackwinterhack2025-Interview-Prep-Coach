import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Extend Express's Request type with authenticatedUser property
 */
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
      return res.status(401).json({ error: "Missing Authorization header." });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Invalid Authorization format." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET not set on server." });
    }

    const payload = jwt.verify(token, secret) as any;
    const userId = payload.userId ?? payload.id;

    if (!userId) {
      return res.status(401).json({ error: "Token payload missing user id." });
    }

    req.authenticatedUser = { id: userId, email: payload.email };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}