/*
What if get invalid data
what if email already exists
How to safely store pw 
and what do we send back to the user????

hash the password so if the app is hacked they cannot see the real password
JWT gives each user a unique token for their account that lets us know if they're logged in
{
  userId: "abc123",
  email: "prince@umbc.edu",
  exp: 1234567890  // Expiration date
}
*/

import { prisma } from "../db_connection"; // Import prisma client
import bcrypt from "bcryptjs"; // For hashing passwords
import jwt from "jsonwebtoken"; // For creating tokens

const JWT_SECRET = process.env.JWT_SECRET;

// create the sign up function
export async function signup(email: string, password: string, name: string) {
  // check if email, password, name exist
  if (!email || !password || !name) {
    throw new Error("Please fill out all fields.");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  // If password is too short, throw error
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  // check if someone with this email is already in the database
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser != null) {
    throw new Error(
      "An account with this email already exists. Please log in instead."
    );
  }

  // hash the password for security so that it's secure if someone hacks in
  const hashedPW = await bcrypt.hash(password, 10);
  // print hashed password so we know it worked
  console.log(hashedPW);

  // create the user and store the hashed password in the database, it comes with an id already we don't needa create
  const user = await prisma.user.create({
    data: {
      // What fields to save
      email: email,
      name: name,
      passwordHash: hashedPW,
    },
  });

  // create JWT the sign method create a token in contains the payload which is the user data
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET!, // the exclamation point is a promise that this exists
    {
      expiresIn: "7d",
    }
  );
  // print out the token generated in console so we can see it
  console.log("JWT token is ", token);

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

/*
common methods

const text = "Hello World";

// Length
text.length                    // 11

// Check if empty
text === ""                    // false
!text                          // false

// Check if contains something
text.includes("World")         // true
text.includes("@")             // false

// Convert to lowercase
text.toLowerCase()             // "hello world"

// Convert to uppercase
text.toUpperCase()             // "HELLO WORLD"

// Trim whitespace
"  hello  ".trim()            // "hello"

// Split into array
text.split(" ")               // ["Hello", "World"]
*/

export async function login(email: string, password: string) {
  // all boxes are filled
  if (!email || !password) {
    throw new Error("Please enter both email and password.");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  // find user and check if the user exists
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

  // verify the user password
  const validPW = await bcrypt.compare(password, user.passwordHash);

  if (!validPW) {
    throw new Error("Invalid email or password. Please try again.");
  }

  // generate the token
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
  // Validate new password
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

  // If user has a password (not OAuth-only), verify current password
  if (user.passwordHash) {
    if (!currentPassword) {
      throw new Error("Current password is required.");
    }
    const validPW = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPW) {
      throw new Error("Current password is incorrect.");
    }
  }

  // Hash the new password
  const hashedPW = await bcrypt.hash(newPassword, 10);

  // Update the password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPW },
  });

  return { message: "Password updated successfully." };
}
