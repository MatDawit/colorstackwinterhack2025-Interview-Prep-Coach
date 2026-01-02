import { Router, Request, Response } from "express";
import { prisma } from "../db_connection";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/session/start
// Usage: Called when user clicks "Start Interview"
router.post("/start", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let userId: string;

    // 2. VERIFY TOKEN & GET USER ID
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { interviewType } = req.body;

    // 3. Close any old "IN_PROGRESS" sessions to keep DB clean
    await prisma.session.updateMany({
      where: { userId: userId, status: "IN_PROGRESS" },
      data: { status: "ABANDONED", endedAt: new Date() },
    });

    // 4. Create the new Session
    const session = await prisma.session.create({
      data: {
        userId,
        interviewType: interviewType || "General",
        status: "IN_PROGRESS",
      },
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

    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    // Calculate average score
    const aggregate = await prisma.sessionAttempt.aggregate({
      where: { sessionId: sessionId },
      _avg: { score: true },
    });

    const finalScore = aggregate._avg.score || 0;

    // Update Session to COMPLETED
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        overallScore: finalScore,
        endedAt: new Date(),
      },
    });

    return res.json({ success: true, finalScore });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
