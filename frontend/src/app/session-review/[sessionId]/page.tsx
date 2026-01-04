"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ChevronRight, Loader2 } from "lucide-react";

interface AttemptSummary {
  id: string;
  question: { question: string; category: string };
  score: number;
  duration: number;
  createdAt: string;
}

export default function SessionReview() {
  const params = useParams();
  const router = useRouter();
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
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32">
        <button
          onClick={() => router.push("/analytics")}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Analytics
        </button>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          Session Review
        </h1>
        <p className="text-gray-500 mb-8">
          Select a question to review the feedback.
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt, index) => (
              <div
                key={attempt.id}
                // This adds the ?viewOnly=true param so the next page knows not to show "Next Question"
                onClick={() =>
                  router.push(`/feedback/${attempt.id}?viewOnly=true`)
                }
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">
                      Q{index + 1}
                    </span>
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                      {attempt.question.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                    {attempt.question.question}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />{" "}
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div
                      className={`text-xl font-bold ${
                        attempt.score >= 70
                          ? "text-emerald-600"
                          : "text-orange-500"
                      }`}
                    >
                      {attempt.score}%
                    </div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-blue-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
