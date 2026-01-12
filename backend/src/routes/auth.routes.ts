/**
 * Auth routes
 * Handles signup, login, OAuth callbacks, and password updates.
 */
import { Router } from "express";
import { Request } from "express";
import { Response } from "express";
import { login, signup, updatePassword } from "../services/auth.service";
import passport from "passport";
import jwt from "jsonwebtoken";
import { authenticateJWT } from "../services/auth.middleware";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * POST /signup
 * @summary Register a new user
 * @description
 * Creates a new user account using email, password, and name credentials.
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await signup(email, password, name);
    res.status(201).json(result);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    return;
  }
});
/**
 * POST /login
 * @summary Authenticate an existing user
 * @description
 * Validates user credentials and returns a signed JWT on success.
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
        const { email, password, rememberMe } = req.body
        const result = await login(email, password, !!rememberMe) // result has a token
        res.status(200).json(result)
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    return;
  }
});
/**
 * GET /google
 * @summary Initiate Google OAuth authentication
 * @description
 * Redirects the user to Google’s OAuth consent screen.
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * GET /google/callback
 * @summary Handle Google OAuth callback
 * @description
 * Exchanges Google OAuth credentials for a JWT and redirects to the frontend.
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

/**
 * GET /github
 * @summary Initiate GitHub OAuth authentication
 * @description
 * Redirects the user to GitHub’s OAuth consent screen.
 */
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

/**
 * GET /github/callback
 * @summary Handle GitHub OAuth callback
 * @description
 * Exchanges GitHub OAuth credentials for a JWT and redirects to the frontend.
 */
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

/**
 * PATCH /password
 * @summary Update authenticated user password
 * @description
 * Updates the user’s password after validating the current password.
 */
router.patch(
  "/password",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authenticatedUser.id;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword) {
        res.status(400).json({ error: "New password is required." });
        return;
      }

      const result = await updatePassword(userId, currentPassword, newPassword);
      res.status(200).json(result);
      return;
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
  }
);

// export the router
export default router;
