// prince dashboard page
import Navbar from "../components/Navbar";

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white flex justify-center pt-20">
        {/* PAGE WRAPPER */}
        <div className="w-full">
          {/*Box at the top of the page that says Welcome */}
          <div className="bg-white shadow-xl rounded-xl h-50 w-250 flex flex-col items-start ml-[250px] p-6 space-y-4">
            <div className="text-xl font-bold text-black mt-2">
              Welcome to InterviewAI!
            </div>
            <div className="text-black text-xs">
              Refine your interview skills with AI-powered practice and
              actionable feedback.
            </div>
            <div className="bg-blue-500 rounded-lg w-47 h-10 flex items-center justify-center shadow-xl mt-2">
              <button className="text-white font-bold text-sm">
                Start Practice
              </button>
            </div>
          </div>

          {/*3 boxes for user updates and progressions*/}
          <div className="flex flex-row gap-5 ml-[250px] mt-6">
            {/* Recent Sessions Box */}
            <div className="bg-white shadow-xl rounded-xl h-100 w-80 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-black">Recent Sessions</h2>
                <button className="text-blue-500 text-sm">View All →</button>
              </div>
              
              <div className="space-y-3">
                {/* Session 1 */}
                <div className="border-b pb-3">
                  <h3 className="font-semibold text-sm text-black">Behavioral Interview</h3>
                  <p className="text-xs text-gray-500">2023-11-20</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-600 font-bold text-sm">85%</span>
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                </div>

                {/* Session 2 */}
                <div className="border-b pb-3">
                  <h3 className="font-semibold text-sm text-black">Technical Interview (Python)</h3>
                  <p className="text-xs text-gray-500">2023-11-18</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-green-600 font-bold text-sm">72%</span>
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                </div>

                {/* Session 3 */}
                <div className="pb-3">
                  <h3 className="font-semibold text-sm text-black">System Design Interview</h3>
                  <p className="text-xs text-gray-500">2023-11-15</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-600 font-bold text-sm">In Progress</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Summary Box */}
            <div className="bg-white shadow-xl rounded-xl h-100 w-80 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-black">Progress Summary</h2>
                <button className="text-blue-500 text-sm">View Details →</button>
              </div>

              <div className="space-y-4">
                {/* Average Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-2xl font-bold text-blue-600">78%</span>
                </div>

                {/* Total Sessions */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Sessions</span>
                  <span className="text-2xl font-bold text-black">12</span>
                </div>

                {/* Key Improvement Areas */}
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-black mb-2">Key Improvement Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full">STAR Structure</span>
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full">Conciseness</span>
                    <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full">Technical Depth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links Box */}
            <div className="bg-white shadow-xl rounded-xl h-100 w-80 p-6 space-y-4">
              <h2 className="text-lg font-bold text-black">Quick Links</h2>
              
              <div className="space-y-3">
                {/* Question Bank Link */}
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="text-blue-600">📚</div>
                  <span className="text-sm text-black">Question Bank</span>
                </div>

                {/* Profile Settings Link */}
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="text-blue-600">👤</div>
                  <span className="text-sm text-black">Profile Settings</span>
                </div>

                {/* App Settings Link */}
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="text-blue-600">⚙️</div>
                  <span className="text-sm text-black">App Settings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
