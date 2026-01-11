import { Router, Request, Response } from "express";
import { prisma } from "../db_connection";

const router = Router();

// POST /api/practice/next
// Transitions the session to the next random question
router.post("/next", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }

    // 1. Get Session Info AND User ID
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { interviewType: true, difficulty: true, userId: true },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // 2. Check for Max Attempts (Standard Logic)
    const existingAttempts = await prisma.sessionAttempt.findMany({
      where: { sessionId: sessionId },
      select: { questionId: true, score: true, duration: true },
    });

    const uniqueQuestionIds = new Set(
      existingAttempts.map((a) => a.questionId)
    );

    if (uniqueQuestionIds.size >= 4) {
      // Calculate Stats (Unchanged logic)
      let totalSessionDuration = 0;
      existingAttempts.forEach(
        (a) => (totalSessionDuration += a.duration || 0)
      );

      const bestScores = new Map<string, number>();
      existingAttempts.forEach((attempt) => {
        const currentMax = bestScores.get(attempt.questionId) || 0;
        if ((attempt.score || 0) > currentMax) {
          bestScores.set(attempt.questionId, attempt.score || 0);
        }
      });

      let totalScore = 0;
      bestScores.forEach((score) => (totalScore += score));
      const finalScore =
        bestScores.size > 0 ? Math.round(totalScore / bestScores.size) : 0;

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
          overallScore: finalScore,
          totalDuration: totalSessionDuration,
        },
      });
      res.json({ ok: false, message: "Session completed" });
      return;
    }

    // 4. Construct Query Filter
    const attemptedIds = Array.from(uniqueQuestionIds);

    // FIX 1: Role Fallback.
    // Allow questions that match the specific role OR are "General".
    // This prevents empty results if a specific role has no questions yet.
    const roleFilter = { in: [session.interviewType, "General"] };

    let whereCondition: any = {
      id: { notIn: attemptedIds },
      role: roleFilter,
      difficulty: session.difficulty,
    };

    // 4. Apply "Focus" Preferences (Fail-Safe)
    const prefs = await prisma.preferences.findUnique({
      where: { userId: session.userId },
    });

    let applyFocusFilter = false;
    const allowedFocuses: string[] = [];

    if (prefs) {
      // FIX 2: Map preferences to valid Schema strings
      // Ensure these strings ("Behavioral", etc.) match exactly what is in your DB 'focus' column
      if (prefs.focusBehavioral) allowedFocuses.push("Behavioral");
      if (prefs.focusTechnical) allowedFocuses.push("Technical");
      if (prefs.focusSystemDesign) allowedFocuses.push("System Design");

      if (allowedFocuses.length > 0) {
        applyFocusFilter = true;
      }
    }

    if (applyFocusFilter) {
      // FIX 3: Target the 'focus' column (not 'category')
      const strictCondition = {
        ...whereCondition,
        focus: { in: allowedFocuses },
      };

      const count = await prisma.question.count({ where: strictCondition });

      if (count > 0) {
        // We have matching questions! Apply the filter.
        whereCondition = strictCondition;
      } else {
        // FIX 4: Fallback
        // User wanted "Technical" questions but none exist for this Role/Difficulty.
        // We revert to the base query (ignoring focus) so we don't return 404.
        console.warn(
          "Preference filter returned 0 results. Falling back to default pool."
        );
      }
    }

    // 5. Final Fetch
    const unattemptedCount = await prisma.question.count({
      where: whereCondition,
    });

    if (unattemptedCount === 0) {
      res.status(404).json({
        error: `No questions found for Role: ${session.interviewType} (${session.difficulty}).`,
      });
      return;
    }

    const skip = Math.floor(Math.random() * unattemptedCount);
    const nextQuestions = await prisma.question.findMany({
      where: whereCondition,
      take: 1,
      skip: skip,
    });

    const nextQuestion = nextQuestions[0];

    // Update Session
    await prisma.session.update({
      where: { id: sessionId },
      data: { currentQuestionId: nextQuestion.id },
    });

    res.json({ ok: true, nextQuestionId: nextQuestion.id });
  } catch (error: any) {
    console.error("Error generating next question:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/practice/session/:sessionId
// Returns the current state of the session (specifically the current question ID)
router.get(
  "/session/:sessionId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          currentQuestionId: true,
          interviewType: true,
          difficulty: true,
          currentQuestion: {
            select: {
              id: true,
              question: true,
              category: true,
            },
          },
        },
      });

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      res.json(session);
    } catch (error: any) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
