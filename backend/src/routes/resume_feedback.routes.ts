import express from "express";
import { requireAuth } from "../services/auth.middleware";
import { generateResumeFeedback } from "../services/resume_feedback.service";

const router = express.Router();

// POST /api/resume/feedback - Generate AI feedback on parsed resume
router.post("/feedback", requireAuth, async (req, res) => {
  try {
    console.log("Feedback route hit");
    console.log("User:", req.authenticatedUser);
    console.log("Body:", req.body);

    const userId = req.authenticatedUser!.id;
    const { parsedResume } = req.body;

    if (!parsedResume) {
      return res.status(400).json({ error: "Parsed resume data required" });
    }

    const feedback = await generateResumeFeedback(parsedResume);
    
    res.json({ feedback });
  } catch (error) {
    console.error("Error generating resume feedback:", error);
    res.status(500).json({ error: "Failed to generate feedback" });
  }
});

export default router;