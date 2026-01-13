/**
 * Express server bootstrap
 * Configures middleware, registers API routes, and starts the HTTP server.
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import sessionRoutes from "./routes/session.routes";
import practiceRoutes from "./routes/practice.routes";
import questionsRouter from "./routes/questions.routes";
import feedbackRouter from "./routes/feedback.routes";
import analyticsRouter from "./routes/analytics.routes";
import profileRouter from "./routes/profile.routes";
import passport from "passport";
import { configurePassport } from "./config/passport";
import path from "path";
import preferencesRouter from "./routes/preferences.routes";
import resumeRoutes from "./routes/resume.routes";
import resumeFeedbackRoutes from "./routes/resume_feedback.routes";

// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

configurePassport();
app.use(passport.initialize());

// Core middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Only allow your Vercel frontend
    credentials: true,
  })
);
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Auth endpoints
app.use("/api/auth", authRoutes);

// Session endpoints
app.use("/api/session", sessionRoutes);

// Practice endpoints
app.use("/api/practice", practiceRoutes);

// Questions endpoints
app.use("/api/questions", questionsRouter);

// Feedback endpoints
app.use("/api/feedback", feedbackRouter);

// Analytics endpoints
app.use("/api/analytics", analyticsRouter);

// Profile endpoints
app.use("/api/profile", profileRouter);

// User preferences
app.use("/api/profile/preferences", preferencesRouter);

// Resume feedback (AI-powered)
app.use("/api/resume", resumeFeedbackRoutes);

// Resume routes (upload/parse) - CHANGE THIS LINE
app.use("/api/profile/resume", resumeRoutes); // Changed from "/api"

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Auth endpoints:`);
  console.log(`POST http://localhost:${PORT}/api/auth/signup`);
});
