import express from "express";
import cors from "cors";
import dotenv, { config } from "dotenv";
import authRoutes from "./routes/auth.routes";
import sessionRoutes from "./routes/session.routes";
import practiceRoutes from "./routes/practice.routes";
import questionsRouter from "./routes/questions.routes";
import feedbackRouter from "./routes/feedback.routes";
import analyticsRouter from "./routes/analytics.routes";
import profileRouter from "./routes/profile.routes";
import passport from "passport"
import {configurePassport} from "./config/passport"
import path from "path";
import preferencesRouter from "./routes/preferences.routes";

// read the env file
dotenv.config();
// create the express app
const app = express();

// define the port we'll be running on
const PORT = 5000;

configurePassport();
app.use(passport.initialize());

// middleware are fxn that run before the routes
app.use(cors()); // allows the frontend to make requests to the backend while they are on diff ports
app.use(express.json()); // parses the json from requests body

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// register the auth routes give them all a starting name
// sign up url will be /api/auth/signup
app.use("/api/auth", authRoutes);

// register session routes
// all session routes will be prefixed with /api/session
app.use("/api/session", sessionRoutes);

// register practice routes
app.use("/api/practice", practiceRoutes);

// register questions routes
app.use("/api/questions", questionsRouter);

// register feedback routes
app.use("/api/feedback", feedbackRouter);

// register analytics routes
app.use("/api/analytics", analyticsRouter);

// register profile routes
app.use("/api/profile", profileRouter);

app.use("/api/profile/preferences", preferencesRouter);

// check if backend is running
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running!" });
});

// start the server and make it listen on PORT 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Auth endpoints:`);
  console.log(`POST http://localhost:${PORT}/api/auth/signup`);
});
