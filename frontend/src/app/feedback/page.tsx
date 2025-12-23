import React from "react";
import { Check, X, RotateCcw, ArrowRight, Home } from "lucide-react";

const PracticeFeedback = () => {
  const score = 70;

  const checklist = [
    {
      id: 1,
      label: "Specific Examples Provided",
      status: "success",
      detail: "You used a clear example to illustrate your point.",
    },
    {
      id: 2,
      label: "Apologizing / Negative Language",
      status: "error",
      detail: "Avoid starting sentences with apologies.",
    },
    {
      id: 3,
      label: "Filler Words Detected",
      status: "error",
      detail: 'Minimal use of filler words like "um" or "like".',
    },
    {
      id: 4,
      label: "Technical Details Included",
      status: "success",
      detail: "Good integration of relevant technical terms.",
    },
    {
      id: 5,
      label: "Appropriate Length",
      status: "success",
      detail: "Your answer was concise and well-paced.",
    },
  ];

  const transcriptData = [
    {
      text: "In my previous role at TechCorp, I faced a situation where our main server crashed. I immediately assessed the issue, collaborating with the network team. I then implemented a failover to a backup system, which took about an hour. The result was that we minimized downtime by 90% and prevented significant data loss.",
      type: "strength",
    },
    {
      text: " I think it went pretty well.",
      type: "weakness",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <div className="max-w-[1000px] mx-auto px-6 pt-32 pb-12">
        {/* Top Grid: Score & Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* STAR Structure Score Card */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">
              STAR Structure Score
            </h2>
            <p className="text-gray-500 text-sm mb-8 px-4">
              Evaluation of how well your answer followed the Situation, Task,
              Action, Result framework.
            </p>

            {/* Radial Progress Circle */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#F3F4F6"
                  strokeWidth="16"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#FACC15" /* Yellow/Gold for 70% */
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={502.6}
                  strokeDashoffset={502.6 * (1 - score / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-5xl font-bold text-[#1A1A1A]">
                {score}%
              </span>
            </div>

            <p className="text-gray-600 text-[14px] leading-relaxed">
              Your answer effectively demonstrated {score}% of the STAR
              structure. Focus on detailing each segment.
            </p>
          </div>

          {/* Performance Checklist Card */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">
              Performance Checklist
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Key elements identified in your response.
            </p>

            <div className="space-y-6">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      item.status === "success"
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {item.status === "success" ? (
                      <Check size={18} />
                    ) : (
                      <X size={18} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#1A1A1A]">
                      {item.label}
                    </h4>
                    <p className="text-gray-500 text-[13px]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Transcript Analysis Card */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-8">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">
            Transcript Analysis
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Review your response with AI-highlighted areas for improvement and
            strengths.
          </p>

          <div className="bg-[#F8F9FA] p-6 rounded-xl border border-gray-100">
            <div className="text-[15px] leading-[1.8] text-gray-700 font-medium">
              {transcriptData.map((part, index) => (
                <span
                  key={index}
                  className={`px-1 py-0.5 rounded ${
                    part.type === "strength"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {part.text}
                </span>
              ))}
            </div>
          </div>
        </section>
        {/* Actionable Feedback Card */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-8">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-6">
            Actionable Feedback
          </h2>
          <div className="text-[15px] leading-relaxed text-gray-600 space-y-4">
            <p>
              Your response demonstrated a solid understanding of the STAR
              method, clearly outlining the Situation, Action, and a
              quantifiable Result.
            </p>
            <p>
              However, consider refining your Task description for more clarity
              and detail. Additionally, eliminate filler words to enhance your
              professional delivery. Focus on a strong, confident closing
              statement to reinforce your achievements.
            </p>
          </div>
        </section>
        {/* Better Version Card */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-8">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">
            Better Version
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Here's an AI-generated improved version of your answer to the
            question.
          </p>

          <div className="bg-[#F9FAFB] p-8 rounded-xl border border-gray-200">
            <p className="text-[15px] leading-[1.8] text-gray-700">
              In my previous role at TechCorp, our primary server experienced a
              critical outage, jeopardizing service continuity. My objective was
              to restore functionality with minimal downtime. I initiated an
              immediate assessment, coordinating with the network team to
              diagnose the root cause. Concurrently, I executed a planned
              failover to our redundant backup system, which stabilized
              operations within the hour. This swift action resulted in a 90%
              reduction in potential downtime and successfully averted
              significant data loss. From this experience, I learned the
              critical importance of proactive system monitoring and maintaining
              robust, well-tested disaster recovery protocols.
            </p>
          </div>
        </section>
        {/* Navigation Buttons Row - Positioned under Better Version */}
        <div className="flex flex-col items-center gap-8 mt-4">
          <div className="flex items-center justify-center gap-4 w-full">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-[14px] hover:bg-gray-50 transition-all shadow-sm">
              <RotateCcw size={18} />
              Try Again
            </button>

            <button className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[14px] hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
              Next Question
              <ArrowRight size={18} />
            </button>

            <button className="flex items-center gap-2 text-gray-500 hover:text-[#1A1A1A] font-bold text-[14px] transition-all ml-4">
              <Home size={18} />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeFeedback;
