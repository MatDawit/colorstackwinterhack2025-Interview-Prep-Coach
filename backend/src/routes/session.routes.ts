/**
 * Session routes
 * Manages session lifecycle: start, end, stats, and attempts listing.
 */
import { Router, Request, Response } from "express";
import { prisma } from "../db_connection";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * POST /start
 * @summary Start a new interview session for the authenticated user
 * @description
 * Creates a new session, closes any in-progress sessions for the user,
 * applies focus preferences if available, and selects the first question.
 */
router.post("/start", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { interviewType, difficulty } = req.body;

    // Close any prior in-progress sessions
    await prisma.session.updateMany({
      where: { userId: userId, status: "IN_PROGRESS" },
      data: { status: "ABANDONED", endedAt: new Date() },
    });

    // Create new session
    const session = await prisma.session.create({
      data: {
        userId,
        interviewType: interviewType || "Software Engineering",
        difficulty: difficulty || "Basic",
        status: "IN_PROGRESS",
      },
    });

    // Prepare first question filter (role or General)
    const roleFilter = { in: [interviewType, "General"] };

    let whereCondition: any = {
      role: roleFilter,
      difficulty: difficulty || "Basic",
    };

    // Apply focus preferences when present
    const prefs = await prisma.preferences.findUnique({
      where: { userId: userId },
    });

    let applyFocusFilter = false;
    const allowedFocuses: string[] = [];

    if (prefs) {
      if (prefs.focusBehavioral) allowedFocuses.push("Behavioral");
      if (prefs.focusTechnical) allowedFocuses.push("Technical");
      if (prefs.focusSystemDesign) allowedFocuses.push("System Design");

      if (allowedFocuses.length > 0) {
        applyFocusFilter = true;
      }
    }

    // Try to apply strict focus filter
    if (applyFocusFilter) {
      const strictCondition = {
        ...whereCondition,
        focus: { in: allowedFocuses },
      };

      const count = await prisma.question.count({ where: strictCondition });

      if (count > 0) {
        // Use strict filter when matches found
        whereCondition = strictCondition;
      } else {
        // Fallback to default (ignore focus)
        console.warn(
          "First question preference fallback: No strict matches found."
        );
      }
    }

    // Select the question
    const count = await prisma.question.count({ where: whereCondition });

    if (count > 0) {
      const skip = Math.floor(Math.random() * count);
      const firstQuestion = await prisma.question.findFirst({
        where: whereCondition,
        skip: skip,
      });

      if (firstQuestion) {
        await prisma.session.update({
          where: { id: session.id },
          data: { currentQuestionId: firstQuestion.id },
        });
      }
    }

    console.log("New Session Started:", session.id);
    res.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /end
 * @summary End a session and calculate the final score
 * @description
 * Aggregates all attempts for the session, calculates the best score per question,
 * computes total duration, and updates the session as COMPLETED.
 */
router.post("/end", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    // Get all attempts for this session
    const attempts = await prisma.sessionAttempt.findMany({
      where: { sessionId: sessionId },
      select: { questionId: true, score: true, duration: true },
    });

    if (attempts.length === 0) {
      return res.json({ success: true, finalScore: 0 });
    }

    // Best answer wins per question
    const bestScores = new Map<string, number>();

    let totalSessionDuration = 0;

    attempts.forEach((attempt) => {
      totalSessionDuration += attempt.duration || 0;
      const currentMax = bestScores.get(attempt.questionId) || 0;
      // If this attempt is better than what we have saved, update it
      if ((attempt.score || 0) > currentMax) {
        bestScores.set(attempt.questionId, attempt.score || 0);
      }
    });

    // Calculate average of best scores
    let totalScore = 0;
    bestScores.forEach((score) => {
      totalScore += score;
    });

    // Avoid division by zero
    const finalScore =
      bestScores.size > 0 ? Math.round(totalScore / bestScores.size) : 0;

    // Update session status
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        overallScore: finalScore,
        totalDuration: totalSessionDuration,
        endedAt: new Date(),
      },
    });

    return res.json({ success: true, finalScore });
  } catch (error: any) {
    console.error("Error ending session:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stats
 * @summary Fetch session statistics for the authenticated user
 * @description
 * Returns the total number of completed sessions and the average score across all completed sessions.
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // Verify token and get user id
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Get completed sessions with scores
    const sessions = await prisma.session.findMany({
      where: {
        userId: userId,
        status: "COMPLETED",
        overallScore: {
          not: null,
        },
      },
      select: {
        overallScore: true,
      },
    });

    // Calculate stats
    const totalSessions = sessions.length;

    let averageScore = 0;
    if (totalSessions > 0) {
      const totalScore = sessions.reduce(
        (sum, session) => sum + (session.overallScore || 0),
        0
      );
      averageScore = Math.round(totalScore / totalSessions);
    }

    // Return results
    res.json({
      averageScore,
      totalSessions,
    });
  } catch (error: any) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /:id/attempts
 * @summary List attempts for a given session
 * @description
 * Returns all attempts for the session, selecting only the best attempt per question.
 * Tie-breakers favor the most recent attempt if scores are equal.
 */
router.get("/:id/attempts", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch all attempts (including retries)
    const allAttempts = await prisma.sessionAttempt.findMany({
      where: { sessionId: id },
      include: {
        question: {
          select: {
            question: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Keep only the best attempt per Question ID
    const bestAttemptsMap = new Map<string, (typeof allAttempts)[0]>();

    for (const attempt of allAttempts) {
      const existing = bestAttemptsMap.get(attempt.questionId);

      if (!existing) {
        // If first time seeing this question, add it
        bestAttemptsMap.set(attempt.questionId, attempt);
      } else {
        // If we already have an attempt for this question, compare them
        const existingScore = existing.score || 0;
        const newScore = attempt.score || 0;

        if (newScore > existingScore) {
          // Rule 1: Higher Score Wins
          bestAttemptsMap.set(attempt.questionId, attempt);
        } else if (newScore === existingScore) {
          // Rule 2: Tie-breaker -> Most Recent Wins
          if (new Date(attempt.createdAt) > new Date(existing.createdAt)) {
            bestAttemptsMap.set(attempt.questionId, attempt);
          }
        }
      }
    }

    // Convert Map back to sorted array
    const uniqueAttempts = Array.from(bestAttemptsMap.values()).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    res.json({ attempts: uniqueAttempts });
  } catch (error: any) {
    console.error("Error fetching session attempts:", error);
    res.status(500).json({ error: error.message });
  }
});
export default router;
