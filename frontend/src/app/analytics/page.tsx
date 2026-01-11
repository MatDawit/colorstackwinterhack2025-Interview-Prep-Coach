"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../components/Navbar";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";

// --- TYPES ---
interface SessionData {
  id: string;
  date: string;
  category: string;
  duration: string;
  score: number;
  checklistCounts: {
    fillerWords: number;
    negativeLanguage: number;
    noDetail: number;
    vague: number;
    badLength: number;
  };
}

// --- CONSTANTS ---
const LABEL_MAP: Record<string, string> = {
  "Filler Words": "Fillers",
  Apologizing: "Negative",
  "Lack of Detail": "No Detail",
  "Vague Answers": "Vague",
  "Too Concise": "Length",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // --- STATE ---
  const [category, setCategory] = useState("All Categories");
  const [timeRange, setTimeRange] = useState("All Time");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // --- EFFECTS ---

  // 1. Check Authentication First
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  // 2. Handle Mobile Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Check immediately
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3. Fetch Data
  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/api/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [router]);

  // --- MEMOIZED DATA CALCULATIONS ---

  // 4. Filter Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Category Check
      if (category !== "All Categories" && session.category !== category) {
        return false;
      }

      // Time Check
      const sessionDate = new Date(session.date);
      const now = new Date();

      if (timeRange === "Last 24 Hours") {
        return sessionDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      if (timeRange === "Last 7 Days") {
        return sessionDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      if (timeRange === "Last 30 Days") {
        return (
          sessionDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        );
      }
      return true; // "All Time"
    });
  }, [sessions, category, timeRange]);

  // 5. Line Chart Data (Formatted)
  const lineChartData = useMemo(() => {
    return [...filteredSessions].reverse().map((s) => ({
      date: new Date(s.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: s.score,
    }));
  }, [filteredSessions]);

  // 6. Bar Chart Data (Aggregated)
  const dynamicBarData = useMemo(() => {
    const totals = {
      fillerWords: 0,
      negativeLanguage: 0,
      noDetail: 0,
      vague: 0,
      badLength: 0,
    };

    filteredSessions.forEach((session) => {
      const counts = session.checklistCounts;
      if (counts) {
        totals.fillerWords += counts.fillerWords;
        totals.negativeLanguage += counts.negativeLanguage;
        totals.noDetail += counts.noDetail;
        totals.vague += counts.vague;
        totals.badLength += counts.badLength;
      }
    });

    return [
      { name: "Filler Words", count: totals.fillerWords },
      { name: "Apologizing", count: totals.negativeLanguage },
      { name: "Lack of Detail", count: totals.noDetail },
      { name: "Vague Answers", count: totals.vague },
      { name: "Too Concise", count: totals.badLength },
    ];
  }, [filteredSessions]);

  // 7. Available Categories (Dynamic)
  const availableCategories = useMemo(() => {
    return Array.from(
      new Set([
        "Software Engineering",
        "Product Management",
        "Data Science",
        ...sessions.map((s) => s.category),
      ])
    );
  }, [sessions]);

  // --- HELPERS ---
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-orange-400";
    return "text-red-400";
  };

  const shortenLabel = (value: string) => {
    return isMobile ? LABEL_MAP[value] || value : value;
  };

  // Dynamic Tooltip Style
  const TOOLTIP_STYLE = {
    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
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
    <>
      <Navbar />
      <main
        className={`min-h-screen pt-24 pb-12 px-4 md:px-8 ${
          isDarkMode ? "bg-gray-900" : "bg-[#F8F9FA]"
        }`}
      >
        <div className="mx-auto max-w-[1296px]">
          {/* Header */}
          <header className="mb-8">
            <h1
              className={`text-2xl md:text-[30px] font-bold ${
                isDarkMode ? "text-white" : "text-[#1A1A1A]"
              }`}
            >
              Analytics and Insights
            </h1>
            <p
              className={`mt-2 text-sm md:text-base ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Track your progress and identify interview patterns.
            </p>
          </header>

          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 md:gap-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
              <span
                className={`text-sm font-semibold ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Time Range
              </span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`w-full sm:w-auto border rounded-lg px-4 py-2 text-sm font-medium outline-none shadow-sm cursor-pointer ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-200 text-black"
                }`}
              >
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 24 Hours</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
              <span
                className={`text-sm font-semibold ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full sm:w-auto border rounded-lg px-4 py-2 text-sm font-medium outline-none shadow-sm cursor-pointer ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-200 text-black"
                }`}
              >
                <option>All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`w-full border-b mb-10 ${
              isDarkMode ? "border-gray-700" : "border-gray-300"
            }`}
          />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Line Chart */}
            <div
              className={`p-6 md:p-8 rounded-2xl border shadow-sm h-[350px] md:h-[400px] ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              }`}
            >
              <h2
                className={`text-xl font-bold mb-1 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Average Score Over Time
              </h2>
              <p
                className={`text-sm mb-6 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Trend of your average scores across practice sessions.
              </p>

              {lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart
                    data={lineChartData}
                    margin={{ top: 10, left: -20, right: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDarkMode ? "#374151" : "#F0F0F0"}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: isDarkMode ? "#9CA3AF" : "#0A0D10",
                        fontSize: 12,
                      }}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: isDarkMode ? "#9CA3AF" : "#0A0D10",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: isDarkMode ? "#1F2937" : "#F9FAFB" }}
                      contentStyle={TOOLTIP_STYLE}
                      itemStyle={{
                        color: isDarkMode ? "#FFFFFF" : "#000000",
                        fontWeight: 500,
                      }}
                      labelStyle={{
                        color: isDarkMode ? "#FFFFFF" : "#000000",
                        marginBottom: "4px",
                        fontWeight: "bold",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#3B82F6",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className={`flex h-full items-center justify-center pb-10 ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  No session data available.
                </div>
              )}
            </div>

            {/* Bar Chart */}
            <div
              className={`p-6 md:p-8 rounded-2xl border shadow-sm h-[350px] md:h-[400px] ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              }`}
            >
              <h2
                className={`text-xl font-bold mb-1 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Areas for Improvement
              </h2>
              <p
                className={`text-sm mb-6 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Frequency of issues identified in your answers
              </p>

              <ResponsiveContainer width="100%" height="80%">
                <BarChart
                  data={dynamicBarData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDarkMode ? "#374151" : "#F0F0F0"}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDarkMode ? "#9CA3AF" : "#0A0D10",
                      fontSize: isMobile ? 10 : 12,
                    }}
                    tickFormatter={shortenLabel}
                    interval={0}
                    dy={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: isDarkMode ? "#9CA3AF" : "#0A0D10",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: isDarkMode ? "#1F2937" : "#F9FAFB" }}
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                      fontWeight: 500,
                    }}
                    labelStyle={{
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                      marginBottom: "4px",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    barSize={isMobile ? 32 : 40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Table */}
          <section
            className={`p-6 md:p-8 rounded-2xl border shadow-sm ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <h2
              className={`text-lg md:text-xl font-bold ${
                isDarkMode ? "text-white" : "text-[#1A1A1A]"
              }`}
            >
              Session History
            </h2>
            <p
              className={`text-xs md:text-sm mb-8 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Detailed record of all your practice interview sessions.
            </p>

            {/* Table Header (Hidden on Mobile) */}
            <div
              className={`hidden md:flex items-center justify-between pb-4 border-b px-4 text-[13px] font-semibold uppercase tracking-wider ${
                isDarkMode
                  ? "border-gray-700 text-gray-500"
                  : "border-gray-100 text-gray-400"
              }`}
            >
              <div className="flex items-center gap-16">
                <span className="w-15">Date</span>
                <span>Category</span>
              </div>
              <div className="flex items-center gap-16">
                <span className="w-20 text-right">Duration</span>
                <span className="w-24 text-right">Score</span>
              </div>
            </div>

            {/* Table Body */}
            <div
              className={`divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-50"
              }`}
            >
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => router.push(`/session-review/${session.id}`)}
                    className={`flex flex-col md:flex-row md:items-center justify-between py-4 px-2 md:px-4 rounded-lg transition-colors gap-2 md:gap-0 cursor-pointer ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Left Column */}
                    <div className="flex flex-col md:flex-row md:items-center md:gap-16 w-full md:w-auto">
                      <div className="flex justify-between items-center md:block w-full md:w-auto">
                        <span
                          className={`text-[14px] font-bold w-32 ${
                            isDarkMode ? "text-white" : "text-[#1A1A1A]"
                          }`}
                        >
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        {/* Mobile Score */}
                        <span
                          className={`md:hidden text-[14px] font-bold ${getScoreColor(
                            session.score
                          )}`}
                        >
                          {session.score}%
                        </span>
                      </div>
                      <span
                        className={`text-[13px] md:text-[14px] ${
                          isDarkMode
                            ? "text-gray-400 md:text-gray-300"
                            : "text-gray-500 md:text-[#1A1A1A]"
                        }`}
                      >
                        {session.category}
                      </span>
                    </div>

                    {/* Right Column */}
                    <div className="flex items-center justify-between md:justify-end md:gap-16 w-full md:w-auto mt-1 md:mt-0">
                      <span
                        className={`text-[13px] md:text-[14px] w-20 text-left md:text-right ${
                          isDarkMode
                            ? "text-gray-400 md:text-gray-300"
                            : "text-gray-500 md:text-[#1A1A1A]"
                        }`}
                      >
                        {session.duration}
                      </span>
                      {/* Desktop Score */}
                      <span
                        className={`hidden md:block text-[14px] font-semibold w-24 text-right ${getScoreColor(
                          session.score
                        )}`}
                      >
                        {session.score}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className={`py-8 text-center ${
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  No sessions found matching your filters.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
