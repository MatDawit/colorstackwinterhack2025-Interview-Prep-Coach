import { Router, Request, Response } from "express";
import { prisma } from "../db_connection";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// Helper: Format seconds (e.g., 90 -> "01:30")
function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

router.get("/", async (req: Request, res: Response) => {
  try {
    // 1. Auth Check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 2. Fetch ONLY Completed Sessions
    // We include attempts solely for the Checklist Bar Chart logic
    const sessions = await prisma.session.findMany({
      where: {
        userId: userId,
        status: "COMPLETED",
      },
      include: {
        attempts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Stats Aggregation (For the Bar Chart)
    let checklistCounts = {
      fillerWords: 0,
      negativeLanguage: 0,
      noDetail: 0,
      vague: 0,
      badLength: 0,
    };

    // 4. Process Sessions
    const formattedSessions = sessions.map((session) => {
      const finalScore = Math.round(session.overallScore || 0);
      const displayDuration = formatDuration(session.totalDuration || 0);

      // Initialize counts for THIS SPECIFIC session
      let sessionChecklistCounts = {
        fillerWords: 0,
        negativeLanguage: 0,
        noDetail: 0,
        vague: 0,
        badLength: 0,
      };

      session.attempts.forEach((attempt) => {
        const check = attempt.checklist as any;
        if (check) {
          if (check.no_filler_words_detected === false)
            sessionChecklistCounts.fillerWords++;
          if (check.no_negative_language_detected === false)
            sessionChecklistCounts.negativeLanguage++;
          if (check.technical_detail_present === false)
            sessionChecklistCounts.noDetail++;
          if (check.specific_examples_provided === false)
            sessionChecklistCounts.vague++;
          if (check.appropriate_length === false)
            sessionChecklistCounts.badLength++;
        }
      });

      return {
        id: session.id,
        date: session.createdAt,
        category: session.interviewType,
        duration: displayDuration,
        score: finalScore,
        checklistCounts: sessionChecklistCounts,
      };
    });

    res.json({
      sessions: formattedSessions,
    });
  } catch (error: any) {
    console.error("Analytics Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
