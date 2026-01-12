/**
 * Questions routes
 * Serves interview questions from the database.
 */
import { Router, Request, Response } from "express";
import { prisma } from "../db_connection";

const router = Router();

/**
 * GET /
 * @summary Fetch interview questions
 * @description
 * Returns all interview questions stored in the database.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany();

    // Return in the format the frontend expects: { questions: [...] }
    res.json({ questions });
    return;
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
    return;
  }
});

export default router;
