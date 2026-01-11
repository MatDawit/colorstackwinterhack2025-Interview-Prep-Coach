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

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { interviewType, difficulty } = req.body;

    // 1. Close old sessions
    await prisma.session.updateMany({
      where: { userId: userId, status: "IN_PROGRESS" },
      data: { status: "ABANDONED", endedAt: new Date() },
    });

    // 2. Create new Session
    const session = await prisma.session.create({
      data: {
        userId,
        interviewType: interviewType || "Software Engineering",
        difficulty: difficulty || "Basic",
        status: "IN_PROGRESS",
      },
    });

    // 3. Prepare First Question Logic
    // Base Filter: Allow specific role OR "General"
    const roleFilter = { in: [interviewType, "General"] };

    let whereCondition: any = {
      role: roleFilter,
      difficulty: difficulty || "Basic",
    };

    // --- NEW LOGIC: Apply "Focus" Preferences to First Question ---
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
        // We found matches! Use the strict filter
        whereCondition = strictCondition;
      } else {
        // 0 matches. Fallback to default (Ignore focus)
        console.warn(
          "First question preference fallback: No strict matches found."
        );
      }
    }
    // -------------------------------------------------------------

    // 4. Select the Question
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

// POST /api/session/end
// Usage: Called when user finishes the interview
router.post("/end", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

    // 1. Get ALL attempts for this session (score + questionId)
    const attempts = await prisma.sessionAttempt.findMany({
      where: { sessionId: sessionId },
      select: { questionId: true, score: true, duration: true },
    });

    if (attempts.length === 0) {
      return res.json({ success: true, finalScore: 0 });
    }

    // 2. LOGIC: Best Answer wins
    // We use a Map to store the max score for each unique question
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

    // 3. Calculate Average of the BEST scores
    let totalScore = 0;
    bestScores.forEach((score) => {
      totalScore += score;
    });

    // Avoid division by zero
    const finalScore =
      bestScores.size > 0 ? Math.round(totalScore / bestScores.size) : 0;

    // 4. Update Session Status
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

// GET /api/session/stats
// Usage: Get user's session statistics for dashboard
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // 1. VERIFY TOKEN & GET USER ID
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

    // 2. GET ALL COMPLETED SESSIONS WITH SCORES
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

    // 3. CALCULATE STATS
    const totalSessions = sessions.length;

    let averageScore = 0;
    if (totalSessions > 0) {
      const totalScore = sessions.reduce(
        (sum, session) => sum + (session.overallScore || 0),
        0
      );
      averageScore = Math.round(totalScore / totalSessions);
    }

    // 4. RETURN RESULTS
    res.json({
      averageScore,
      totalSessions,
    });
  } catch (error: any) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/session/:id/attempts
// Usage: Get all attempts for a specific session (For the Session Review page)
router.get("/:id/attempts", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Fetch ALL attempts (including retries)
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

    // 2. Filter: Keep only the BEST attempt per Question ID
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

    // 3. Convert Map back to Array
    // We sort by createdAt so they appear in the order the user *finally* answered them
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
