<<<<<<< HEAD
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import sessionRoutes from "./routes/session.routes";
import practiceRoutes from "./routes/practice.routes";
=======
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import attemptRoutes from './routes/attempts.routes';  

>>>>>>> dd904c4 (frontend practice fix)

// read the env file
dotenv.config();
// create the expres app
const app = express();

// define the port we'll be running on
const PORT = 5000;

// middlewear are fxn that run before the routes
app.use(cors()); // allows the portend to make requests to the backend while they are on diff ports
app.use(express.json()); // parses the json from requests body›

// register the auth routes give them all a starting name
// sign up url will be /api/auth/signup
<<<<<<< HEAD
app.use("/api/auth", authRoutes);

// register session routes
// all session routes will be prefixed with /api/session
app.use("/api/session", sessionRoutes);

// register practice routes
app.use("/api/practice", practiceRoutes);
=======
app.use('/api/auth', authRoutes)
app.use('/api/attempts', attemptRoutes); 

>>>>>>> dd904c4 (frontend practice fix)

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
