"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Settings,
  Keyboard,
  User,
  UserCircle2,
  BrainCircuit,
  ChartNoAxesColumn,
  SlidersHorizontal,
  Sparkles,
  Timer,
} from "lucide-react";

type Preferences = {
  // Interview defaults
  defaultRole: string;
  defaultDifficulty: "Basic" | "Intermediate" | "Advanced";
  questionFocus: {
    behavioral: boolean;
    technical: boolean;
    systemDesign: boolean;
  };
  autoStartNext: boolean;

  // Feedback style
  feedbackTone: "Encouraging" | "Direct" | "Strict";
  feedbackDetail: "Brief" | "Standard" | "Deep";
  showSampleAnswer: boolean;

  // Practice flow
  enableTimer: boolean;
  countdownSeconds: 0 | 3 | 5 | 10;
  autoSubmitOnSilence: boolean;
};

const DEFAULT_PREFS: Preferences = {
  defaultRole: "Software Engineering",
  defaultDifficulty: "Basic",
  questionFocus: {
    behavioral: true,
    technical: true,
    systemDesign: false,
  },
  autoStartNext: false,

  feedbackTone: "Encouraging",
  feedbackDetail: "Standard",
  showSampleAnswer: true,

  enableTimer: false,
  countdownSeconds: 3,
  autoSubmitOnSilence: false,
};

