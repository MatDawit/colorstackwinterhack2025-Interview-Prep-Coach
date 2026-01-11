import { Router } from "express"
import { Request } from "express"
import { Response } from "express"
import { login, signup } from '../services/auth.service'
import bcrypt from 'bcrypt'
import passport from "passport"
import jwt from "jsonwebtoken";
import { prisma } from "../db_connection";
// create the router
// this is where i'll add new endpoints
const router  = Router()
const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
function getUserIdFromAuthHeader(req: Request): string {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No token provided");
  }
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
  if (!decoded.userId) throw new Error("Unauthorized: Invalid token");
  return decoded.userId;
}

// routers accept requests from the front end and then extract data from those requests, calls fxns and then sends response back to the frontend
// create abn endpoint that accepts post requests and (r.post)
router.post('/signup', async (req: Request, res: Response) => {
    // Erroe handling practice
    try 
    {
        //req and res contain request and response objects from the frontend 
        
        // extract the data from the requests body
        const { email, password, name } = req.body
        // call signuop fxn using the variables from the requests body
        const result = await signup(email, password, name) // result has a token
        // code 201 means success and json result makw result a json and sends it back
        res.status(201).json(result)
    } catch (error:any) // if there is any error thrown from the signuo function
    {
        // print out the rror message thrown and a 400 code which means error in HTTP
        res.status(400).json({error: error.message})
    }
    

})

router.post('/login', async (req: Request, res: Response) => {
    // Erroe handling practice
    try 
    {
        //req and res contain request and response objects from the frontend 
        
        // extract the data from the requests body
        const { email, password } = req.body
        // call signuop fxn using the variables from the requests body
        const result = await login(email, password) // result has a token
        // code 201 means success and json result makw result a json and sends it back
        res.status(201).json(result)
    } catch (error:any) // if there is any error thrown from the signuo function
    {
        // print out the rror message thrown and a 400 code which means error in HTTP
        res.status(400).json({error: error.message})
    }
    

})

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    // passport puts your Prisma user on req.user
    const user = req.user as any;

    // Issue YOUR JWT (same style you already do on normal login)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect to frontend callback page with token
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

//github auth
router.get(
    "/github",
    passport.authenticate("github", {
      scope: ["user:email"],
      session: false,
    })
  );

//github callback
router.get(
    "/github/callback",
    passport.authenticate("github", {
        session: false,
    }),
    (req, res) => {
        // passport puts your Prisma user on req.user
        const user = req.user as any;

        // Issue YOUR JWT (same style you already do on normal login)
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Redirect to frontend callback page with token
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    }
);

// PATCH /api/auth/password
router.patch("/password", async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromAuthHeader(req);

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // If user already has a password, require currentPassword
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required." });
      }

      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashed },
    });

    return res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(401).json({ error: e.message || "Unauthorized" });
  }
});
// export the router
export default router