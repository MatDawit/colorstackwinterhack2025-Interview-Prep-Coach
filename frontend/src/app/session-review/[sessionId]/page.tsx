"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface AttemptSummary {
  id: string;
  // Made optional to prevent crashes if question data is missing
  question?: { question: string; category: string };
  score: number;
  duration: number;
  createdAt: string;
}

export default function SessionReview() {
  const params = useParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const sessionId = params.sessionId as string;
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/session/${sessionId}/attempts`
        );
        if (res.ok) {
          const data = await res.json();
          setAttempts(data.attempts || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, [sessionId]);

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-[#F8F9FA]"}`}
    >
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32">
        <button
          onClick={() => router.push("/analytics")}
          className={`flex items-center mb-6 transition ${
            isDarkMode
              ? "text-gray-400 hover:text-white"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Analytics
        </button>

        <h1
          className={`text-2xl font-bold mb-2 ${
            isDarkMode ? "text-white" : "text-[#1A1A1A]"
          }`}
        >
          Session Review
        </h1>
        <p className={`mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Select a question to review the feedback.
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt, index) => {
              // 1. Safe Data Extraction (Prevents crashes)
              const category = attempt.question?.category || "General";
              const questionText =
                attempt.question?.question || "Question Unavailable";
              const score = attempt.score || 0;
              const dateStr = attempt.createdAt
                ? new Date(attempt.createdAt).toLocaleDateString()
                : "";

              // 2. Custom Color Logic
              let scoreColor = "text-red-600"; // Default: < 70 (Red)
              if (score >= 90) {
                scoreColor = "text-emerald-600"; // 90-100 (Green)
              } else if (score >= 80) {
                scoreColor = "text-orange-500"; // 80-89 (Orange)
              } else if (score >= 70) {
                scoreColor = "text-yellow-600"; // 70-79 (Yellow)
              }

              return (
                <div
                  key={attempt.id}
                  onClick={() =>
                    router.push(`/feedback/${attempt.id}?viewOnly=true`)
                  }
                  className={`p-6 rounded-xl border shadow-sm transition cursor-pointer flex items-center justify-between group ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                      : "bg-white border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">
                        Q{index + 1}
                      </span>
                      <span
                        className={`text-xs font-medium uppercase tracking-wide ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {category}
                      </span>
                    </div>
                    <h3
                      className={`text-lg font-bold mb-1 group-hover:text-blue-600 transition ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {questionText}
                    </h3>
                    <div
                      className={`flex items-center gap-4 text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {dateStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={`text-xl font-bold ${scoreColor}`}>
                        {score}%
                      </div>
                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Score
                      </div>
                    </div>
                    <ChevronRight
                      className={`transition ${
                        isDarkMode
                          ? "text-gray-600 group-hover:text-blue-500"
                          : "text-gray-300 group-hover:text-blue-500"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
            <div className="h-10"></div>
          </div>
        )}
      </div>
    </div>
  );
}
