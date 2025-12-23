"use client";

export default function AnalyticsPage() {

    const sessions = [
        { id: 1, date: "2024-06-15", category: "Behavioral", duration: "22:15", score: 88 },
        { id: 2, date: "2024-06-12", category: "Technical", duration: "30:00", score: 92 },
        { id: 3, date: "2024-06-08", category: "Problem Solving", duration: "18:40", score: 75 },
        { id: 4, date: "2024-06-05", category: "Behavioral", duration: "25:30", score: 80 },
        { id: 5, date: "2024-06-01", category: "Leadership", duration: "19:00", score: 95 },
        { id: 6, date: "2024-05-28", category: "Technical", duration: "28:10", score: 70 },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-emerald-500"; // Green for excellent
        if (score >= 80) return "text-orange-400";  // Orange for good
        return "text-red-400";                     // Red for needs improvement
    };

  return (
    <main className="min-h-screen bg-[#F8F9FA] pt-24 pb-12 px-8">
      <div className="mx-auto max-w-[1440px]">
        
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-[30px] font-bold text-[#1A1A1A]">Analytics and Insights</h1>
          <p className="text-gray-500 mt-2">Dive deep into your interview performance, track progress, and identify areas for improvement.</p>
        </header>

        {/* Filters Row */}
        <div className="flex justify-end gap-6 mb-8 items-center text-sm">
           <div className="flex items-center gap-2">
             <span className="text-black font-medium">Time Range</span>
             <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none text-black">
               <option>Last 30 Days</option>
               <option>Last 7 Days</option>
               <option>Last 24 Hours</option>
             </select>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-black font-medium">Category</span>
             <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none text-black">
               <option>All Categories</option>
             </select>
           </div>
        </div>
    
        {/* Top Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
              <h2 className="text-black text-xl font-bold mb-1">Average Score Over Time</h2>
              <p className="text-gray-500 text-sm mb-6">Trend of your average score across practice sessions.</p>
              {/* Insert Chart Component Here */}
           </div>
           <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
              <h2 className="text-black text-xl font-bold mb-1">Common Interview Patterns</h2>
              <p className="text-gray-500 text-sm mb-6">Frequency of key patterns identified in your recent sessions.</p>
              {/* Insert Bar Chart Component Here */}
           </div>
        </div>

        {/* Session History Section */}
        <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm mt-8">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Session History</h2>
            <p className="text-gray-500 text-sm mb-8">Detailed record of all your practice interview sessions.</p>

            {/* Table Header */}
            <div className="grid grid-cols-4 pb-4 border-b border-gray-100 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
                <span>Date</span>
                <span>Category</span>
                <span className="text-right">Duration</span>
                <span className="text-right">Overall Score</span>
            </div>

            {/* Data Rows Container */}
            <div className="divide-y divide-gray-50">
                {sessions.map((session) => (
                    /* This div is the ROW. justify-between works because it has TWO children (Left Group and Right Group) */
                    <div 
                    key={session.id} 
                    className="w-full max-w-[1296px] flex items-center justify-between py-[12px] px-4 hover:bg-gray-50 transition-colors"
                    >
                    {/* Group 1: Left Side (Date & Category) */}
                    <div className="flex items-center gap-24">
                        <span className="text-[14px] leading-[20px] font-medium text-[#1A1A1A]">
                        {session.date}
                        </span>
                        <span className="text-[14px] leading-[20px] font-normal text-[#1A1A1A]">
                        {session.category}
                        </span>
                    </div>

                    {/* Group 2: Right Side (Duration & Score) */}
                    <div className="flex items-center gap-24">
                        <span className="text-[14px] leading-[20px] font-normal text-[#1A1A1A] w-16 text-right">
                        {session.duration}
                        </span>
                        <span className={`text-[14px] leading-[20px] font-semibold w-24 text-right ${getScoreColor(session.score)}`}>
                        {session.score}%
                        </span>
                    </div>
                    </div>
                ))}
            </div>
        </section>

      </div>
    </main>
  );
}