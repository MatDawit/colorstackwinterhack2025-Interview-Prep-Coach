import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db_connection";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

// 1) A tiny helper to get the logged-in user's id from the JWT
function getUserIdFromRequest(req: Request): string {
  // Expect: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    ConfirmAndThrow("Missing Authorization header");
  }

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    ConfirmAndThrow("Invalid Authorization format. Use: Bearer <token>");
  }

  // Verify token
  const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };

  if (!payload.userId) {
    ConfirmAndThrow("Token payload missing userId");
  }

  return payload.userId;
}

// Small helper to throw consistent errors
function ConfirmAndThrow(message: string): never {
  throw new Error(message);
}

/**
 * GET /profile
 * Returns the current user's profile (safe fields only).
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,            // show email (not editable)
        name: true,
        targetRole: true,
        experienceLevel: true,
        bio: true,
        location: true,
        avatarUrl: true,
        avatarShape: true,
        avatarBorder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ ok: true, user });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
});

/**
 * PATCH /profile
 * Updates editable profile fields.
 * Email is intentionally not included.
 */
router.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    // These are the only fields we allow updating from profile settings:
    const {
      name,
      targetRole,
      experienceLevel,
      bio,
      location,
      avatarUrl,
      avatarShape,
      avatarBorder,
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        // Only set fields if provided; undefined fields won't overwrite
        name,
        targetRole,
        experienceLevel,
        bio,
        location,
        avatarUrl,
        avatarShape,
        avatarBorder,
      },
      select: {
        id: true,
        email: true,
        name: true,
        targetRole: true,
        experienceLevel: true,
        bio: true,
        location: true,
        avatarUrl: true,
        avatarShape: true,
        avatarBorder: true,
        updatedAt: true,
      },
    });

    return res.json({ ok: true, user: updated });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
