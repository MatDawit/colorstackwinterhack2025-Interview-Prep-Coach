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

    // 1. Check if the session is already completed or full
    const existingAttempts = await prisma.sessionAttempt.findMany({
      where: { sessionId: sessionId },
      select: { questionId: true },
    });

    // 2. Get UNIQUE questions answered so far
    const uniqueQuestionIds = new Set(
      existingAttempts.map((a) => a.questionId)
    );

    // 3. Check limit based on UNIQUE questions
    if (uniqueQuestionIds.size >= 4) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", endedAt: new Date() },
      });
      res.json({ ok: false, message: "Session completed" });
      return;
    }

    // 4. Filter out questions we've already done
    const attemptedIds = Array.from(uniqueQuestionIds);

    const unattemptedCount = await prisma.question.count({
      where: { id: { notIn: attemptedIds } },
    });

    if (unattemptedCount === 0) {
      res.status(404).json({ error: "No more questions available." });
      return;
    }

    // 5. Pick random next question
    const skip = Math.floor(Math.random() * unattemptedCount);
    const nextQuestions = await prisma.question.findMany({
      where: { id: { notIn: attemptedIds } },
      take: 1,
      skip: skip,
    });

    const nextQuestion = nextQuestions[0];

    // 6. Update Session Bookmark
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        currentQuestionId: nextQuestion.id,
      },
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
