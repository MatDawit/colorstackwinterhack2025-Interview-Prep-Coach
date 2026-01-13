import express from "express";
import { requireAuth } from "../services/auth.middleware";
import { generateResumeFeedback } from "../services/resume_feedback.service";

const router = express.Router();

// POST /api/resume/feedback - Generate AI feedback on parsed resume
router.post("/feedback", requireAuth, async (req, res): Promise<void> => {
  try {
    console.log("Feedback route hit");
    console.log("User:", req.authenticatedUser);
    console.log("Body:", req.body);

    const { parsedResume } = req.body;

    if (!parsedResume) {
      res.status(400).json({ error: "Parsed resume data required" });
      return;
    }

    const feedback = await generateResumeFeedback(parsedResume);

    res.json({ feedback });
    return;
  } catch (error) {
    console.error("Error generating resume feedback:", error);
    res.status(500).json({ error: "Failed to generate feedback" });
    return;
  }
});

export default router;
