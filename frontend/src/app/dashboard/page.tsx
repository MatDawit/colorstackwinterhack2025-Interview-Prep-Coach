/**
 * Dashboard page
 * Main landing page after login showing session statistics and progress
 * Displays average scores, total sessions, and milestone progress
 */
"use client";

import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface SessionStats {
  averageScore: number;
  totalSessions: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [sessionStats, setSessionStats] = useState<SessionStats>({
    averageScore: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch session statistics from backend
  useEffect(() => {
    const fetchSessionStats = async () => {
      try {
        // Get the JWT token from localStorage (or wherever you store it)
        const token = localStorage.getItem("token") || sessionStorage.getItem("token"); // Adjust based on where you store your token

        // Redirect to login if not authenticated
        if (!token) {
          console.error("No auth token found - redirecting to login");
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/session/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Handle token expiry
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch stats");
        }

        const data = await response.json();

        setSessionStats({
          averageScore: data.averageScore,
          totalSessions: data.totalSessions,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching session stats:", error);
        setLoading(false);
      }
    };

    fetchSessionStats();
  }, [router]);

  // Calculate progress toward next milestone (every 5 sessions)
  const nextMilestone = Math.ceil(sessionStats.totalSessions / 5) * 5;
  const sessionsToMilestone = nextMilestone - sessionStats.totalSessions;
  const milestoneProgress =
    sessionStats.totalSessions > 0
      ? ((sessionStats.totalSessions % 5) / 5) * 100
      : 0;

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen pt-20 mt-13 ${
          isDarkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div
            className={`shadow-xl rounded-xl p-6 space-y-4 w-full ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`text-xl font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Welcome to InterviewAI!
            </div>
            <div
              className={`text-sm sm:text-base ${
                isDarkMode ? "text-gray-300" : "text-black"
              }`}
            >
              Refine your interview skills with AI-powered practice and
              actionable feedback.
            </div>
            <div className="bg-blue-500 hover:bg-blue-700 hover:scale-105 rounded-lg w-47 h-10 flex items-center justify-center shadow-xl mt-2">
              <button
                onClick={() => router.push("/practice")}
                className="text-white font-bold text-sm"
              >
                Start Practice
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Motivational Progress Box */}
            <div
              className={`shadow-xl rounded-xl w-full p-6 space-y-3 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <h2
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  You're on fire!
                </h2>
                <span className="text-2xl">🔥</span>
              </div>

              {loading ? (
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Loading...
                </p>
              ) : (
                <>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {sessionStats.totalSessions} session
                    {sessionStats.totalSessions !== 1 ? "s" : ""} this week
                  </p>

                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Keep up the great work!
                  </p>

                  <div className="pt-2">
                    <p className="text-sm font-semibold text-blue-600 mb-2">
                      Next milestone: {milestoneProgress.toFixed(0)}% complete
                    </p>

                    {/* Progress Bar */}
                    <div
                      className={`w-full rounded-full h-2.5 mb-2 ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${milestoneProgress}%` }}
                      ></div>
                    </div>

                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Practice {sessionsToMilestone} more session
                      {sessionsToMilestone !== 1 ? "s" : ""} to complete this
                      set !
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Progress Summary Box */}
            <div
              className={`shadow-xl rounded-xl p-6 space-y-4 w-full ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center">
                <h2
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Progress Summary
                </h2>
                <button
                  onClick={() => router.push("/analytics")}
                  className="text-blue-500 text-sm hover:underline"
                >
                  View Details →
                </button>
              </div>

              <div className="space-y-4">
                {/* Average Score - CONNECTED TO DATABASE */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Average Score
                  </span>
                  {loading ? (
                    <span className="text-2xl font-bold text-blue-600">
                      ...
                    </span>
                  ) : (
                    <span className="text-2xl font-bold text-blue-600">
                      {sessionStats.averageScore}%
                    </span>
                  )}
                </div>

                {/* Total Sessions - CONNECTED TO DATABASE */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Total Sessions
                  </span>
                  {loading ? (
                    <span
                      className={`text-2xl font-bold ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      ...
                    </span>
                  ) : (
                    <span
                      className={`text-2xl font-bold ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      {sessionStats.totalSessions}
                    </span>
                  )}
                </div>

                <div className="mt-4"></div>
              </div>
            </div>

            {/* Quick Links Box */}
            <div
              className={`shadow-xl rounded-xl p-6 space-y-4 w-full ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-lg font-bold ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Quick Links
              </h2>

              <div className="space-y-2">
                <div
                  onClick={() => router.push("/questions")}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-blue-600">📚</div>
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-black"
                    }`}
                  >
                    Question Bank
                  </span>
                </div>

                <div
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-blue-600">📄</div>
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-black"
                    }`}
                  >
                    Resume Review
                  </span>
                </div>

                <div
                  onClick={() => router.push("/profile")}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-blue-600">👤</div>
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-black"
                    }`}
                  >
                    Profile Settings
                  </span>
                </div>

                <div
                  onClick={() => router.push("/profile/preferences")}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-blue-600">⚙️</div>
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-black"
                    }`}
                  >
                    App Settings
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-10" />
        </div>
      </div>
    </>
  );
}
