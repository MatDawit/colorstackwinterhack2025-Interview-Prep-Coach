"use client";
import React, { useState, useEffect } from "react";
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

// Types matching your Backend Response
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

export default function AnalyticsPage() {
  const [category, setCategory] = useState("All Categories");
  const [timeRange, setTimeRange] = useState("All Time");

  // 1. State for Real Data
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // 768px is the standard Tailwind 'md' breakpoint
      setIsMobile(window.innerWidth < 768);
    };

    // Check immediately on mount
    handleResize();

    // Add listener for window resize events
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Fetch Data from Backend on Mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        // Optional: Redirect to login if no token
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          // The backend returns { sessions: [...], barChartData: [...] }
          setSessions(data.sessions);
        } else {
          console.error("Failed to fetch analytics");
        }
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // 3. Filter Real Sessions (Client-Side Filtering)
  const filteredSessions = sessions.filter((session) => {
    // Category Match
    const categoryMatch =
      category === "All Categories" || session.category === category;

    // Time Match
    const sessionDate = new Date(session.date);
    const now = new Date();
    let timeMatch = true;

    if (timeRange === "Last 24 Hours") {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      timeMatch = sessionDate >= oneDayAgo;
    } else if (timeRange === "Last 7 Days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      timeMatch = sessionDate >= sevenDaysAgo;
    } else if (timeRange === "Last 30 Days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      timeMatch = sessionDate >= thirtyDaysAgo;
    }

    return categoryMatch && timeMatch;
  });

  // 4. Format Data for Line Chart (Oldest -> Newest)
  // We reverse strictly for the chart display so time flows Left->Right
  const lineChartData = [...filteredSessions].reverse().map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: s.score,
  }));

  // Helper: Get unique categories dynamically from the data
  const availableCategories = Array.from(
    new Set([
      "Software Engineering Interview",
      "Product Management Interview",
      "Data Science Interview",
      ...sessions.map((s) => s.category),
    ])
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-orange-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const getDynamicBarData = () => {
    // 1. Initialize totals
    let totals = {
      fillerWords: 0,
      negativeLanguage: 0,
      noDetail: 0,
      vague: 0,
      badLength: 0,
    };

    // 2. Loop through ONLY the filtered sessions
    filteredSessions.forEach((session) => {
      if (session.checklistCounts) {
        totals.fillerWords += session.checklistCounts.fillerWords;
        totals.negativeLanguage += session.checklistCounts.negativeLanguage;
        totals.noDetail += session.checklistCounts.noDetail;
        totals.vague += session.checklistCounts.vague;
        totals.badLength += session.checklistCounts.badLength;
      }
    });

    // 3. Return format for Recharts
    return [
      { name: "Filler Words", count: totals.fillerWords },
      { name: "Apologizing", count: totals.negativeLanguage },
      { name: "Lack of Detail", count: totals.noDetail },
      { name: "Vague Answers", count: totals.vague },
      { name: "Too Concise", count: totals.badLength },
    ];
  };

  // Calculate it immediately (Derived State)
  const dynamicBarData = getDynamicBarData();

  const shortenLabel = (value: string) => {
    if (!isMobile) return value;

    const map: Record<string, string> = {
      "Filler Words": "Fillers",
      Apologizing: "Negative",
      "Lack of Detail": "No Detail",
      "Vague Answers": "Vague",
      "Too Concise": "Length",
    };
    return map[value] || value;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F9FA] pt-24 pb-12 px-4 md:px-8">
        <div className="mx-auto max-w-[1296px]">
          <header className="mb-8">
            <h1 className="text-2xl md:text-[30px] font-bold text-[#1A1A1A]">
              Analytics and Insights
            </h1>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              Track your progress and identify interview patterns.
            </p>
          </header>

          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 md:gap-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
              <span className="text-sm font-semibold text-black">
                Time Range
              </span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                // Update className for width:
                className="w-full sm:w-auto bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium outline-none shadow-sm cursor-pointer text-black"
              >
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 24 Hours</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
              <span className="text-sm font-semibold text-black">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-auto bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium outline-none shadow-sm cursor-pointer text-black"
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

          {/* Horizontal Line */}
          <div className="w-full border-b border-gray-300 mb-10" />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Line Chart */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm h-[350px] md:h-[400px]">
              <h2 className="text-black text-xl font-bold mb-1">
                Average Score Over Time
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Trend of your average scores across practice sessions.
              </p>

              {lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart
                    data={lineChartData}
                    margin={{ top: 10, left: -30, right: 10, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F0F0F0"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#0A0D10", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#0A0D10", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#F9FAFB" }}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E5E7EB",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ color: "#000000", fontWeight: 500 }}
                      labelStyle={{
                        color: "#000000",
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
                <div className="flex h-full items-center justify-center text-gray-400 pb-10">
                  No session data available.
                </div>
              )}
            </div>

            {/* Bar Chart - NOW USING REAL 'Areas for Improvement' DATA */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm h-[350px] md:h-[400px]">
              <h2 className="text-black text-xl font-bold mb-1">
                Areas for Improvement
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Frequency of issues identified in your answers
              </p>

              <ResponsiveContainer width="100%" height="80%">
                <BarChart
                  data={dynamicBarData}
                  margin={{ top: 10, right: 0, left: -30, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F0F0F0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#0A0D10", fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={shortenLabel}
                    interval={0}
                    dy={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#0A0D10", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F9FAFB" }}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ color: "#000000", fontWeight: 500 }}
                    labelStyle={{
                      color: "#000000",
                      marginBottom: "4px",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#10B981" // Green to indicate these are areas to improve
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Table */}
          <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg md:text-xl font-bold text-[#1A1A1A]">
              Session History
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mb-8">
              Detailed record of all your practice interview sessions.
            </p>

            {/* Header: HIDDEN on mobile (hidden md:flex) */}
            <div className="hidden md:flex items-center justify-between pb-4 border-b border-gray-100 px-4 text-gray-400 text-[13px] font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-16">
                <span className="w-32">Date</span>
                <span>Category</span>
              </div>
              <div className="flex items-center gap-16">
                <span className="w-20 text-right">Duration</span>
                <span className="w-24 text-right">Score</span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    // Change to flex-col on mobile to stack items
                    className="flex flex-col md:flex-row md:items-center justify-between py-4 px-2 md:px-4 hover:bg-gray-50 transition-colors gap-2 md:gap-0"
                  >
                    {/* Left Side */}
                    <div className="flex flex-col md:flex-row md:items-center md:gap-16 w-full md:w-auto">
                      <div className="flex justify-between items-center md:block w-full md:w-auto">
                        <span className="text-[14px] font-bold text-[#1A1A1A] w-32">
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        {/* Mobile Score (shown next to date on small screens) */}
                        <span
                          className={`md:hidden text-[14px] font-bold ${getScoreColor(
                            session.score
                          )}`}
                        >
                          {session.score}%
                        </span>
                      </div>

                      <span className="text-[13px] md:text-[14px] text-gray-500 md:text-[#1A1A1A]">
                        {session.category}
                      </span>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center justify-between md:justify-end md:gap-16 w-full md:w-auto mt-1 md:mt-0">
                      <span className="text-[13px] md:text-[14px] text-gray-500 md:text-[#1A1A1A] w-20 text-left md:text-right">
                        {session.duration}
                      </span>
                      {/* Desktop Score (hidden on mobile) */}
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
                <div className="py-8 text-center text-gray-500">
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
