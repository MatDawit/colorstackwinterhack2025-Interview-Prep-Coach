"use client";

import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import { Search, Filter, BookOpen, Loader2, Database } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "next/navigation";

/**
 * Question Bank page
 * Displays all available interview questions with filtering and search
 * Allows users to browse questions by category and difficulty
 */

type Question = {
  id: string;
  category: string;
  question: string;
  role: string;
  difficulty: string;
  focus?: string; // Optional based on your schema updates
};

export default function QuestionBank() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  // Fetch all available questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/questions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Handle token expiry
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [router]);

  // Apply search and filter logic to questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = q.question
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || q.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === "All" || q.difficulty === selectedDifficulty;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [questions, searchQuery, selectedCategory, selectedDifficulty]);

  // Extract unique categories for dropdown filter
  const categories = useMemo(() => {
    const cats = new Set(questions.map((q) => q.category));
    return ["All", ...Array.from(cats)];
  }, [questions]);

  // Get color styling for difficulty badges
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Basic":
        return isDarkMode
          ? "bg-emerald-900/30 text-emerald-400 border-emerald-800"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Intermediate":
        return isDarkMode
          ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
          : "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Advanced":
        return isDarkMode
          ? "bg-red-900/30 text-red-400 border-red-800"
          : "bg-red-50 text-red-700 border-red-200";
      default:
        return isDarkMode
          ? "bg-gray-800 text-gray-400"
          : "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-900" : "bg-[#F8F9FA]"
        }`}
      >
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-[#F8F9FA]"}`}
    >
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1
              className={`text-2xl font-bold flex items-center gap-3 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-gray-800" : "bg-white border border-gray-200"
                }`}
              >
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              Question Bank
            </h1>
            <p
              className={`mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Browse all {questions.length} available interview questions.
            </p>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div
          className={`p-4 rounded-xl border shadow-sm mb-8 flex flex-col md:flex-row gap-4 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative min-w-[160px]">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[140px]">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                <option value="All">All Levels</option>
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {error ? (
          <div
            className={`text-center py-10 rounded-xl border ${
              isDarkMode
                ? "bg-red-900/10 border-red-900 text-red-400"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {error}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Search
                className={`w-8 h-8 ${
                  isDarkMode ? "text-gray-600" : "text-gray-400"
                }`}
              />
            </div>
            <h3
              className={`text-lg font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              No questions found
            </h3>
            <p
              className={`mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className={`group p-6 rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                    : "bg-white border-gray-200 hover:border-blue-300"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                        isDarkMode
                          ? "bg-blue-900/30 text-blue-300 border-blue-800"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}
                    >
                      {q.category}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getDifficultyColor(
                        q.difficulty
                      )}`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <h3
                    className={`text-lg font-semibold mb-3 leading-relaxed group-hover:text-blue-500 transition-colors ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {q.question}
                  </h3>
                </div>

                <div
                  className={`mt-4 pt-4 border-t flex items-center justify-between text-sm ${
                    isDarkMode
                      ? "border-gray-700 text-gray-400"
                      : "border-gray-100 text-gray-500"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {q.role}
                  </span>

                  {/* Optional: Add "Focus" if available in your schema */}
                  {q.focus && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      {q.focus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
