'use client'

import Navbar from "../components/Navbar"
import { useRouter } from 'next/navigation'
import { LayoutDashboard, BrainCircuit, ChartNoAxesColumn, CircleUserRound } from "lucide-react";


export default function Signup() {
    const router = useRouter()
  return (
   
    // Outer container - full screen gradient background
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex justify-center pt-20">
       <Navbar />
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
          Create an Account
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-10">
          Access your AI-powered interview practice sessions.
        </p>
        
        {/* Email */}
        <p className="ml-[0.15cm] text-sm text-black text-left font-bold mb-2">Email</p>
        <div 
            className="bg-white border-3 rounded-lg border-grey-500 w-100 h-10 mb-4">    
        </div>

        {/* Password */}
        <p className="ml-[0.15cm] text-sm text-black text-left font-bold mb-2">Password</p>
        <div 
            className="bg-white border-3 rounded-lg border-grey-500 w-100 h-10 mb-10">    
        </div>
        {/* Password */}
        <p className="ml-[0.15cm] text-sm text-black text-left font-bold mb-2">Confirm Password</p>
        <div 
            className="bg-white border-3 rounded-lg border-grey-500 w-100 h-10 mb-10">    
        </div>
        {/* Sign in button */}
        <button className="bg-blue-600 w-100 h-10 mb-10 rounded-lg shadow-xl font-bold hover:bg-blue-700 hover:scale-105 transition-all " onClick={() => router.push('/dashboard')}>  
            Sign up  →
        </button>
        <button className="ml-[3.3cm] text-sm text-black text-center font-bold mb-10 hover:underline">Continue as Guest   →</button>
        <div className="text-centrer">
            <button 
            className="ml-[1.76cm] text-sm text-blue-600 j font-bold hover:underline " onClick={() => router.push('/signup')}>Don't have an account? Sign up now
            </button> 
        </div>
        
      </div>
      
    </div>
  )
}
