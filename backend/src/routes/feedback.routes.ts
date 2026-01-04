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
      // 1. GET DATA
      // We strictly need sessionId now!
      const { sessionId, questionId, question, mode, answerText, duration } =
        req.body;

      if (!sessionId) {
        res.status(400).json({ error: "Missing sessionId" });
        return;
      }

      let finalAnswerText = "";
      let audioUrlPath = null;

      // 2. HANDLE AUDIO / TEXT (Same logic as before)
      if (mode === "record" && req.file) {
        const filePath = req.file.path;
        const fileBuffer = await fs.readFile(filePath);
        const base64Audio = fileBuffer.toString("base64");

        const transResult = await transcription_ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: [
            { text: "Transcribe verbatim." },
            { inlineData: { mimeType: "audio/webm", data: base64Audio } },
          ],
        });
        finalAnswerText = (transResult.text ?? "").trim();

        // Save file permanently
        const fileName = `${req.file.filename}.webm`;
        audioUrlPath = `/uploads/${fileName}`;
        // (Optional: Rename req.file.path to uploads/fileName here if needed)
      } else {
        finalAnswerText = answerText || "";
      }

      // 3. AI ANALYSIS
      const analysis = await generation_ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        config: {
          systemInstruction: FEEDBACK_PROMPT,
          responseMimeType: "application/json",
        },
        contents: [
          { text: `Question: ${question}\nAnswer: ${finalAnswerText}` },
        ],
      });

      let aiData;
      const rawText = analysis.text || "{}";

      try {
        const cleanedJson = jsonrepair(rawText);
        aiData = JSON.parse(cleanedJson);
      } catch (error) {
        console.error("JSON PARSE FAILED. Raw Text:", rawText);

        // LAYER 4: Safe Fallback Data
        aiData = {
          score: 0,
          checklist: {
            specific_examples_provided: false,
            no_negative_language_detected: false,
            no_filler_words_detected: false,
            technical_detail_present: false,
            appropriate_length: false,
          },
          // Return the raw text as "feedback" so the user can at least see what happened
          feedback: `We encountered an error processing the detailed analysis, but here is the raw output: <br><br> ${rawText.replace(
            /\n/g,
            "<br>"
          )}`,
          improved_version: "N/A",
          actionable_feedback:
            "Please retry this question. The AI response format was invalid.",
          isLastQuestion: false,
        };
      }

      // 4. SAVE TO DB (The "Saving Logic")

      // Ensure Question Exists
      await prisma.question.upsert({
        where: { id: questionId },
        update: {},
        create: {
          id: questionId,
          question: question || "Unknown",
          category: "General",
          sampleAnswers: [],
        },
      });

      // Create the SessionAttempt
      const attempt = await prisma.sessionAttempt.create({
        data: {
          sessionId: sessionId,
          questionId: questionId,
          transcription: finalAnswerText,
          audioUrl: audioUrlPath,
          duration: parseInt(duration) || 0,
          score: aiData.score,
          feedback: aiData.analysis_highlighting,
          improvedVersion: aiData.improved_version,
          actionableFeedback: aiData.actionable_feedback,
          checklist: aiData.checklist,
        },
      });

      console.log("Attempt Saved:", attempt.id);

      // 5. RETURN ID (So frontend can redirect to Feedback page)
      res.json({
        ok: true,
        attemptId: attempt.id,
        analysis: aiData,
      });
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
