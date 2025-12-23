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
          <div className="bg-while shadow-xl rounded-xl flex justify-center h-50 w-250 flex flex-col items-left ml-[250px] justify-start p-6 space-y-4 ">
            <div className="text-xl font-bold text-black text-left mt-2">
              Welcome to InterviewAI!
            </div>
            <div className="text-black text-xs text-left">
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
            <div className="bg-white shadow-xl  rounded-xl flex justify-center rounded-xl h-100 w-80 flex flex-col items-left justify-start p-6 space-y-4"></div>

            <div className="bg-white shadow-xl  rounded-xl flex justify-center  rounded-xl h-100 w-80 flex flex-col items-left justify-start p-6 space-y-4"></div>

            <div className="bg-white shadow-xl  rounded-xl flex justify-center  rounded-xl h-100 w-80 flex flex-col items-left justify-start p-6 space-y-4"></div>
          </div>
        </div>
      </div>
    </>
  );
}
