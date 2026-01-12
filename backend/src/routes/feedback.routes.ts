/**
 * Feedback routes
 * Handles transcription and AI analysis of interview answers and persists attempts.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../db_connection";
import { getFeedbackPrompt } from "../config/prompts";
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

/**
 * POST /submit
 * @summary Submit an interview answer for AI feedback
 * @description
 * Transcribes recorded audio or processes text input, generates AI feedback,
 * and persists the session attempt.
 */
router.post(
  "/submit",
  upload.single("audio"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, questionId, mode, answerText, duration } = req.body;

      // Basic validation
      if (!sessionId || !questionId) {
        res.status(400).json({ error: "Missing sessionId or questionId" });
        return;
      }

      // Fetch question from DB
      const questionRecord = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!questionRecord) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      const sessionData = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      });

      let userPrefs = null;
      if (sessionData) {
        userPrefs = await prisma.preferences.findUnique({
          where: { userId: sessionData.userId },
        });
      }

      // User preference defaults
      const emphasize = (userPrefs?.feedbackEmphasize || "Balance") as
        | "Balance"
        | "Clarity"
        | "Storytelling"
        | "Confidence"
        | "Technical Depth";
      const tone = (userPrefs?.feedbackTone || "Encouraging") as
        | "Encouraging"
        | "Direct"
        | "Strict";
      const detail = (userPrefs?.feedbackDetail || "Standard") as
        | "Brief"
        | "Standard"
        | "Deep";

      // Transcription
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

        finalAnswerText = transResult.text || "";
        finalAnswerText = finalAnswerText.trim();

        audioUrlPath = `/uploads/${req.file.filename}.webm`;
      }

      // Generate AI feedback
      const analysis = await generation_ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        config: {
          systemInstruction: getFeedbackPrompt(emphasize, tone, detail),
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

      // Parse AI response
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

      // Persist attempt
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

/**
 * GET /attempt/:id
 * @summary Fetch a specific session attempt
 * @description
 * Returns the persisted attempt along with question metadata and attempt order.
 */
router.get(
  "/attempt/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Fetch the specific attempt
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

      // Count total attempts in this session so far
      const allAttempts = await prisma.sessionAttempt.findMany({
        where: { sessionId: attempt.sessionId },
        orderBy: { createdAt: "asc" },
        select: { questionId: true },
      });

      // Extract UNIQUE question IDs in order of appearance
      const uniqueQuestionIds = Array.from(
        new Set(allAttempts.map((a) => a.questionId))
      );

      // Resolve the ordinal number of the current question
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
