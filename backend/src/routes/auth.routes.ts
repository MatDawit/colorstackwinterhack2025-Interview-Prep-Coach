import { Router } from "express"
import { Request } from "express"
import { Response } from "express"
import { signup } from '../services/auth.service'

// create the router
// this is where i'll add new endpoints
const router  = Router()

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

// export the router
export default router