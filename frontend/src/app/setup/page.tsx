"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

type Preferences = {
  defaultRole: string;
  defaultDifficulty: "Basic" | "Intermediate" | "Advanced";
  feedbackEmphasize:
    | "Balance"
    | "Clarity"
    | "Storytelling"
    | "Confidence"
    | "Technical Depth";
  questionFocus: {
    behavioral: boolean;
    technical: boolean;
    systemDesign: boolean;
  };
  autoStartNext: boolean;
  feedbackTone: "Encouraging" | "Direct" | "Strict";
  feedbackDetail: "Brief" | "Standard" | "Deep";
  showSampleAnswer: boolean;
  enableTimer: boolean;
  countdownSeconds: 0 | 3 | 5 | 10;
  autoSubmitOnSilence: boolean;
};

const DEFAULT_PREFS: Preferences = {
  defaultRole: "Software Engineering",
  defaultDifficulty: "Basic",
  feedbackEmphasize: "Balance",
  questionFocus: {
    behavioral: true,
    technical: false,
    systemDesign: false,
  },
  autoStartNext: false,
  feedbackTone: "Encouraging",
  feedbackDetail: "Standard",
  showSampleAnswer: true,
  enableTimer: true,
  countdownSeconds: 0,
  autoSubmitOnSilence: false,
};

