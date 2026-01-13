"use client";

import React, { useEffect, useState, Suspense } from "react";
import {
  Check,
  X,
  RotateCcw,
  ArrowRight,
  Home,
  Loader2,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";

/**
 * Feedback/Results page
 * Displays detailed feedback and scoring for a practice attempt
 * Includes STAR structure score, checklist, transcript analysis, and improvements
 */

interface AttemptData {
  id: string;
  sessionId: string;
  score: number;
  transcription: string;
  feedback: string;
  improvedVersion?: string;
  actionableFeedback?: string;
  isLastQuestion?: boolean;
  attemptCount?: number;

  // UPDATED KEYS TO MATCH DATABASE/AI OUTPUT
  checklist: {
    specific_examples_provided: boolean;
    no_negative_language_detected: boolean;
    no_filler_words_detected: boolean;
    technical_detail_present: boolean;
    appropriate_length: boolean;
  };
  question: {
    question: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function PracticeFeedbackContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useTheme();

  const isViewOnly = searchParams.get("viewOnly") === "true";
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // User preferences for display
  const [showSample, setShowSample] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const [autoStartTimer, setAutoStartTimer] = useState<number | null>(null);

  // Load user preferences
  useEffect(() => {
    const fetchPrefs = async () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/profile/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const p = json.preferences;
          if (p) {
            setShowSample(p.showSampleAnswer ?? true);
            setAutoStart(p.autoStartNext ?? false);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPrefs();
  }, []);

  // Fetch feedback data for this attempt
  useEffect(() => {
    if (!attemptId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/feedback/attempt/${attemptId}`);
        if (!res.ok) throw new Error("Failed to load results");

        const jsonData = await res.json();
        setData(jsonData);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId]);

  // Auto-start next question logic
  useEffect(() => {
    if (
      autoStart &&
      data &&
      !data.isLastQuestion &&
      !isViewOnly &&
      !isGenerating
    ) {
      if (autoStartTimer === null) setAutoStartTimer(5);

      const interval = setInterval(() => {
        setAutoStartTimer((prev) => {
          if (prev !== null && prev <= 1) {
            clearInterval(interval);
            handleNavigation("/analytics");
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoStart, data, isViewOnly, isGenerating]);

  // Remove HTML tags from text
  const cleanText = (text: string) => {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, "");
  };

  // Format transcript with color-coded highlights
  const formatTranscript = (text: string) => {
    if (!text) return "";

    const greenClass = isDarkMode
      ? "bg-emerald-900/40 text-emerald-200 border border-emerald-800"
      : "bg-emerald-100 text-emerald-800";

    const redClass = isDarkMode
      ? "bg-red-900/40 text-red-200 border border-red-800"
      : "bg-red-100 text-red-800";

    return text
      .replace(
        /<green>/g,
        `<span class="${greenClass} px-1 py-0.5 rounded font-medium">`
      )
      .replace(/<\/green>/g, "</span>")
      .replace(
        /<red>/g,
        `<span class="${redClass} px-1 py-0.5 rounded font-medium">`
      )
      .replace(/<\/red>/g, "</span>");
  };

  // Define checklist items with success and error messages
  const checklistMapping: {
    key: keyof AttemptData["checklist"];
    label: string;
    successMsg: string;
    errorMsg: string;
  }[] = [
    {
      key: "specific_examples_provided",
      label: "Specific Examples Provided",
      successMsg: "You used a clear example to illustrate your point.",
      errorMsg: "Try to include a specific story next time (STAR method).",
    },
    {
      key: "no_negative_language_detected",
      label: "Confident Tone",
      successMsg: "Maintained a professional, confident tone.",
      errorMsg: "Avoid starting sentences with apologies or self-deprecation.",
    },
    {
      key: "no_filler_words_detected",
      label: "Clean Speech",
      successMsg: "Clean speech with minimal filler words.",
      errorMsg: 'Try to reduce "um", "like", and "you know".',
    },
    {
      key: "technical_detail_present",
      label: "Technical Depth",
      successMsg: "Good integration of relevant technical terms.",
      errorMsg: "Mention specific tools, languages, or metrics.",
    },
    {
      key: "appropriate_length",
      label: "Appropriate Length",
      successMsg: "Your answer was concise and well-paced.",
      errorMsg: "Your answer was either too short or too rambling.",
    },
  ];

  // Handle navigation to next question or analytics
  const handleNavigation = async (targetDestination: string) => {
    if (!data) return;

    if (isViewOnly) {
      router.push(targetDestination);
      return;
    }

    if (!data.isLastQuestion && targetDestination === "/dashboard") {
      router.push("/dashboard");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/practice/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: data.sessionId }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error("Failed to generate next question");

      if (data.isLastQuestion || result.message === "Session completed") {
        router.push(targetDestination);
      } else {
        router.push(`/practice?sessionId=${data.sessionId}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing request.");
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen pb-10 transition-colors ${
          isDarkMode ? "bg-gray-900" : "bg-[#F8F9FA]"
        }`}
      >
        <div className="max-w-[1000px] mx-auto px-6 pt-32 pb-12">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && !data && (
            <div className="text-center py-20">
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                No data found
              </p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {isViewOnly && (
                <button
                  onClick={() => router.back()}
                  className={`mb-6 flex items-center transition ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <ArrowLeft size={20} className="mr-2" /> Back to List
                </button>
              )}

              <div className="mb-8 text-center md:text-left">
                <h1
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-[#1A1A1A]"
                  }`}
                >
                  Feedback Result
                </h1>
                <p
                  className={`mt-2 text-lg ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Question {data.attemptCount || 1} of 4:{" "}
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {data.question.question}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* 1. STAR Structure Score Card */}
                <div
                  className={`rounded-2xl p-8 border shadow-sm flex flex-col items-center text-center transition-colors ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <h2
                    className={`text-lg font-bold mb-2 ${
                      isDarkMode ? "text-white" : "text-[#1A1A1A]"
                    }`}
                  >
                    STAR Structure Score
                  </h2>
                  <p
                    className={`text-sm mb-8 px-4 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Evaluation of how well your answer followed the Situation,
                    Task, Action, Result framework.
                  </p>

                  <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke={isDarkMode ? "#374151" : "#F3F4F6"}
                        strokeWidth="16"
                        fill="transparent"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke={data.score >= 70 ? "#10B981" : "#FACC15"}
                        strokeWidth="16"
                        fill="transparent"
                        strokeDasharray={502.6}
                        strokeDashoffset={502.6 * (1 - data.score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className={`absolute text-5xl font-bold ${
                        isDarkMode ? "text-white" : "text-[#1A1A1A]"
                      }`}
                    >
                      {data.score}%
                    </span>
                  </div>

                  <p
                    className={`text-[14px] leading-relaxed ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Your answer effectively demonstrated {data.score}% of the
                    STAR structure.
                  </p>
                </div>

                {/* 2. Performance Checklist Card */}
                <div
                  className={`rounded-2xl p-8 border shadow-sm transition-colors ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <h2
                    className={`text-lg font-bold mb-1 ${
                      isDarkMode ? "text-white" : "text-[#1A1A1A]"
                    }`}
                  >
                    Performance Checklist
                  </h2>
                  <p
                    className={`text-sm mb-8 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Key elements identified in your response.
                  </p>

                  <div className="space-y-6">
                    {checklistMapping.map((item, index) => {
                      // Direct property access - no more @ts-ignore needed
                      const isSuccess = data?.checklist[item.key] === true;

                      return (
                        <div key={index} className="flex items-start gap-4">
                          <div
                            className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                              isSuccess
                                ? isDarkMode
                                  ? "text-emerald-400 bg-emerald-900/30"
                                  : "text-emerald-500 bg-emerald-50"
                                : isDarkMode
                                ? "text-red-400 bg-red-900/30"
                                : "text-red-500 bg-red-50"
                            }`}
                          >
                            {isSuccess ? <Check size={14} /> : <X size={14} />}
                          </div>
                          <div>
                            <h4
                              className={`text-[15px] font-bold ${
                                isDarkMode ? "text-gray-200" : "text-[#1A1A1A]"
                              }`}
                            >
                              {item.label}
                            </h4>
                            <p
                              className={`text-[13px] ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {isSuccess ? item.successMsg : item.errorMsg}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Transcript Analysis Card */}
              <section
                className={`rounded-2xl p-8 border shadow-sm mt-8 transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                }`}
              >
                <h2
                  className={`text-lg font-bold mb-1 ${
                    isDarkMode ? "text-white" : "text-[#1A1A1A]"
                  }`}
                >
                  Transcript Analysis
                </h2>
                <p
                  className={`text-sm mb-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Review your response with AI-highlighted areas for improvement
                  and strengths.
                </p>

                <div
                  className={`p-6 rounded-xl border ${
                    isDarkMode
                      ? "bg-gray-900/50 border-gray-700"
                      : "bg-[#F8F9FA] border-gray-100"
                  }`}
                >
                  <div
                    className={`text-[15px] leading-[1.8] ${
                      isDarkMode ? "text-gray-300" : "text-black"
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: formatTranscript(data.feedback),
                    }}
                  />
                </div>
              </section>

              {/* 4. Actionable Feedback Card */}
              <section
                className={`rounded-2xl p-8 border shadow-sm mt-8 transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-100"
                }`}
              >
                <h2
                  className={`text-lg font-bold mb-6 ${
                    isDarkMode ? "text-white" : "text-[#1A1A1A]"
                  }`}
                >
                  Actionable Feedback
                </h2>
                <div
                  className={`text-[15px] leading-relaxed whitespace-pre-line ${
                    isDarkMode ? "text-gray-300" : "text-black"
                  }`}
                >
                  {data?.actionableFeedback ||
                    "No actionable feedback generated."}
                </div>
              </section>

              {/* 5. Better Version Card (CONDITIONAL) */}
              {showSample && (
                <section
                  className={`rounded-2xl p-8 border shadow-sm mt-8 transition-colors ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <h2
                    className={`text-lg font-bold mb-1 ${
                      isDarkMode ? "text-white" : "text-[#1A1A1A]"
                    }`}
                  >
                    Better Version
                  </h2>
                  <p
                    className={`text-sm mb-6 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Here's an AI-generated improved version of your answer.
                  </p>

                  <div
                    className={`p-8 rounded-xl border ${
                      isDarkMode
                        ? "bg-gray-900/50 border-gray-700"
                        : "bg-[#F9FAFB] border-gray-200"
                    }`}
                  >
                    <p
                      className={`text-[15px] leading-[1.8] ${
                        isDarkMode ? "text-gray-300" : "text-black"
                      }`}
                    >
                      {data?.improvedVersion
                        ? cleanText(data?.improvedVersion)
                        : "No improved version generated."}
                    </p>
                  </div>
                </section>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col items-center gap-8 mt-12">
                <div className="flex items-center justify-center gap-4 w-full">
                  {isViewOnly ? (
                    // VIEW ONLY MODE
                    <>
                      <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all"
                      >
                        <ArrowLeft size={18} />
                        Back to Session List
                      </button>

                      <button
                        onClick={() => router.push("/dashboard")}
                        className={`flex items-center gap-2 font-bold text-[14px] transition-all ml-4 ${
                          isDarkMode
                            ? "text-gray-400 hover:text-white"
                            : "text-gray-500 hover:text-[#1A1A1A]"
                        }`}
                      >
                        <Home size={18} />
                        Return to Dashboard
                      </button>
                    </>
                  ) : (
                    <>
                      {/* RETRY BUTTON */}
                      <button
                        onClick={() =>
                          router.push(`/practice?sessionId=${data?.sessionId}`)
                        }
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border font-bold text-[14px] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <RotateCcw size={18} />
                        Retry Question
                      </button>

                      {/* NEXT BUTTON */}
                      <button
                        onClick={() => handleNavigation("/analytics")}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-[14px] transition-all shadow-md ${
                          data?.isLastQuestion
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        } ${isGenerating ? "opacity-75 cursor-wait" : ""}`}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {autoStartTimer !== null &&
                            !data?.isLastQuestion ? (
                              `Next Question in ${autoStartTimer}s...`
                            ) : data?.isLastQuestion ? (
                              <>
                                Go to Analytics <BarChart3 size={18} />
                              </>
                            ) : (
                              <>
                                Next Question <ArrowRight size={18} />
                              </>
                            )}
                          </>
                        )}
                      </button>

                      {/* DASHBOARD BUTTON */}
                      <button
                        onClick={() => handleNavigation("/dashboard")}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 font-bold text-[14px] transition-all ml-4 disabled:opacity-50 ${
                          isDarkMode
                            ? "text-gray-400 hover:text-white"
                            : "text-gray-500 hover:text-[#1A1A1A]"
                        }`}
                      >
                        <Home size={18} />
                        Return to Dashboard
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function PracticeFeedback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={40} className="animate-spin text-blue-600" />
        </div>
      }
    >
      <PracticeFeedbackContent />
    </Suspense>
  );
}
