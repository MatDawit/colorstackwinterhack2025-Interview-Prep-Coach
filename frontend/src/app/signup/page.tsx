'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { BrainCircuit, X } from "lucide-react";

export default function Signup() {
    const router = useRouter()

    // State for form inputs
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    
    // State for error modal
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorTitle, setErrorTitle] = useState('Error')
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Handle regular signup
    const handleSignUp = async () => {
        // Clear any previous errors
        setShowErrorModal(false)
        
        // Client-side validation
        if (!email || !password || !name) {
            setErrorTitle('Missing Information')
            setErrorMessage('Please fill out all fields.')
            setShowErrorModal(true)
            return
        }

        if (password.length < 6) {
            setErrorTitle('Invalid Password')
            setErrorMessage('Password must be at least 6 characters long.')
            setShowErrorModal(true)
            return
        }

        setIsLoading(true)

        const userData = {
            email: email.trim(),
            password: password,
            name: name.trim()
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })

            const data = await response.json()

            if (response.ok) {
                // Store token
                localStorage.setItem('token', data.token)
                
                // Handle "Remember Me" - save email for next time
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email)
                }
                
                // Redirect to dashboard
                router.push('/dashboard')
            } else {
                // Display specific error from backend
                setErrorTitle('Sign Up Failed')
                setErrorMessage(data.error || 'Unable to create account. Please try again.')
                setShowErrorModal(true)
            }
        } catch (err) {
            // Network or connection error
            setErrorTitle('Connection Error')
            setErrorMessage('Unable to connect to the server. Please check your internet connection and try again.')
            setShowErrorModal(true)
        } finally {
            setIsLoading(false)
        }
    }

    // Handle Google OAuth
    const handleGoogleAuth = () => {
        setErrorTitle('Coming Soon')
        setErrorMessage('Google authentication will be available soon!')
        setShowErrorModal(true)
    }

    // Handle GitHub OAuth
    const handleGitHubAuth = () => {
        setErrorTitle('Coming Soon')
        setErrorMessage('GitHub authentication will be available soon!')
        setShowErrorModal(true)
    }

    // Handle Continue as Guest
    const handleGuestMode = () => {
        localStorage.setItem('isGuest', 'true')
        router.push('/dashboard')
    }

    // Handle pressing Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSignUp()
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex justify-center pt-20">
            
            {/* Main Signup Card */}
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full h-fit relative">
                
                {/* Logo Section */}
                <div className="flex items-center justify-center mb-6">
                    <div className="w-9 h-9 bg-blue-600 overflow-hidden rounded-lg flex items-center justify-center">
                        <BrainCircuit className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="ml-2 text-2xl font-semibold text-blue-600">
                        InterviewAI
                    </span>
                </div>
                
                {/* Title */}
                <h1 className="text-black text-3xl font-bold text-center mb-2">
                    Create an Account
                </h1>
                
                {/* Subtitle */}
                <p className="text-gray-600 text-center mb-6">
                    Start practicing for your dream job today.
                </p>

                {/* OAuth Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Google Button */}
                    <button
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 rounded-lg py-2.5 px-4 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Google</span>
                    </button>

                    {/* GitHub Button */}
                    <button
                        onClick={handleGitHubAuth}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 rounded-lg py-2.5 px-4 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">GitHub</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">OR CONTINUE WITH</span>
                    </div>
                </div>
                
                {/* Name Input MAYBE
                <div className="mb-4">
                    <label className="block text-sm text-black font-bold mb-2">Full Name</label>
                    <input 
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="bg-white border-2 rounded-lg border-gray-300 w-full h-12 px-4 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div> 
                    */}
                {/* Email Input */}
                <div className="mb-4">
                    <label className="block text-sm text-black font-bold mb-2">Email</label>
                    <input 
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="bg-white border-2 rounded-lg border-gray-300 w-full h-12 px-4 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Password Input */}
                <div className="mb-4">
                    <label className="block text-sm text-black font-bold mb-2">Password</label>
                    <input 
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="bg-white border-2 rounded-lg border-gray-300 w-full h-12 px-4 text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                </div>

                {/* Remember Me */}
                <div className="flex items-center mb-6">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={isLoading}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                        />
                        <span className="ml-2 text-sm text-gray-700">Remember my email</span>
                    </label>
                </div>
                
                {/* Sign Up Button */}
                <button 
                    className="bg-blue-600 text-white w-full h-12 rounded-lg shadow-md font-bold hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                    onClick={handleSignUp}
                    disabled={isLoading}
                >  
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                        </>
                    ) : (
                        <>
                            Sign Up
                            <span>→</span>
                        </>
                    )}
                </button>

                {/* Continue as Guest */}
                <button 
                    className="w-full text-center text-sm text-gray-600 font-semibold hover:text-gray-900 hover:underline mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleGuestMode}
                    disabled={isLoading}
                >
                    Continue as Guest →
                </button>

                {/* Login Link */}
                <div className="text-center">
                    <span className="text-sm text-gray-600">Already have an account? </span>
                    <button 
                        className="text-sm text-blue-600 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={() => router.push('/login')}
                        disabled={isLoading}
                    >
                        Sign in
                    </button> 
                </div>
            </div>

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative animate-fadeIn">
                        {/* Close button */}
                        <button
                            onClick={() => setShowErrorModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Error Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-red-500">
                                    <X className="w-10 h-10 text-red-500" strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        {/* Error Title */}
                        <h2 className="text-2xl font-bold text-center text-red-600 mb-3">
                            {errorTitle}
                        </h2>

                        {/* Error Message */}
                        <p className="text-center text-gray-600 mb-6">
                            {errorMessage}
                        </p>

                        {/* Dismiss Button */}
                        <button
                            onClick={() => setShowErrorModal(false)}
                            className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}