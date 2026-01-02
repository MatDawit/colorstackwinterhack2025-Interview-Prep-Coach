import { Router, Request, Response } from "express";
import { prisma } from "../db_connection";

const router = Router();

// GET /api/questions
// Replaces the frontend file reading logic with a Database Query
router.get("/", async (req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany();
    
    // Return in the format the frontend expects: { questions: [...] }
    res.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

export default router;