export default function SetupPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check authentication and redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const savePreferences = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // UI Validation
    const activeFocusCount = Object.values(prefs.questionFocus).filter(
      Boolean
    ).length;
    if (activeFocusCount === 0) {
      setErrorMessage("Please select at least one Question Focus area.");
      setShowErrorModal(true);
      return;
    }

    setSaveStatus("saving");

    try {
      const res = await fetch("http://localhost:5000/api/profile/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          defaultRole: prefs.defaultRole,
          defaultDifficulty: prefs.defaultDifficulty,
          feedbackEmphasize: prefs.feedbackEmphasize,
          focusBehavioral: prefs.questionFocus.behavioral,
          focusTechnical: prefs.questionFocus.technical,
          focusSystemDesign: prefs.questionFocus.systemDesign,
          autoStartNext: prefs.autoStartNext,
          feedbackTone: prefs.feedbackTone,
          feedbackDetail: prefs.feedbackDetail,
          showSampleAnswer: prefs.showSampleAnswer,
          enableTimer: prefs.enableTimer,
          countdownSeconds: prefs.countdownSeconds,
          autoSubmitOnSilence: prefs.autoSubmitOnSilence,
        }),
      });

      // Handle 401 on Save
      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save preferences");

      setSaveStatus("saved");
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save preferences"
      );
      setShowErrorModal(true);
    }
  };

  const handleFocusToggle = (key: keyof Preferences["questionFocus"]) => {
    setPrefs((current) => {
      const isCurrentlyActive = current.questionFocus[key];
      const totalActive = Object.values(current.questionFocus).filter(
        Boolean
      ).length;

      if (isCurrentlyActive && totalActive <= 1) {
        return current;
      }

      return {
        ...current,
        questionFocus: {
          ...current.questionFocus,
          [key]: !isCurrentlyActive,
        },
      };
    });
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            : "bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100"
        }`}
      >
        <div
          className={`rounded-xl shadow-xl p-8 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex justify-center items-center px-4 py-8 sm:py-12 md:py-20 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100"
      }`}
    >
      {/* Main Setup Card */}
      <div
        className={`rounded-xl shadow-xl p-6 sm:p-8 w-full max-w-2xl ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 overflow-hidden rounded-lg flex items-center justify-center">
            <BrainCircuit
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              strokeWidth={1.5}
            />
          </div>
          <span className="ml-2 text-xl sm:text-2xl font-semibold text-blue-600">
            InterviewAI
          </span>
        </div>

        {/* Title */}
        <h1
          className={`text-2xl sm:text-3xl font-bold text-center mb-2 ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Complete Your Setup
        </h1>

        {/* Subtitle */}
        <p
          className={`text-sm sm:text-base text-center mb-6 sm:mb-8 ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Let's customize your practice experience with your preferences.
        </p>

        {/* Form Container */}
        <div className="space-y-6">
          {/* Interview Preferences */}
          <div>
            <h2
              className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Interview Preferences
            </h2>

            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Default Role
                </label>
                <select
                  value={prefs.defaultRole}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, defaultRole: e.target.value }))
                  }
                  className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm sm:text-base focus:outline-none ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-black focus:border-blue-500"
                  }`}
                >
                  <option>Software Engineering</option>
                  <option>Product Manager</option>
                  <option>Data Science</option>
                </select>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Default Difficulty
                </label>
                <select
                  value={prefs.defaultDifficulty}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      defaultDifficulty: e.target.value as any,
                    }))
                  }
                  className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm sm:text-base focus:outline-none ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-black focus:border-blue-500"
                  }`}
                >
                  <option>Basic</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              {/* Question Focus */}
              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Question Focus{" "}
                  <span className="text-gray-400 font-normal">
                    (Select at least one)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <PillToggle
                    label="Behavioral"
                    active={prefs.questionFocus.behavioral}
                    onClick={() => handleFocusToggle("behavioral")}
                    isDarkMode={isDarkMode}
                  />
                  <PillToggle
                    label="Technical"
                    active={prefs.questionFocus.technical}
                    onClick={() => handleFocusToggle("technical")}
                    isDarkMode={isDarkMode}
                  />
                  <PillToggle
                    label="System Design"
                    active={prefs.questionFocus.systemDesign}
                    onClick={() => handleFocusToggle("systemDesign")}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Preferences */}
          <div>
            <h2
              className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Feedback Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Feedback Tone */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Feedback Tone
                </label>
                <select
                  value={prefs.feedbackTone}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      feedbackTone: e.target.value as any,
                    }))
                  }
                  className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm sm:text-base focus:outline-none ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-black focus:border-blue-500"
                  }`}
                >
                  <option>Encouraging</option>
                  <option>Direct</option>
                  <option>Strict</option>
                </select>
              </div>

              {/* Feedback Detail */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Feedback Detail
                </label>
                <select
                  value={prefs.feedbackDetail}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      feedbackDetail: e.target.value as any,
                    }))
                  }
                  className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm sm:text-base focus:outline-none ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-black focus:border-blue-500"
                  }`}
                >
                  <option>Brief</option>
                  <option>Standard</option>
                  <option>Deep</option>
                </select>
              </div>

              {/* Feedback Emphasize */}
              <div className="sm:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  What should we emphasize?
                </label>
                <select
                  value={prefs.feedbackEmphasize}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      feedbackEmphasize: e.target.value as any,
                    }))
                  }
                  className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm sm:text-base focus:outline-none ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-black focus:border-blue-500"
                  }`}
                >
                  <option>Balance</option>
                  <option>Clarity</option>
                  <option>Storytelling</option>
                  <option>Confidence</option>
                  <option>Technical Depth</option>
                </select>
              </div>

              {/* Show Sample Answer */}
              <div className="sm:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={prefs.showSampleAnswer}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        showSampleAnswer: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span
                    className={`ml-2 text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Show sample answer after feedback
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Practice Flow */}
          <div>
            <h2
              className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Practice Flow
            </h2>

            <div className="space-y-4">
              {/* Enable Timer */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={prefs.enableTimer}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      enableTimer: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span
                  className={`ml-2 text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Enable timer while answering
                </span>
              </label>

              {/* Countdown Seconds */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Countdown before recording (seconds)
                </label>
                <select
                  value={String(prefs.countdownSeconds)}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      countdownSeconds: Number(e.target.value) as any,
                    }))
                  }
                  className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm sm:text-base focus:outline-none ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                      : "bg-white border-gray-300 text-black focus:border-blue-500"
                  }`}
                >
                  <option value="0">No countdown</option>
                  <option value="3">3 seconds</option>
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                </select>
              </div>

              {/* Auto-start Next */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={prefs.autoStartNext}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      autoStartNext: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span
                  className={`ml-2 text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Auto-start next question after submission
                </span>
              </label>

              {/* Auto-submit on Silence */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={prefs.autoSubmitOnSilence}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      autoSubmitOnSilence: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span
                  className={`ml-2 text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Auto-submit if you stop speaking
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 sm:mt-10">
          <button
            onClick={() => router.push("/dashboard")}
            disabled={saveStatus === "saving"}
            className={`flex-1 rounded-lg border-2 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? "border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600"
                : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            Skip for Now
          </button>
          <button
            onClick={savePreferences}
            disabled={saveStatus === "saving"}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 sm:py-3 text-sm sm:text-base font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : saveStatus === "saved" ? (
              <>
                <span>✓</span>
                Saved!
              </>
            ) : (
              <>
                Complete Setup
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full mx-4 relative animate-fadeIn ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setShowErrorModal(false)}
              className={`absolute top-4 right-4 transition-colors ${
                isDarkMode
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <X size={20} />
            </button>

            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center border-4 border-red-500">
                  <X
                    className="w-8 h-8 sm:w-10 sm:h-10 text-red-500"
                    strokeWidth={3}
                  />
                </div>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-center text-red-600 mb-3">
              Oops!
            </h2>

            {/* Error Message */}
            <p
              className={`text-sm sm:text-base text-center mb-6 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {errorMessage}
            </p>

            {/* Dismiss Button */}
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI Helper Components ---------- */

function PillToggle({
  label,
  active,
  onClick,
  isDarkMode,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  isDarkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold border transition",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : isDarkMode
          ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"
          : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
