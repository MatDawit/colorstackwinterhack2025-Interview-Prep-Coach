import { Router } from "express"
import { Request } from "express"
import { Response } from "express"
import { PrismaClient } from "../../generated/prisma";  // Import prisma client
import jwt from "jsonwebtoken";

// create the router
const router = Router()

// prisma instance
const prisma = new PrismaClient()
// jwt
const JWT_SECRET = process.env.JWT_SECRET

// we need to save the atrtempt but also needa know WHO is saving the attemp so we needa get the user
function getUser(req: Request): string {
    try {
        // get the user authorization parameter from the headers that are passed into the request body
        const auth = req.headers.authorization; // go in the headrs and get the auth string 

        // make sure that the token is in the request body 
        if (!auth || !auth.startsWith('Bearer ')){
            throw new Error("token does not exist in the request body")
        }

        // grab the token from the request body
        const token = auth.split(' ')[1] // spit it into spaces token should be second idex
        // make rsure the token is real 
        const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string }

        return decoded.userId
    } catch (error: any){
        // throw something 
        throw new Error("error")        
    }
}

// creat a route to handle save requessts
router.post('/save', async (req: Request, res: Response) => {
    // Erroe handling practice
    try 
    {
       // get the user id
       const userId = getUser(req)

       // extract the data from the request
       const {questionId, transcription, duration} = req.body

        if (!questionId || !transcription) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
       const attempt = await prisma.attempt.create({
            data: {
                userId: userId,
                questionId: questionId,
                transcription: transcription,
                duration: duration || 0,
                audioUrl: null,         
                starScores: {},          
                feedback: "",            
                biasPatterns: {}         
            }
        })

        res.status(201).json({
            success: true,
            attemptId: attempt.id,
            message: 'Answer saved successfully!'
        });

    } catch (error:any) // if there is any error thrown from the signuo function
    {
        res.status(500).json({ error: error.message });
    }
    
})



// export the router to be usable
export default router