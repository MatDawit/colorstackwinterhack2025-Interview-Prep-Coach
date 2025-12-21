// prince dashboard page

export default function Dashboard(){

    return (
        <div 
            className="min-h-screen bg-white flex justify-center pt-20">
                {/* NAVBAR */}
                <div 
                    
                    className="bg-white shadow-xl flex justify-center h-15 w-full -mt-20 flex items-center justify-start ">
                        {/* Blue box with "AI" text */}
                        <div className="bg-blue-600 ml-4 rounded-lg w-12 h-9 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">AI</span>
                        </div>
                    <span className="ml-2 text-lg font-bold text-blue-600 ">
                        InterviewAI
                    </span>
                    <span className="ml-20 -mb- text-xs text-blue-600 ">
                        Dashboard
                    </span>
                    <span className="ml-20 -mb- text-xs text-black ">
                        Practice
                    </span>
                    <span className="ml-20  text-xs text-black ">
                        Analytics
                    </span>
                    <div className="bg-while shadow-xl -ml-80 rounded-xl flex justify-center h-40 w-250 -mb-70 flex items-center justify-center"> </div>
                            
                </div>
                
        </div>
    )
}