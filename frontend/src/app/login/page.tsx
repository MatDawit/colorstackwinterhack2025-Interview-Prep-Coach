// create our log in component (reusable piece of code)
/*
min-h-screen - full viewport height
bg-gradient-to-br - gradient from top-left to bottom-right
from-purple-100 via-pink-50 to-blue-100 - gradient color stops
flex items-center justify-center - centers content
text-2xl text-gray-800 - text size and color
*/

'use client'
import { useState } from 'react';
// the useRouter function is class and the push method basically switches the page
 /*
{
  push: function,      // Navigate to a page
  replace: function,   // Replace current page
  back: function,      // Go back one page
  forward: function,   // Go forward one page
  refresh: function,   // Reload current page
  prefetch: function,  // Pre-load a page
  // ... and more

  

 */

import { useRouter } from 'next/navigation'
import { LayoutDashboard, BrainCircuit, ChartNoAxesColumn, CircleUserRound } from "lucide-react";


export default function Login() {
    const router = useRouter()

        // create variables dor the user info and set default states
        const [email, setEmail] = useState('')
        const [password, setPassword] = useState('')
        const [error, setError] = useState('') // error mesaage for if sign up fails
        /*
        Handle Sign up:
            rn the front end can grap the name, email and password
            amd backend api can create users in the database,
            this functionn is the bridege that connects the form to the backend          
            without this emthod, we would just redirect to the dashboard without creating an account                                                                                                                  
        */
    
        // this won't be exported
        const handleLogin = async () => {
            // grab user data
            const userData = {
                email: email,
                password: password,
            }
            // send to backend
            const response = await fetch ('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(userData)
            })
    
            // get the response
            const data = await response.json()
    
            //
            if (response.ok){ // lets me know if the requests was successful
                localStorage.setItem('token', data.token) // incase the user refreshes the page
                router.push('/dashboard')
            }
            else{
                setError(data.error)
            }
    }
    
  return (

    // Outer container - full screen gradient background
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex justify-center pt-20">
      
      {/* White card container */}
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-120  h-180">
        
        {/* Logo section - blue box + InterviewAI text */}
        <div className="flex items-center justify-center mb-8">
          
          {/* Avatar */}
             <div className="w-9 h-9 bg-blue-600 overflow-hidden rounded-lg flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-white-700" strokeWidth={1.5} />
          </div>
          
          {/* "InterviewAI" text */}
          <span className="ml-2 text-2xl font-semibold text-blue-600">
            InterviewAI
          </span>
          
        </div>
        
        {/* the sign in text */}
        <h1 className=" text-black text-3xl font-bold text-center mb-2">
          Sign In to InterviewAI
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-10">
          Access your AI-powered interview practice sessions.
        </p>
        
        {/* Email */}
        {/* Email */}
        <p className="ml-[0.15cm] text-sm text-black text-left font-bold mb-2">Email</p>
        <input 
          type="email"
          placeholder="Enter your email"
          value = {email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white border-3 rounded-lg border-grey-500 w-100 h-12 mb-10 px-4 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
        />

        {/* Password */}
        <p className="ml-[0.15cm] text-sm text-black text-left font-bold mb-2">Password</p>
        <input 
          type="password"
          placeholder="Enter your password"
          value = {password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-white border-3 rounded-lg border-grey-500 w-100 h-12 mb-10 px-4 text-black"
        />
        {/* Sign in button */}
        <button className="bg-blue-600 w-100 h-12 mb-25 rounded-lg shadow-xl font-bold hover:bg-blue-700 hover:scale-105 transition-all " onClick={handleLogin}>  
            Sign in  →
        </button>
        <button className="ml-[3.3cm] text-sm text-black text-center font-bold mb-7 hover:underline">Continue as Guest   →</button>
        <div className="text-centrer">
            <button 
            className="ml-[1.76cm] text-sm text-blue-600 j font-bold hover:underline" onClick={() => router.push('/signup')}>Don't have an account? Sign up now
            </button> 
        </div>
        
      </div>
      
    </div>
  )
}
