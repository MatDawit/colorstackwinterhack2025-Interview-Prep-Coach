import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db_connection";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(req: Request): string {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    throw new Error("Invalid Authorization format. Use: Bearer <token>");
  }

  const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
  if (!payload.userId) {
    throw new Error("Invalid token payload");
  }
  return payload.userId;
}

// GET /api/profile/preferences
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    const preferences = await prisma.preferences.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return res.json({ ok: true, preferences: preferences });
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

// PATCH /api/profile/preferences
router.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    const {
      defaultRole,
      defaultDifficulty,
      feedbackEmphasize,
      focusBehavioral,
      focusTechnical,
      focusSystemDesign,
      autoStartNext,
      feedbackTone,
      feedbackDetail,
      showSampleAnswer,
      enableTimer,
      countdownSeconds,
      autoSubmitOnSilence,
    } = req.body;

    const updated = await prisma.preferences.upsert({
      where: { userId },
      update: {
        defaultRole,
        defaultDifficulty,
        feedbackEmphasize,
        focusBehavioral,
        focusTechnical,
        focusSystemDesign,
        autoStartNext,
        feedbackTone,
        feedbackDetail,
        showSampleAnswer,
        enableTimer,
        countdownSeconds,
        autoSubmitOnSilence,
      },
      create: {
        userId,
        defaultRole,
        defaultDifficulty,
        feedbackEmphasize,
        focusBehavioral,
        focusTechnical,
        focusSystemDesign,
        autoStartNext,
        feedbackTone,
        feedbackDetail,
        showSampleAnswer,
        enableTimer,
        countdownSeconds,
        autoSubmitOnSilence,
      },
    });
    return res.json({ ok: true, preferences: updated });
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
});
export default router;
