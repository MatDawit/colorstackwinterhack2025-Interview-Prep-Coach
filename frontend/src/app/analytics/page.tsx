"use client";
import React, { useState } from "react";
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

export default function AnalyticsPage() {
  const [category, setCategory] = useState("All Categories");
  const [timeRange, setTimeRange] = useState("All Time");

  const sessions = [
    {
      id: 1,
      date: "2024-06-01",
      category: "Leadership",
      duration: "19:00",
      score: 95,
    },
    {
      id: 2,
      date: "2024-06-05",
      category: "Behavioral",
      duration: "25:30",
      score: 80,
    },
    {
      id: 3,
      date: "2024-06-08",
      category: "Problem Solving",
      duration: "18:40",
      score: 75,
    },
    {
      id: 4,
      date: "2024-06-12",
      category: "Technical",
      duration: "30:00",
      score: 92,
    },
    {
      id: 5,
      date: "2024-06-15",
      category: "Behavioral",
      duration: "22:15",
      score: 88,
    },
    {
      id: 6,
      date: "2024-06-20",
      category: "Technical",
      duration: "28:10",
      score: 70,
    },
    {
      id: 7,
      date: "2025-12-20",
      category: "Technical",
      duration: "22:10",
      score: 50,
    },
    {
      id: 8,
      date: "2025-12-10",
      category: "Behavioral",
      duration: "26:10",
      score: 96,
    },
  ];

  // 1. Sort sessions from most recent to oldest
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 2. Updated Filtering Logic
  const filteredSessions = sortedSessions.filter((session) => {
    const categoryMatch =
      category === "All Categories" || session.category === category;
    const sessionDate = new Date(session.date);
    const now = new Date();
    let timeMatch = true;

    if (timeRange === "Last 24 Hours") {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(now.getHours() - 24);
      timeMatch = sessionDate >= oneDayAgo;
    } else if (timeRange === "Last 7 Days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      timeMatch = sessionDate >= sevenDaysAgo;
    } else if (timeRange === "Last 30 Days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      timeMatch = sessionDate >= thirtyDaysAgo;
    }
    return categoryMatch && timeMatch;
  });

  // Chart Data Formatting
  const lineChartData = [...filteredSessions].reverse().map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: s.score,
  }));

  const categoriesList = [
    "Behavioral",
    "Technical",
    "Leadership",
    "Problem Solving",
  ];
  const barChartData = categoriesList.map((cat) => ({
    name: cat,
    count: filteredSessions.filter((s) => s.category === cat).length,
  }));

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 80) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F9FA] pt-24 pb-12 px-8">
        <div className="mx-auto max-w-[1296px]">
          <header className="mb-8">
            <h1 className="text-[30px] font-bold text-[#1A1A1A]">
              Analytics and Insights
            </h1>
            <p className="text-gray-500 mt-2">
              Track your progress and identify interview patterns.
            </p>
          </header>

          {/* Filters */}
          <div className="flex justify-end items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-black">
                Time Range
              </span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium outline-none shadow-sm cursor-pointer text-black"
              >
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 24 Hours</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-black">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium outline-none shadow-sm cursor-pointer text-black"
              >
                <option>All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Horizontal Line - Full width of the charts grid below */}
          <div className="w-full border-b border-gray-300 mb-10" />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-[400px]">
              <h2 className="text-black text-xl font-bold mb-1">
                Average Score Over Time
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Trend of your average scores across practice sessions.
              </p>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={lineChartData} margin={{ left: -34 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F0F0F0"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <Tooltip />
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
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-[400px]">
              <h2 className="text-black text-xl font-bold mb-1">
                Common Interview Patterns
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Frequency of key patterns identified in your recent sessions.
              </p>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart
                  data={barChartData}
                  margin={{ right: -43, left: -43 }}
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
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    dy={10}
                  />
                  {/* 3. Force Whole Numbers on YAxis */}
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "#F9FAFB" }} />
                  <Bar
                    dataKey="count"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Table */}
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A1A]">
              Session History
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Detailed record of all your practice interview sessions.
            </p>
            <div className="w-full flex items-center justify-between pb-4 border-b border-gray-100 px-4 text-gray-400 text-[13px] font-semibold uppercase tracking-wider">
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
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-16">
                    <span className="text-[14px] font-bold text-[#1A1A1A] w-32">
                      {session.date}
                    </span>
                    <span className="text-[14px] text-[#1A1A1A]">
                      {session.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-16">
                    <span className="text-[14px] text-[#1A1A1A] w-20 text-right">
                      {session.duration}
                    </span>
                    <span
                      className={`text-[14px] font-semibold w-24 text-right ${getScoreColor(
                        session.score
                      )}`}
                    >
                      {session.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