export default function PreferencesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsSignedIn(!!token);

    // UI-only: load from localStorage for now
    try {
      const saved = localStorage.getItem("preferences");
      if (saved) setPrefs(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  async function savePreferences() {
    setSaveStatus("saving");
    try {
      // UI-only storage for now
      localStorage.setItem("preferences", JSON.stringify(prefs));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1200);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    }
  }

  function resetDefaults() {
    setPrefs(DEFAULT_PREFS);
    setSaveStatus("idle");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 px-4 max-w-3xl mx-auto text-sm text-gray-600">
          Loading preferences...
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-24 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Preferences</h1>
            <p className="mt-2 text-sm text-gray-600">You must be signed in to view this page.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/login")}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="px-3 pt-2 pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Navigation
                </div>

                <nav className="flex flex-col gap-1">
                  <SidebarLink href="/dashboard" label="Home" icon={<Home className="h-4 w-4" />} />

                  <SidebarGroup label="Settings" icon={<Settings className="h-4 w-4" />}>
                    <SidebarSubLink href="/profile/account" label="Account" icon={<User className="h-4 w-4" />} />
                    <SidebarSubLink href="/profile" label="Profile" icon={<UserCircle2 className="h-4 w-4" />} />
                    <SidebarSubLink
                      href="/profile/preferences"
                      label="Preferences"
                      icon={<SlidersHorizontal className="h-4 w-4" />}
                      active
                    />
                  </SidebarGroup>

                  <div className="my-3 h-px bg-gray-100" />

                  <SidebarLink href="/practice" label="Practice" icon={<BrainCircuit className="h-4 w-4" />} />
                  <SidebarLink href="/analytics" label="Analytics" icon={<ChartNoAxesColumn className="h-4 w-4" />} />
                </nav>
              </div>
            </aside>

            {/* Main */}
            <main className="min-w-0">
              <div className="max-w-4xl">
                {/* Header */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gray-100 flex items-center justify-center">
                        <SlidersHorizontal className="h-5 w-5 text-gray-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Settings</p>
                        <h1 className="mt-1 text-xl font-semibold text-gray-900 tracking-tight">
                          Preferences
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                          Customize your practice experience and feedback style.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={resetDefaults}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
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
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Interview Preferences</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Set defaults for roles, difficulty, and what kinds of questions you want to practice.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Default Role"
                      value={prefs.defaultRole}
                      onChange={(v) => setPrefs((p) => ({ ...p, defaultRole: v }))}
                      options={[
                        "Software Engineering",
                        "Data Science",
                        "Product Management",
                        "Cybersecurity",
                        "General",
                      ]}
                    />

                    <SelectField
                      label="Default Difficulty"
                      value={prefs.defaultDifficulty}
                      onChange={(v) =>
                        setPrefs((p) => ({ ...p, defaultDifficulty: v as Preferences["defaultDifficulty"] }))
                      }
                      options={["Basic", "Intermediate", "Advanced"]}
                    />
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Question Focus</p>
                    <div className="flex flex-wrap gap-2">
                      <PillToggle
                        label="Behavioral"
                        active={prefs.questionFocus.behavioral}
                        onClick={() =>
                          setPrefs((p) => ({
                            ...p,
                            questionFocus: { ...p.questionFocus, behavioral: !p.questionFocus.behavioral },
                          }))
                        }
                      />
                      <PillToggle
                        label="Technical"
                        active={prefs.questionFocus.technical}
                        onClick={() =>
                          setPrefs((p) => ({
                            ...p,
                            questionFocus: { ...p.questionFocus, technical: !p.questionFocus.technical },
                          }))
                        }
                      />
                      <PillToggle
                        label="System Design"
                        active={prefs.questionFocus.systemDesign}
                        onClick={() =>
                          setPrefs((p) => ({
                            ...p,
                            questionFocus: { ...p.questionFocus, systemDesign: !p.questionFocus.systemDesign },
                          }))
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <ToggleRow
                        title="Auto-start next question"
                        description="Automatically load the next question after you submit an answer."
                        enabled={prefs.autoStartNext}
                        onToggle={() => setPrefs((p) => ({ ...p, autoStartNext: !p.autoStartNext }))}
                      />
                    </div>
                  </div>
                </section>

                {/* Feedback Preferences */}
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Feedback Preferences</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Control how the coach responds and how detailed the feedback is.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Feedback Tone"
                      value={prefs.feedbackTone}
                      onChange={(v) => setPrefs((p) => ({ ...p, feedbackTone: v as Preferences["feedbackTone"] }))}
                      options={["Encouraging", "Direct", "Strict"]}
                    />

                    <SelectField
                      label="Feedback Detail"
                      value={prefs.feedbackDetail}
                      onChange={(v) =>
                        setPrefs((p) => ({ ...p, feedbackDetail: v as Preferences["feedbackDetail"] }))
                      }
                      options={["Brief", "Standard", "Deep"]}
                    />
                  </div>

                  <div className="mt-4">
                    <ToggleRow
                      title="Show sample answer"
                      description="After feedback, show an example response to help you improve."
                      enabled={prefs.showSampleAnswer}
                      onToggle={() => setPrefs((p) => ({ ...p, showSampleAnswer: !p.showSampleAnswer }))}
                    />
                  </div>
                </section>

                {/* Practice Flow */}
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <Timer className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Practice Flow</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Adjust timers and session behavior to match how you like to practice.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ToggleRow
                      title="Enable timer"
                      description="Show a timer while you answer questions."
                      enabled={prefs.enableTimer}
                      onToggle={() => setPrefs((p) => ({ ...p, enableTimer: !p.enableTimer }))}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Countdown before recording"
                      value={String(prefs.countdownSeconds)}
                      onChange={(v) =>
                        setPrefs((p) => ({ ...p, countdownSeconds: Number(v) as Preferences["countdownSeconds"] }))
                      }
                      options={["0", "3", "5", "10"]}
                      helper="Adds a short countdown before recording starts."
                    />

                    <div className="flex items-start">
                      <div className="w-full">
                        <ToggleRow
                          title="Auto-submit on silence"
                          description="If you stop speaking for a while, auto-submit the answer."
                          enabled={prefs.autoSubmitOnSilence}
                          onToggle={() =>
                            setPrefs((p) => ({ ...p, autoSubmitOnSilence: !p.autoSubmitOnSilence }))
                          }
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

/* ---------- Small UI helpers (matches your style) ---------- */

function SidebarLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
    >
      <span className="text-gray-500">{icon}</span>
      {label}
    </Link>
  );
}

function SidebarGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-1">
      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700">
        <span className="text-gray-500">{icon}</span>
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
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        active ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50",
      ].join(" ")}
    >
      <span className={active ? "text-blue-600" : "text-gray-400"}>{icon}</span>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  helper?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

function PillToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold border transition",
        active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50",
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
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs text-gray-600">{description}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={[
          "h-6 w-11 rounded-full transition relative flex-shrink-0",
          enabled ? "bg-blue-600" : "bg-gray-300",
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
