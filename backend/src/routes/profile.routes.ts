/**
 * Profile routes
 * Manages profile data, onboarding, and resume uploads for the authenticated user.
 */
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db_connection";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

const resumesDir = path.join(process.cwd(), "uploads", "resumes");
fs.mkdirSync(resumesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resumesDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.-]+/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "application/pdf";
    if (!ok) {
      return cb(new Error("Only PDF files are supported."));
    }
    return cb(null, true);
  },
});

function requireAuth(req: Request, _res: Response, next: Function) {
  try {
    (req as any).userId = getUserIdFromRequest(req);
    next();
  } catch (e) {
    next(e);
  }
}

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
 * POST /profile/signout
 * @summary Sign out the authenticated user
 * @description
 * Invalidates the frontend session (JWT is removed on the client).
 */
router.post("/signout", async (req: Request, res: Response) => {
  try {
    // Verify the token is valid
    getUserIdFromRequest(req);

    // For JWT-based auth, we don't need to do anything on the backend
    // The frontend will remove the token from localStorage
    // The user account remains in the database, they just need to log in again
    return res.json({ ok: true, message: "Signed out successfully" });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
});

/**
 * DELETE /profile/delete
 * @summary Delete the authenticated user's account
 * @description
 * Permanently deletes the user and all associated sessions, attempts, and data.
 */
router.delete("/delete", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    // Delete user's session attempts first
    await prisma.sessionAttempt.deleteMany({
      where: {
        session: {
          userId: userId,
        },
      },
    });

    // Delete user's sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete the user account permanently
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ ok: true, message: "Account deleted successfully" });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * GET /profile/resume
 * @summary Fetch the user's resume
 * @description
 * Returns metadata and URL for the authenticated user's uploaded resume, if any.
 */
router.get("/resume", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    const resume = await prisma.resume.findUnique({
      where: { userId },
      select: {
        resumeUrl: true,
        resumeFileName: true,
        resumeUpdatedAt: true,
      },
    });

    return res.json({ ok: true, resume: resume ?? null });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /profile/resume
 * @summary Upload or replace the user's resume
 * @description
 * Accepts a PDF file, replaces any existing resume, and returns metadata for the saved file.
 */
router.post(
  "/resume",
  requireAuth,
  upload.single("resume"),
  async (req: Request, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);

      if (!req.file) {
        return res.status(400).json({ error: "Missing resume file" });
      }

      const resumeUrl = `/uploads/resumes/${req.file.filename}`;
      const resumeFileName = req.file.originalname;

      // If they already had a resume, delete the old file (best-effort)
      const existing = await prisma.resume.findUnique({
        where: { userId },
        select: { resumeUrl: true },
      });

      if (existing?.resumeUrl) {
        const absOld = path.join(
          process.cwd(),
          existing.resumeUrl.replace("/uploads/", "uploads/")
        );
        try {
          fs.unlinkSync(absOld);
        } catch {}
      }

      // Upsert record (one resume per user)
      const saved = await prisma.resume.upsert({
        where: { userId },
        update: {
          resumeUrl,
          resumeFileName,
          // resumeUpdatedAt auto-updates because of @updatedAt
        },
        create: {
          userId,
          resumeUrl,
          resumeFileName,
        },
        select: {
          resumeUrl: true,
          resumeFileName: true,
          resumeUpdatedAt: true,
        },
      });

      return res.json({ ok: true, resume: saved });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }
  }
);

/**
 * DELETE /profile/resume
 * @summary Delete the user's uploaded resume
 * @description
 * Removes the resume file and corresponding database record for the authenticated user.
 */
router.delete("/resume", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    const existing = await prisma.resume.findUnique({
      where: { userId },
      select: { resumeUrl: true },
    });

    if (existing?.resumeUrl) {
      const abs = path.join(
        process.cwd(),
        existing.resumeUrl.replace("/uploads/", "uploads/")
      );
      try {
        fs.unlinkSync(abs);
      } catch {}
    }

    await prisma.resume.deleteMany({ where: { userId } });

    return res.json({ ok: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * GET /profile
 * @summary Fetch the authenticated user's profile
 * @description
 * Returns profile information with safe fields; email is included but not editable.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true, // show email (not editable)
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        avatarShape: true,
        avatarBorder: true,
        createdAt: true,
        updatedAt: true,
        darkMode: true,
        onboardingCompleted: true,
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
 * PATCH /profile/onboarding
 * @summary Mark onboarding as completed
 * @description
 * Updates the authenticated user's profile to indicate onboarding has been finished.
 */
router.patch("/onboarding", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
      select: { id: true, onboardingCompleted: true },
    });
    return res.json({ ok: true, user: updated });
  } catch (error: any) {
    return res.status(401).json({ error: error.message || "Unauthorized" });
  }
});

/**
 * PATCH /profile
 * @summary Update the authenticated user's profile
 * @description
 * Updates editable profile fields such as name, bio, location, avatar, and dark mode. Email is not editable.
 */
router.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    // These are the only fields we allow updating from profile settings:
    const {
      name,
      bio,
      location,
      avatarUrl,
      avatarShape,
      avatarBorder,
      darkMode,
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        // Only set fields if provided; undefined fields won't overwrite
        name,
        bio,
        location,
        avatarUrl,
        avatarShape,
        avatarBorder,
        darkMode,
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        avatarShape: true,
        avatarBorder: true,
        darkMode: true,
        updatedAt: true,
      },
    });

    return res.json({ ok: true, user: updated });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
