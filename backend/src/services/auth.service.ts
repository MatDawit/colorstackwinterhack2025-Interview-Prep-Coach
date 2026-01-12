/**
 * Authentication service
 * Provides `signup`, `login`, and `updatePassword` helpers using Prisma, bcrypt, and JWT.
 */

import { prisma } from "../db_connection"; // Import prisma client
import bcrypt from "bcryptjs"; // For hashing passwords
import jwt from "jsonwebtoken"; // For creating tokens

const JWT_SECRET = process.env.JWT_SECRET;

export async function signup(email: string, password: string, name: string) {
  /**
   * Register a new user and issue a JWT.
   * - Validates inputs and email format
   * - Hashes password with bcrypt
   * - Creates user in the database
   * - Returns `{ token, user }`
   */
  if (!email || !password || !name) {
    throw new Error("Please fill out all fields.");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser != null) {
    throw new Error(
      "An account with this email already exists. Please log in instead."
    );
  }

  const hashedPW = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: email,
      name: name,
      passwordHash: hashedPW,
    },
  });

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  // return user info and email to the frontend
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function login(email: string, password: string) {
  /**
   * Authenticate user and issue a JWT.
   * - Validates email format
   * - Verifies password with bcrypt
   * - Returns `{ token, user }`
   */
  if (!email || !password) {
    throw new Error("Please enter both email and password.");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password. Please try again.");
  }

  // Check if user has a password (not OAuth-only account)
  if (!user.passwordHash) {
    throw new Error("Invalid email or password. Please try again.");
  }

  const validPW = await bcrypt.compare(password, user.passwordHash);

  if (!validPW) {
    throw new Error("Invalid email or password. Please try again.");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET!,
    { expiresIn: "7d" }
  );

  // return token and user info
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function updatePassword(
  userId: string,
  currentPassword: string | undefined,
  newPassword: string
) {
  /**
   * Update user's password (supports accounts created with OAuth).
   * - If `passwordHash` exists, verifies `currentPassword`
   * - Hashes and stores `newPassword`
   */
  if (!newPassword || newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  // Get the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      throw new Error("Current password is required.");
    }
    const validPW = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPW) {
      throw new Error("Current password is incorrect.");
    }
  }

  const hashedPW = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPW },
  });

  return { message: "Password updated successfully." };
}
