import { Router, Request, Response } from "express";
import { prisma } from "../db_connection";

const router = Router();

// POST /api/session/start
// Usage: Called when user clicks "Start Interview"
router.post("/start", async (req: Request, res: Response) => {
  try {
    // In a real app, get userId from req.user (JWT)
    // For now, we use a test ID or pass it from frontend
    const { userId = "test-user-id", interviewType } = req.body;

    // 1. Close any old "IN_PROGRESS" sessions to keep DB clean
    await prisma.session.updateMany({
      where: { userId: userId, status: "IN_PROGRESS" },
      data: { status: "ABANDONED", endedAt: new Date() }
    });

    // 2. Create the new Session
    const session = await prisma.session.create({
      data: {
        userId,
        interviewType: interviewType || "General",
        status: "IN_PROGRESS"
      }
    });

    console.log("New Session Started:", session.id);
    res.json({ sessionId: session.id });

  } catch (error: any) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/session/end
// Usage: Called when user finishes the interview
router.post("/end", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    // Calculate average score
    const aggregate = await prisma.sessionAttempt.aggregate({
      where: { sessionId: sessionId },
      _avg: { score: true }
    });

    const finalScore = aggregate._avg.score || 0;

    // Update Session to COMPLETED
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        overallScore: finalScore,
        endedAt: new Date()
      }
    });

    res.json({ success: true, finalScore });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;