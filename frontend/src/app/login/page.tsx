// create our log in component (reusable piece of code)
/*
min-h-screen - full viewport height
bg-gradient-to-br - gradient from top-left to bottom-right
from-purple-100 via-pink-50 to-blue-100 - gradient color stops
flex items-center justify-center - centers content
text-2xl text-gray-800 - text size and color
*/
export default function Login() {
  return (
    // Outer container - full screen gradient background
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex justify-center pt-20">
      
      {/* White card container */}
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-120  h-180">
        
        {/* Logo section - blue box + InterviewAI text */}
        <div className="flex items-center justify-center mb-8">
          
          {/* Blue box with "AI" text */}
          <div className="bg-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
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
        <p className="ml-[0.15cm] text-sm text-black text-left font-bold mb-2">Email</p>
        <div 
            className="bg-white border-3 rounded-lg border-grey-500 w-100 h-12 mb-4">    
        </div>

        {/* Password */}
        <p className="ml-[0.15cm] text-sm text-black text-left font-bold mb-2">Password</p>
        <div 
            className="bg-white border-3 rounded-lg border-grey-500 w-100 h-12 mb-10">    
        </div>
        {/* Sign in button */}
        <button className="bg-blue-600 w-100 h-12 mb-30 rounded-lg shadow-xl font-bold hover:bg-blue-700 hover:scale-105 transition-all ">  
            Sign in  →
        </button>
        <button className="ml-[3.3cm] text-sm text-black text-center font-bold mb-10 hover:underline">Continue as Guest   →</button>
        <div className="text-centrer">
            <button 
            className="ml-[1.76cm] text-sm text-blue-600 j font-bold hover:underline">Don't have an account? Sign up now
            </button> 
        </div>
        
      </div>
      
    </div>
  )
}
