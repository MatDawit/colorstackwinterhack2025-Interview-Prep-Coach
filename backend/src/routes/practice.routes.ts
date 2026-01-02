import { Router, Request, Response } from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../db_connection";
import fs from "fs/promises";

const router = Router();
const upload = multer({ dest: "uploads/" });
const generation_ai = new GoogleGenAI({
  apiKey: process.env.MATT_GEMINI_API_KEY,
});
const transcription_ai = new GoogleGenAI({
  apiKey: process.env.FAD_GEMINI_API_KEY,
});

const sysInstruction = `
You are an expert Technical Interview Coach and Behavior Advisor specialized in preparing candidates for engineering and technical roles at top-tier technology companies (like Google, Meta, Amazon, etc.).

**YOUR OBJECTIVE:**
Rigorously review user responses to behavioral interview questions based on the STAR method. Your goal is to move the candidate from vague, "we"-focused answers to specific, "I"-focused, data-driven narratives that demonstrate technical competence and leadership.

**CORE PHILOSOPHY:**
1.  **Past Behavior Predicts Future Results:** Focus on specific past examples, not hypothetical ("I would do...") statements.
2.  **Ownership ("I" vs. "We"):** Candidates must use "I" statements to isolate their specific contributions. "We" statements dilute the candidate's impact.
3.  **Truthfulness:** Detect potential fabrication or disingenuous answers.
4.  **Relevance:** The skills demonstrated must match technical job descriptions (e.g., coding, system design, leadership, debugging, conflict resolution).

**THE STAR METHOD STANDARD:**
Evaluate the response structure against these weightings:
* **Situation (20%):** Context only. No unnecessary fluff.
* **Task (10%):** The specific goal or responsibility.
* **Action (60%):** The core of the answer. What the candidate personally did (technical steps, conversations, decisions).
* **Result (10%):** Quantifiable outcomes, impact, and lessons learned.

**OUTPUT FORMAT:**
You must respond with a SINGLE JSON object. Do not include markdown formatting (like \`\`\`json) or conversational text outside the JSON object.

**JSON SCHEMA INSTRUCTIONS:**

1.  **\`score\` (Integer 0-100):**
    * Deduct points for: Generalizations, lack of "I" statements, missing technical details, rambling, or failing the STAR distribution (e.g., spending 50% of the time on Situation).
    * Add points for: Metrics in results, clear emotional intelligence, specific technical stacks mentioned, conciseness.

2.  **\`checklist\` (Object with Boolean values):**
    * \`specific_examples_provided\`: (True if a specific story is told; False if hypothetical).
    * \`no_negative_language_detected\`: (True if the language is confident and professional; False if the user says "Sorry," "I'm bad at," or uses self-deprecating language).
    * \`no_filler_words_detected\`: (True if the speech is clean; False if "um," "like," "you know" are frequent).
    * \`technical_detail_present\`: (True if specific tools, languages, or methodologies are named).
    * \`appropriate_length\`: (True if the answer fits the STAR percentage balance AND is not excessively long/rambling. False if the 'Action' section is too short or the 'Situation' is too long).

3.  **\`analysis_highlighting\` (String):**
    * Provide a narrative analysis of the answer.
    * You MUST wrap text in <green>...</green> tags for excellent parts (strong "I" statements, specific metrics, good technical usage).
    * You MUST wrap text in <red>...</red> tags for weak parts (vague "we" statements, fluff, irrelevance, negativity, missing context).

4.  **\`actionable_feedback\` (String):**
    * Provide specific steps to improve the answer based on the STAR sections. (e.g., "Cut the Situation down; it's 40% of your answer. Expand the Action section to include *how* you debugged the code.")

5.  **\`improved_version\` (String):**
    * Rewrite the user's answer into a perfect STAR-formatted response.
    * Invent plausible but specific details if the user was vague (in brackets) to show them what "good" looks like.
    * Ensure the Action section is the bulk of the response.

**EXAMPLE JSON STRUCTURE:**
{
  "score": 75,
  "checklist": {
    "specific_examples_provided": true,
    "apologizing_negative_language_detected": false,
    "no_filler_words_detected": true,
    "technical_detail_present": true,
    "appropriate_length": false
  },
  "analysis_highlighting": "You set the context well, but <red>you spent too long describing the history of the project</red>. However, your description of <green>migrating the database using a custom script</green> was excellent.",
  "actionable_feedback": "Your Situation was 40% of the answer. Reduce the project history to one sentence. Focus more on the specific SQL commands you used.",
  "improved_version": "Situation: The legacy database was causing 500ms latency... Task: My goal was to migrate to PostgreSQL with zero downtime... Action: I wrote a Python script to... Result: Latency dropped by 40%..."
}
`;

router.post(
  "/submit",
  upload.single("audio"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. GET DATA
      // We strictly need sessionId now!
      const { sessionId, questionId, question, mode, answerText } = req.body;

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
          systemInstruction: sysInstruction,
          responseMimeType: "application/json",
        },
        contents: [
          { text: `Question: ${question}\nAnswer: ${finalAnswerText}` },
        ],
      });

      let rawText = analysis.text || "{}";

      // 1. Remove Markdown code blocks (```json ... ```)
      rawText = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // 2. Parse safely
      let aiData;
      try {
        aiData = JSON.parse(rawText);
      } catch (parseError) {
        console.error("JSON Parse Failed. Raw Text from AI:", rawText);
        // Fallback or re-throw depending on preference
        throw new Error("AI returned invalid JSON format. Please try again.");
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

          // Save Scores
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

    // OPTIONAL: Limit to 4 questions per session
    if (existingAttempts.length >= 4) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", endedAt: new Date() },
      });
      res.json({ ok: false, message: "Session completed" });
      return;
    }

    // 2. Find a random question NOT already attempted
    const attemptedIds = existingAttempts.map((a) => a.questionId);

    const unattemptedCount = await prisma.question.count({
      where: { id: { notIn: attemptedIds } },
    });

    if (unattemptedCount === 0) {
      res.status(404).json({ error: "No more questions available." });
      return;
    }

    // 3. Pick a random offset
    const skip = Math.floor(Math.random() * unattemptedCount);
    const nextQuestions = await prisma.question.findMany({
      where: { id: { notIn: attemptedIds } },
      take: 1,
      skip: skip,
    });

    const nextQuestion = nextQuestions[0];

    // 4. Update the Session with the new "Bookmark"
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

// GET /api/practice/attempt/:id
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

      // 2. NEW LOGIC: Count total attempts in this session so far
      // This tells us if this is question #1, #2, #3, or #4
      const attemptCount = await prisma.sessionAttempt.count({
        where: { sessionId: attempt.sessionId },
      });

      // 3. Send the calculated fields to the frontend
      res.json({
        ...attempt,
        attemptCount: attemptCount, // "Question X..."
        isLastQuestion: attemptCount >= 4, // "... of 4" (Triggers Green Button)
      });
    } catch (error: any) {
      console.error("Error fetching attempt:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
