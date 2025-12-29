
/*
What if get invalid data
what if email already exists
How to safely store pw 
and what do we send back to the user????

hash the password so if the app is hacked they cannot see the real password
JWT gives each user a unique token for their account that lets us know if they're logged in\
{
  userId: "abc123",
  email: "prince@umbc.edu",
  exp: 1234567890  // Expiration date
}
*/

import { PrismaClient } from '../../generated/prisma';
import bcrypt from 'bcryptjs';  // For hashing passwords
import jwt from 'jsonwebtoken';  // For creating tokens

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET

// create the sign up function
export async function signup(email: string, password: string, name: string){ 
    // STEP 1: VALIDATE

    // Your code here - check if email, password, name exist
    if (!email || !password || !name){
        throw new Error('Fill out all the fields')
    } 
    // If password is too short, throw error
    if (password.length < 6){
        throw new Error('Password must be greater than or equal to 6')
    }
    // check if someone with this email is already in the database 
    const existingUser = await prisma.user.findUnique({where:{email}})

    if (existingUser != null){
        throw new Error("There is already a user with this email!!!")
    }

    // hash the password for security so that it's secure if someone hacks in
    const hashedPW = await bcrypt.hash(password, 10)
    // print hashed password so we know it worked
    console.log(hashedPW)

    // create the user and store the hashes password in thge database
    const user = await prisma.user.create({
    data: {
        // What fields to save
        email: email,
        name: name,
        passwordHash: hashedPW
    }
    });

    // create JWT the sign method create a token
    
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