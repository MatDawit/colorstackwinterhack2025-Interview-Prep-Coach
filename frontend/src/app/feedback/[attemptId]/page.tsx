"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  X,
  RotateCcw,
  ArrowRight,
  Home,
  Loader2,
  BarChart3,
} from "lucide-react"; // Added BarChart3 icon
import Navbar from "../../components/Navbar";
import { useParams, useRouter } from "next/navigation";

// 1. Updated Data Interface
interface AttemptData {
  id: string;
  sessionId: string;
  score: number;
  transcription: string;
  feedback: string;
  improvedVersion?: string;
  actionableFeedback?: string;
  // New fields from backend
  isLastQuestion?: boolean;
  attemptCount?: number;

  checklist: {
    specific_examples: boolean;
    no_negative_language: boolean;
    no_filler_words: boolean;
    technical_detail: boolean;
    appropriate_length: boolean;
  };
  question: {
    question: string;
  };
}

const PracticeFeedback = () => {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!attemptId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/feedback/attempt/${attemptId}`
        );
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-red-600 font-medium">
        Error: {error || "No data found"}
      </div>
    );
  }

  const cleanText = (text: string) => {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, "");
  };

  const formatTranscript = (text: string) => {
    if (!text) return "";
    return text
      .replace(
        /<green>/g,
        '<span class="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-medium">'
      )
      .replace(/<\/green>/g, "</span>")
      .replace(
        /<red>/g,
        '<span class="bg-red-100 text-red-800 px-1 py-0.5 rounded font-medium">'
      )
      .replace(/<\/red>/g, "</span>");
  };

  const checklistMapping = [
    {
      key: "specific_examples",
      label: "Specific Examples Provided",
      successMsg: "You used a clear example to illustrate your point.",
      errorMsg: "Try to include a specific story next time (STAR method).",
    },
    {
      key: "no_negative_language",
      label: "Apologizing / Negative Language",
      successMsg: "Maintained a professional, confident tone.",
      errorMsg: "Avoid starting sentences with apologies or self-deprecation.",
    },
    {
      key: "no_filler_words",
      label: "Filler Words Detected",
      successMsg: "Clean speech with minimal filler words.",
      errorMsg: 'Try to reduce "um", "like", and "you know".',
    },
    {
      key: "technical_detail",
      label: "Technical Details Included",
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

  const handleNavigation = async (targetDestination: string) => {
    if (!data) return;

    if (!data.isLastQuestion && targetDestination === "/dashboard") {
      router.push("/dashboard");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/practice/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: data.sessionId }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error("Failed to generate next question");

      if (data.isLastQuestion || result.message === "Session completed") {
        // Session is Done. Go to where the user clicked (Analytics or Dashboard)
        router.push(targetDestination);
      } else {
        // Session Continues. Loop back to Practice page.
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
      <div className="min-h-screen bg-[#F8F9FA] pb-32">
        <div className="max-w-[1000px] mx-auto px-6 pt-32 pb-12">
          {/* Header */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Feedback Result
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Question {data.attemptCount || 1} of 4:{" "}
              <span className="text-gray-800 font-medium">
                {data.question.question}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* 1. STAR Structure Score Card */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">
                STAR Structure Score
              </h2>
              <p className="text-gray-500 text-sm mb-8 px-4">
                Evaluation of how well your answer followed the Situation, Task,
                Action, Result framework.
              </p>

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
                    stroke={data.score >= 70 ? "#10B981" : "#FACC15"}
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={502.6}
                    strokeDashoffset={502.6 * (1 - (data.score || 0) / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-5xl font-bold text-[#1A1A1A]">
                  {data.score}%
                </span>
              </div>

              <p className="text-gray-600 text-[14px] leading-relaxed">
                Your answer effectively demonstrated {data.score}% of the STAR
                structure.
              </p>
            </div>

            {/* 2. Performance Checklist Card */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">
                Performance Checklist
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                Key elements identified in your response.
              </p>

              <div className="space-y-6">
                {checklistMapping.map((item, index) => {
                  // @ts-ignore
                  const isSuccess = data.checklist?.[item.key] === true;

                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          isSuccess
                            ? "text-emerald-500 bg-emerald-50"
                            : "text-red-500 bg-red-50"
                        }`}
                      >
                        {isSuccess ? <Check size={14} /> : <X size={14} />}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-[#1A1A1A]">
                          {item.label}
                        </h4>
                        <p className="text-gray-500 text-[13px]">
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
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-8">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">
              Transcript Analysis
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Review your response with AI-highlighted areas for improvement and
              strengths.
            </p>

            <div className="bg-[#F8F9FA] p-6 rounded-xl border border-gray-100">
              <div
                className="text-[15px] leading-[1.8] text-black"
                dangerouslySetInnerHTML={{
                  __html: formatTranscript(data.feedback),
                }}
              />
            </div>
          </section>

          {/* 4. Actionable Feedback Card */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-8">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-6">
              Actionable Feedback
            </h2>
            <div className="text-[15px] leading-relaxed text-black space-y-4 whitespace-pre-line">
              {data.actionableFeedback || "No actionable feedback generated."}
            </div>
          </section>

          {/* 5. Better Version Card */}
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-8">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">
              Better Version
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Here's an AI-generated improved version of your answer.
            </p>

            <div className="bg-[#F9FAFB] p-8 rounded-xl border border-gray-200">
              <p className="text-[15px] leading-[1.8] text-black">
                {data.improvedVersion
                  ? cleanText(data.improvedVersion)
                  : "No improved version generated."}
              </p>
            </div>
          </section>

          {/* Navigation Buttons */}
          <div className="flex flex-col items-center gap-8 mt-12">
            <div className="flex items-center justify-center gap-4 w-full">
              {/* RETRY BUTTON */}
              <button
                onClick={() =>
                  router.push(`/practice?sessionId=${data.sessionId}`)
                }
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-[14px] hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={18} />
                Retry Question
              </button>

              {/* NEXT / FINISH BUTTON */}
              <button
                onClick={() => handleNavigation("/analytics")}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-[14px] transition-all shadow-md ${
                  // IF LAST QUESTION: Green Color
                  data.isLastQuestion
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                    : // ELSE: Blue Color
                      "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"
                } ${isGenerating ? "opacity-75 cursor-wait" : ""}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {/* IF LAST QUESTION: "Go to Analytics" + Chart Icon */}
                    {data.isLastQuestion ? "Go to Analytics" : "Next Question"}
                    {data.isLastQuestion ? (
                      <BarChart3 size={18} />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </>
                )}
              </button>

              {/* DASHBOARD BUTTON */}
              <button
                onClick={() => handleNavigation("/dashboard")}
                disabled={isGenerating}
                className="flex items-center gap-2 text-gray-500 hover:text-[#1A1A1A] font-bold text-[14px] transition-all ml-4 disabled:opacity-50"
              >
                <Home size={18} />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PracticeFeedback;