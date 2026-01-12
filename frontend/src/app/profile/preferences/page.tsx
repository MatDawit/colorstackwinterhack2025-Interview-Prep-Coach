"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Settings,
  User,
  UserCircle2,
  BrainCircuit,
  ChartNoAxesColumn,
  SlidersHorizontal,
  Sparkles,
  Timer,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Interview preferences configuration page
 * Allows users to set default interview type, difficulty, question focus,
 * feedback style, and practice session settings
 */

type Preferences = {
  defaultRole: "Software Engineering" | "Product Management" | "Data Science";
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

// Default preference values for new users
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

export default function PreferencesPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Check authentication status and redirect if needed
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  // Load user preferences from backend
  useEffect(() => {
    async function loadPrefs() {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(
          "http://localhost:5000/api/profile/preferences",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Handle Token Expiry
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const raw = await res.text();
        let data: any;
        try {
          data = JSON.parse(raw);
        } catch {
          console.error("Non-JSON response:", raw);
          throw new Error("Backend returned non-JSON");
        }

        if (!res.ok)
          throw new Error(data.error || "Failed to load preferences");

        const p = data.preferences ?? data.preference ?? data.prefs;
        if (!p) {
          // If 200 OK but no prefs, keep defaults
        } else {
          setPrefs({
            defaultRole: p.defaultRole ?? DEFAULT_PREFS.defaultRole,
            defaultDifficulty: (p.defaultDifficulty ??
              DEFAULT_PREFS.defaultDifficulty) as Preferences["defaultDifficulty"],
            questionFocus: {
              behavioral:
                p.focusBehavioral ?? DEFAULT_PREFS.questionFocus.behavioral,
              technical:
                p.focusTechnical ?? DEFAULT_PREFS.questionFocus.technical,
              systemDesign:
                p.focusSystemDesign ?? DEFAULT_PREFS.questionFocus.systemDesign,
            },
            feedbackEmphasize: (p.feedbackEmphasize ??
              DEFAULT_PREFS.feedbackEmphasize) as Preferences["feedbackEmphasize"],
            autoStartNext: p.autoStartNext ?? DEFAULT_PREFS.autoStartNext,
            feedbackTone: (p.feedbackTone ??
              DEFAULT_PREFS.feedbackTone) as Preferences["feedbackTone"],
            feedbackDetail: (p.feedbackDetail ??
              DEFAULT_PREFS.feedbackDetail) as Preferences["feedbackDetail"],
            showSampleAnswer:
              p.showSampleAnswer ?? DEFAULT_PREFS.showSampleAnswer,
            enableTimer: p.enableTimer ?? DEFAULT_PREFS.enableTimer,
            countdownSeconds: (p.countdownSeconds ??
              DEFAULT_PREFS.countdownSeconds) as Preferences["countdownSeconds"],
            autoSubmitOnSilence:
              p.autoSubmitOnSilence ?? DEFAULT_PREFS.autoSubmitOnSilence,
          });
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, [router]);

  // Save user preferences to backend with validation
  async function savePreferences() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Ensure at least one question focus area is selected
    const activeFocusCount = Object.values(prefs.questionFocus).filter(
      Boolean
    ).length;
    if (activeFocusCount === 0) {
      alert("Please select at least one Question Focus area.");
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
          focusBehavioral: prefs.questionFocus.behavioral,
          focusTechnical: prefs.questionFocus.technical,
          focusSystemDesign: prefs.questionFocus.systemDesign,
          feedbackEmphasize: prefs.feedbackEmphasize,
          autoStartNext: prefs.autoStartNext,
          feedbackTone: prefs.feedbackTone,
          feedbackDetail: prefs.feedbackDetail,
          showSampleAnswer: prefs.showSampleAnswer,
          enableTimer: prefs.enableTimer,
          countdownSeconds: prefs.countdownSeconds,
          autoSubmitOnSilence: prefs.autoSubmitOnSilence,
        }),
      });

      // Handle authentication expiry
      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save preferences");

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      router.push("/profile");
    } catch (error) {
      setSaveStatus("error");
      console.error(error);
    }
  }

  // Reset preferences to default values
  function resetDefaults() {
    setPrefs(DEFAULT_PREFS);
    setSaveStatus("idle");
  }

  // Toggle question focus categories (prevent deselecting all)
  const handleFocusToggle = (key: keyof Preferences["questionFocus"]) => {
    setPrefs((current) => {
      const isCurrentlyActive = current.questionFocus[key];
      const totalActive = Object.values(current.questionFocus).filter(
        Boolean
      ).length;

      // Prevent deselecting if only one category is active
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
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {/* Using Navbar here just to keep layout consistent while loading */}
        <Navbar />
        {/* Simple Loading UI matching AnalyticsPage style */}
        <div className={`flex flex-col items-center pt-24`}>
          {/* Using simple text or you can import Loader2 like in AnalyticsPage */}
          <div
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Loading preferences...
          </div>
        </div>
      </div>
    );
  }

  // Removed the "if (!isSignedIn)" return block entirely
  // because the useEffect handles the redirect now.

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <Navbar />

      <div className="pt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div
                className={`rounded-2xl border ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-white"
                } p-3 shadow-sm`}
              >
                <div
                  className={`px-3 pt-2 pb-3 text-xs font-semibold ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  } uppercase tracking-wide`}
                >
                  Navigation
                </div>

                <nav className="flex flex-col gap-1">
                  <SidebarSubLink
                    href="/profile/preferences"
                    label="Preferences"
                    icon={<SlidersHorizontal className="h-4 w-4" />}
                    active
                    isDarkMode={isDarkMode}
                  />
                  <SidebarSubLink
                    href="/profile/account"
                    label="Account"
                    icon={<User className="h-4 w-4" />}
                    isDarkMode={isDarkMode}
                  />
                  <SidebarSubLink
                    href="/profile"
                    label="Personal"
                    icon={<UserCircle2 className="h-4 w-4" />}
                    isDarkMode={isDarkMode}
                  />
                </nav>
              </div>
            </aside>

            {/* Main */}
            <main className="min-w-0">
              <div className="max-w-4xl">
                {/* Header */}
                <section
                  className={`rounded-2xl border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-white"
                  } p-6 shadow-sm`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-xl ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        } flex items-center justify-center`}
                      >
                        <SlidersHorizontal
                          className={`h-5 w-5 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        />
                      </div>
                      <div>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Settings
                        </p>
                        <h1
                          className={`mt-1 text-xl font-semibold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          } tracking-tight`}
                        >
                          Preferences
                        </h1>
                        <p
                          className={`mt-1 text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Customize your practice experience and feedback style.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push("/profile")}
                        className={`rounded-lg border ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
                            : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                        } px-4 py-2 text-sm font-semibold`}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={resetDefaults}
                        className={`rounded-lg border ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
                            : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                        } px-4 py-2 text-sm font-semibold`}
                      >
                        Reset
                      </button>

                      <button
                        onClick={savePreferences}
                        disabled={saveStatus === "saving"}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saveStatus === "saving"
                          ? "Saving..."
                          : saveStatus === "saved"
                          ? "Saved"
                          : "Save"}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Interview Preferences */}
                <section
                  className={`mt-6 rounded-2xl border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-white"
                  } p-6 shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      } border flex items-center justify-center`}
                    >
                      <Sparkles
                        className={`h-4 w-4 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      />
                    </div>
                    <div>
                      <h2
                        className={`text-sm font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Interview Preferences
                      </h2>
                      <p
                        className={`mt-1 text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Set defaults for roles, difficulty, and what kinds of
                        questions you want to practice.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Role"
                      value={prefs.defaultRole}
                      onChange={(v) =>
                        setPrefs((p) => ({
                          ...p,
                          defaultRole: v as Preferences["defaultRole"],
                        }))
                      }
                      options={[
                        "Software Engineering",
                        "Product Management",
                        "Data Science",
                      ]}
                      isDarkMode={isDarkMode}
                    />

                    <SelectField
                      label="Difficulty"
                      value={prefs.defaultDifficulty}
                      onChange={(v) =>
                        setPrefs((p) => ({
                          ...p,
                          defaultDifficulty:
                            v as Preferences["defaultDifficulty"],
                        }))
                      }
                      options={["Basic", "Intermediate", "Advanced"]}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4">
                    <SelectField
                      label="What should we emphasize in your feedback?"
                      value={prefs.feedbackEmphasize}
                      onChange={(v) =>
                        setPrefs((p) => ({ ...p, feedbackEmphasize: v as any }))
                      }
                      options={[
                        "Balance",
                        "Clarity",
                        "Storytelling",
                        "Confidence",
                        "Technical Depth",
                      ]}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div className="mt-4">
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      } mb-2`}
                    >
                      Question Focus{" "}
                      <span className="text-gray-400 font-normal ml-1">
                        (Select at least one)
                      </span>
                    </p>
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

                    <div className="mt-4">
                      <ToggleRow
                        title="Auto-start next question"
                        description="Automatically load the next question after you submit an answer."
                        enabled={prefs.autoStartNext}
                        onToggle={() =>
                          setPrefs((p) => ({
                            ...p,
                            autoStartNext: !p.autoStartNext,
                          }))
                        }
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                </section>

                {/* Feedback Preferences */}
                <section
                  className={`mt-6 rounded-2xl border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-white"
                  } p-6 shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      } border flex items-center justify-center`}
                    >
                      <Sparkles
                        className={`h-4 w-4 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      />
                    </div>
                    <div>
                      <h2
                        className={`text-sm font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Feedback Preferences
                      </h2>
                      <p
                        className={`mt-1 text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Control how the coach responds and how detailed the
                        feedback is.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Feedback Tone"
                      value={prefs.feedbackTone}
                      onChange={(v) =>
                        setPrefs((p) => ({
                          ...p,
                          feedbackTone: v as Preferences["feedbackTone"],
                        }))
                      }
                      options={["Encouraging", "Direct", "Strict"]}
                      isDarkMode={isDarkMode}
                    />

                    <SelectField
                      label="Feedback Detail"
                      value={prefs.feedbackDetail}
                      onChange={(v) =>
                        setPrefs((p) => ({
                          ...p,
                          feedbackDetail: v as Preferences["feedbackDetail"],
                        }))
                      }
                      options={["Brief", "Standard", "Deep"]}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div className="mt-4">
                    <ToggleRow
                      title="Show sample answer"
                      description="After feedback, show an example response to help you improve."
                      enabled={prefs.showSampleAnswer}
                      onToggle={() =>
                        setPrefs((p) => ({
                          ...p,
                          showSampleAnswer: !p.showSampleAnswer,
                        }))
                      }
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </section>

                {/* Practice Flow */}
                <section
                  className={`mt-6 rounded-2xl border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-white"
                  } p-6 shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      } border flex items-center justify-center`}
                    >
                      <Timer
                        className={`h-4 w-4 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      />
                    </div>
                    <div>
                      <h2
                        className={`text-sm font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Practice Flow
                      </h2>
                      <p
                        className={`mt-1 text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Adjust timers and session behavior to match how you like
                        to practice.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ToggleRow
                      title="Enable timer"
                      description="Show a timer while you answer questions."
                      enabled={prefs.enableTimer}
                      onToggle={() =>
                        setPrefs((p) => ({ ...p, enableTimer: !p.enableTimer }))
                      }
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Countdown before recording (seconds)"
                      value={String(prefs.countdownSeconds)}
                      onChange={(v) =>
                        setPrefs((p) => ({
                          ...p,
                          countdownSeconds: Number(
                            v
                          ) as Preferences["countdownSeconds"],
                        }))
                      }
                      options={["0", "3", "5", "10"]}
                      helper="Adds a short countdown before recording starts."
                      isDarkMode={isDarkMode}
                    />

                    <div className="flex items-start">
                      <div className="w-full">
                        <ToggleRow
                          title="Auto-submit on silence"
                          description="If you stop speaking for a while, auto-submit the answer."
                          enabled={prefs.autoSubmitOnSilence}
                          onToggle={() =>
                            setPrefs((p) => ({
                              ...p,
                              autoSubmitOnSilence: !p.autoSubmitOnSilence,
                            }))
                          }
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-10" />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small UI helpers */

function SidebarLink({
  href,
  label,
  icon,
  isDarkMode,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isDarkMode: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${
        isDarkMode
          ? "text-gray-400 hover:bg-gray-700"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className={`${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function SidebarGroup({
  label,
  icon,
  children,
  isDarkMode,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isDarkMode: boolean;
}) {
  return (
    <div className="mt-1">
      <div
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${
          isDarkMode ? "text-gray-400" : "text-gray-700"
        }`}
      >
        <span className={`${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
          {icon}
        </span>
        {label}
      </div>
      <div className="ml-9 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function SidebarSubLink({
  label,
  icon,
  active,
  href,
  isDarkMode,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  href: string;
  isDarkMode: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        active
          ? isDarkMode
            ? "bg-blue-900 text-blue-200 font-semibold"
            : "bg-blue-50 text-blue-700 font-semibold"
          : isDarkMode
          ? "text-gray-400 hover:bg-gray-700"
          : "text-gray-600 hover:bg-gray-50",
      ].join(" ")}
    >
      <span
        className={
          active
            ? "text-blue-400"
            : isDarkMode
            ? "text-gray-500"
            : "text-gray-400"
        }
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helper,
  isDarkMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  helper?: string;
  isDarkMode: boolean;
}) {
  return (
    <div>
      <label
        className={`block text-sm font-medium ${
          isDarkMode ? "text-gray-200" : "text-gray-700"
        } mb-2`}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border ${
          isDarkMode
            ? "border-gray-600 bg-gray-700 text-white"
            : "border-gray-300 bg-white text-gray-900"
        } px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {helper && (
        <p
          className={`mt-1 text-xs ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

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

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
  isDarkMode,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border ${
        isDarkMode
          ? "border-gray-600 bg-gray-700"
          : "border-gray-200 bg-gray-50"
      } p-4`}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </p>
        <p
          className={`mt-1 text-xs ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={[
          "h-6 w-11 rounded-full transition relative shrink-0",
          enabled ? "bg-blue-600" : isDarkMode ? "bg-gray-600" : "bg-gray-300",
        ].join(" ")}
        aria-label={title}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            enabled ? "left-5" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
