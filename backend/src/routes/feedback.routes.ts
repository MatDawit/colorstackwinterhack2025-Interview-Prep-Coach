import { Router, Request, Response } from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../db_connection";
import { FEEDBACK_PROMPT } from "../config/prompts";
import { jsonrepair } from "jsonrepair";
import fs from "fs/promises";

const router = Router();
const upload = multer({ dest: "uploads/" });
const generation_ai = new GoogleGenAI({
  apiKey: process.env.MATT_GEMINI_API_KEY,
});
const transcription_ai = new GoogleGenAI({
  apiKey: process.env.FAD_GEMINI_API_KEY,
});

// POST /api/feedback/submit
// Handles Transcription + AI Analysis + Saving
router.post(
  "/submit",
  upload.single("audio"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, questionId, mode, answerText, duration } = req.body;

      // 1. Validation
      if (!sessionId || !questionId) {
        res.status(400).json({ error: "Missing sessionId or questionId" });
        return;
      }

      // 2. Fetch Trusted Question
      const questionRecord = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!questionRecord) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      // 3. Handle Audio (Transcription)
      let finalAnswerText = answerText || "";
      let audioUrlPath = null;

      if (mode === "record" && req.file) {
        const fileBuffer = await fs.readFile(req.file.path);
        const base64Audio = fileBuffer.toString("base64");

        const transResult = await transcription_ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: [
            {
              role: "user",
              parts: [
                { text: "Transcribe verbatim." },
                { inlineData: { mimeType: "audio/webm", data: base64Audio } },
              ],
            },
          ],
        });

        // SIMPLIFIED: Just call .text()
        // The ? handles cases where the model refuses to answer (safety)
        finalAnswerText = transResult.text || "";
        finalAnswerText = finalAnswerText.trim();

        audioUrlPath = `/uploads/${req.file.filename}.webm`;
      }

      // 4. Generate AI Feedback
      const analysis = await generation_ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        config: {
          systemInstruction: FEEDBACK_PROMPT,
          responseMimeType: "application/json",
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Question: ${questionRecord.question}\nAnswer: ${finalAnswerText}`,
              },
            ],
          },
        ],
      });

      // 5. Parse AI Response
      // SIMPLIFIED: Just call .text()
      const rawText = analysis.text || "{}";

      let aiData;
      try {
        aiData = JSON.parse(jsonrepair(rawText));
      } catch (error) {
        console.error("JSON Parse Error:", rawText);
        aiData = {
          score: 0,
          checklist: {},
          feedback: "AI response format error. Please try again.",
        };
      }

      // 6. Save to DB
      const attempt = await prisma.sessionAttempt.create({
        data: {
          sessionId,
          questionId,
          transcription: finalAnswerText,
          audioUrl: audioUrlPath,
          duration: parseInt(duration) || 0,
          score: aiData.score,
          feedback: aiData.analysis_highlighting || aiData.feedback,
          improvedVersion: aiData.improved_version,
          actionableFeedback: aiData.actionable_feedback,
          checklist: aiData.checklist,
        },
      });

      res.json({ ok: true, attemptId: attempt.id, analysis: aiData });
    } catch (error: any) {
      console.error("Submit Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/feedback/attempt/:id
// Retrieves the results for a specific attempt AND checks if it's the last one
router.get(
  "/attempt/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // 1. Fetch the specific attempt
      const attempt = await prisma.sessionAttempt.findUnique({
        where: { id: id },
        include: {
          question: true,
        },
      });

      if (!attempt) {
        res.status(404).json({ error: "Attempt not found" });
        return;
      }

      // 2. Count total attempts in this session so far
      // This tells us if this is question #1, #2, #3, or #4
      const allAttempts = await prisma.sessionAttempt.findMany({
        where: { sessionId: attempt.sessionId },
        orderBy: { createdAt: "asc" },
        select: { questionId: true },
      });

      // 3. Extract UNIQUE question IDs in order of appearance
      //    Example: [Q1, Q1, Q2, Q2, Q2] -> becomes -> [Q1, Q2]
      const uniqueQuestionIds = Array.from(
        new Set(allAttempts.map((a) => a.questionId))
      );

      // 4. Find which number the current question is
      //    If current question is Q1, index is 0. We add 1 to display "Question 1".
      const questionNumber = uniqueQuestionIds.indexOf(attempt.questionId) + 1;

      res.json({
        ...attempt,
        attemptCount: questionNumber, // Returns 1 (even if you retried Q1 5 times)
        isLastQuestion: questionNumber >= 4, // Only turns true when you reach the 4th UNIQUE question
      });
    } catch (error: any) {
      console.error("Error fetching attempt:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
