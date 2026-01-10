"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import {
  FileUser,
  Upload,
  FileText,
  Sparkles,
  HelpCircle,
  MessageSquareText,
  Save,
  RefreshCcw,
} from "lucide-react";

type ResumeMeta = {
  resumeUrl: string;
  resumeFileName: string;
  resumeUpdatedAt: string;
};

type ParsedResume = {
  headline: string; // e.g. "Computer Engineering Student | ML Projects | ..."
  summary: string;
  skills: string[]; // tags
  roles: Array<{
    company: string;
    title: string;
    location?: string;
    start?: string;
    end?: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    tech: string[];
    bullets: string[];
    link?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    start?: string;
    end?: string;
    gpa?: string;
  }>;
};

type ResumeQA = {
  generatedQuestions: string[];
  selectedQuestionIndex: number;
  answerDraft: string;
  critique: string;
  tips: string[];
};

const DEFAULT_PARSED: ParsedResume = {
  headline: "",
  summary: "",
  skills: ["Python", "C++", "React", "Tailwind", "Prisma"],
  roles: [
    {
      company: "Example Lab / Internship",
      title: "Research Assistant",
      location: "Baltimore, MD",
      start: "2025-06",
      end: "2025-08",
      bullets: [
        "Built a data pipeline to clean and analyze experimental results.",
        "Implemented a model to predict outcomes and improved accuracy by X%.",
      ],
    },
  ],
  projects: [
    {
      name: "InterviewAI (Hack Project)",
      tech: ["Next.js", "Express", "Prisma", "Postgres"],
      bullets: [
        "Built an AI interview prep tool with practice sessions and feedback.",
        "Implemented authentication and profile customization.",
      ],
    },
  ],
  education: [
    {
      school: "UMBC",
      degree: "B.S. Computer Engineering & Mathematics",
      start: "2024",
      end: "2027",
      gpa: "",
    },
  ],
};

export default function ResumePage() {
  const { isDarkMode, mounted } = useTheme();
  const pageBg = !mounted
    ? "min-h-screen bg-gray-50"
    : isDarkMode
    ? "min-h-screen bg-gray-900"
    : "min-h-screen bg-gray-50";

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<ResumeMeta | null>(null);

  // Parsed resume fields (editable)
  const [parsed, setParsed] = useState<ParsedResume>(DEFAULT_PARSED);

  // Q/A coaching UI state
  const [qa, setQa] = useState<ResumeQA>({
    generatedQuestions: [
      "Tell me about a project where you used these skills: React + Node.",
      "Walk me through a time you improved a process or system.",
      "What’s a technical challenge you faced and how did you solve it?",
    ],
    selectedQuestionIndex: 0,
    answerDraft: "",
    critique: "",
    tips: [
      "Use measurable impact (numbers) in at least 2–3 bullets per role/project.",
      "Start bullets with strong action verbs and keep them concise.",
    ],
  });

  useEffect(() => {
    async function loadResume() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 1) fetch resume metadata from backend
        const res = await fetch("http://localhost:5000/api/profile/resume", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load resume metadata");

        if (data.resume) {
          setMeta({
            resumeUrl: data.resume.resumeUrl,
            resumeFileName: data.resume.resumeFileName,
            resumeUpdatedAt: data.resume.resumeUpdatedAt,
          });

          // 2) later: fetch parsed data from backend:
          // const parsedRes = await fetch("http://localhost:5000/api/profile/resume/parse", { headers: { Authorization: `Bearer ${token}` } });
          // const parsedData = await parsedRes.json();
          // setParsed(parsedData.parsed);
        } else {
          setMeta(null);
        }
      } catch (e) {
        console.error(e);
        setMeta(null);
      } finally {
        setLoading(false);
      }
    }

    loadResume();
  }, []);

  const resumePreviewSrc = useMemo(() => {
    if (!meta?.resumeUrl) return null;
    return `http://localhost:5000${meta.resumeUrl}`;
  }, [meta]);

  function formatDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleString();
  }

  // UI-only actions (hook to backend later)
  async function reparseResume() {
    // Later: call backend parse endpoint to regenerate structured fields
    // For now, just show a stub behavior
    alert("Re-parse will call the backend parser later.");
  }

  async function saveEdits() {
    // Later: PATCH parsed fields back to backend for persistence
    alert("Save edits will call the backend later.");
  }

  async function generateQuestions() {
    // Later: generate Qs based on parsed resume
    // For now: generate from skills + roles
    const skillLine = parsed.skills.slice(0, 5).join(", ");
    const company = parsed.roles?.[0]?.company || "your experience";
    setQa((prev) => ({
      ...prev,
      generatedQuestions: [
        `Tell me about a time you used ${skillLine} to deliver results.`,
        `Pick one accomplishment at ${company} and walk me through it using STAR.`,
        `Which project best shows your strengths, and what would you improve if you had more time?`,
      ],
      selectedQuestionIndex: 0,
      critique: "",
    }));
  }

  async function critiqueAnswer() {
    // Later: call backend to critique answer based on selected question + resume context
    if (!qa.answerDraft.trim()) {
      alert("Write an answer first.");
      return;
    }
    setQa((prev) => ({
      ...prev,
      critique:
        "Good structure, but add measurable impact and clarify your specific contribution. Tighten the opening sentence and end with results.",
      tips: [
        "Add 1–2 concrete metrics (time saved, accuracy improved, users impacted).",
        "Use STAR: Situation (1 sentence), Task (1), Action (2–3), Result (1).",
        "Avoid vague verbs like 'helped'—use 'implemented', 'designed', 'optimized'.",
      ],
    }));
  }

  return (
    <div className={pageBg}>
      <Navbar />

      <div className="pt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <section
            className={`rounded-2xl border p-6 shadow-sm ${
              isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <FileUser className={`${isDarkMode ? "text-gray-200" : "text-gray-700"} h-5 w-5`} />
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Keeping you interview-ready</p>
                  <h1 className={`mt-1 text-xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Resume Studio
                  </h1>
                  <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Parse your resume, verify/edit details, and practice questions tailored to your experience.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={reparseResume}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                      : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Re-parse
                </button>

                <button
                  onClick={saveEdits}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                  Save edits
                </button>
              </div>
            </div>
          </section>

          {/* Main grid */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Resume Preview */}
            <section
              className={`rounded-2xl border shadow-sm overflow-hidden ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <div className={`px-5 py-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className={`${isDarkMode ? "text-gray-200" : "text-gray-700"} h-4 w-4`} />
                    <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Resume Preview</p>
                  </div>
                  {meta ? (
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {meta.resumeFileName} • {formatDate(meta.resumeUpdatedAt)}
                    </p>
                  ) : (
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No resume uploaded</p>
                  )}
                </div>
              </div>

              <div className="h-[720px] w-full">
                {loading ? (
                  <div className={`h-full w-full flex items-center justify-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Loading…
                  </div>
                ) : meta?.resumeUrl ? (
                  <iframe title="Resume PDF Preview" className="h-full w-full" src={resumePreviewSrc!} />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-6">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                      <Upload className={`${isDarkMode ? "text-gray-200" : "text-gray-700"} h-5 w-5`} />
                    </div>
                    <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Upload your resume in Account settings</p>
                    <p className={`text-xs text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Go to Profile → Account → Resume to upload a PDF. Once uploaded, it will show here.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT: Parsed Fields (editable) */}
            <section
              className={`rounded-2xl border p-6 shadow-sm ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                  <Sparkles className={`${isDarkMode ? "text-gray-200" : "text-gray-700"} h-4 w-4`} />
                </div>
                <div>
                  <h2 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Parsed Resume Information</h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Verify and edit anything that looks off. These fields will power personalized questions.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <TextField
                  label="Headline"
                  value={parsed.headline}
                  onChange={(v) => setParsed((p) => ({ ...p, headline: v }))}
                  isDarkMode={isDarkMode}
                  placeholder="e.g., Computer Engineering Student | ML Projects | Full-stack"
                />

                <TextArea
                  label="Summary"
                  value={parsed.summary}
                  onChange={(v) => setParsed((p) => ({ ...p, summary: v }))}
                  isDarkMode={isDarkMode}
                  placeholder="2–4 lines summarizing your strengths, interests, and target roles…"
                />

                <TagsEditor
                  label="Skills"
                  tags={parsed.skills}
                  onChange={(tags) => setParsed((p) => ({ ...p, skills: tags }))}
                  isDarkMode={isDarkMode}
                />

                <MiniListEditor
                  label="Experience"
                  items={parsed.roles.map((r) => `${r.title} — ${r.company}`)}
                  isDarkMode={isDarkMode}
                  helper="Later you can expand this to edit each role’s bullets."
                />

                <MiniListEditor
                  label="Projects"
                  items={parsed.projects.map((p) => p.name)}
                  isDarkMode={isDarkMode}
                  helper="Later: edit tech stack + bullets for each project."
                />

                <MiniListEditor
                  label="Education"
                  items={parsed.education.map((e) => `${e.degree} — ${e.school}`)}
                  isDarkMode={isDarkMode}
                />
              </div>
            </section>
          </div>

          {/* Q/A + Critique */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Questions */}
            <section
              className={`rounded-2xl border p-6 shadow-sm ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                    <HelpCircle className={`${isDarkMode ? "text-gray-200" : "text-gray-700"} h-4 w-4`} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Questions from your resume</h2>
                    <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Generate interview questions based on your skills and experiences.
                    </p>
                  </div>
                </div>

                <button
                  onClick={generateQuestions}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {qa.generatedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQa((p) => ({ ...p, selectedQuestionIndex: idx, critique: "" }))}
                    className={[
                      "w-full text-left rounded-xl border px-4 py-3 text-sm transition",
                      idx === qa.selectedQuestionIndex
                        ? "border-blue-600 bg-blue-600/10 text-blue-700"
                        : isDarkMode
                        ? "border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </section>

            {/* Answer + Critique */}
            <section
              className={`rounded-2xl border p-6 shadow-sm ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                  <MessageSquareText className={`${isDarkMode ? "text-gray-200" : "text-gray-700"} h-4 w-4`} />
                </div>
                <div>
                  <h2 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Answer & critique</h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Write an answer to the selected question and get structured feedback.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className={`text-xs font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Selected question</p>
                <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  {qa.generatedQuestions[qa.selectedQuestionIndex]}
                </p>

                <div className="mt-4">
                  <TextArea
                    label="Your answer"
                    value={qa.answerDraft}
                    onChange={(v) => setQa((p) => ({ ...p, answerDraft: v }))}
                    isDarkMode={isDarkMode}
                    placeholder="Write a STAR-style response here..."
                  />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={critiqueAnswer}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Critique my answer
                  </button>
                  <button
                    onClick={() => setQa((p) => ({ ...p, answerDraft: "", critique: "" }))}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                        : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Clear
                  </button>
                </div>

                {/* Critique output */}
                {qa.critique && (
                  <div className={`mt-5 rounded-xl border p-4 ${
                    isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"
                  }`}>
                    <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Feedback</p>
                    <p className={`mt-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{qa.critique}</p>

                    <p className={`mt-4 text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Resume tips
                    </p>
                    <ul className={`mt-2 space-y-1 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {qa.tips.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function TextField({
  label,
  value,
  onChange,
  isDarkMode,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isDarkMode: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border px-3 py-3 text-sm outline-none ${
          isDarkMode
            ? "border-gray-700 bg-gray-900 text-gray-200 placeholder:text-gray-500"
            : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
        }`}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  isDarkMode,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isDarkMode: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full min-h-[120px] rounded-xl border px-3 py-3 text-sm outline-none ${
          isDarkMode
            ? "border-gray-700 bg-gray-900 text-gray-200 placeholder:text-gray-500"
            : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
        }`}
      />
    </div>
  );
}

function TagsEditor({
  label,
  tags,
  onChange,
  isDarkMode,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  isDarkMode: boolean;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const t = draft.trim();
    if (!t) return;
    if (tags.map((x) => x.toLowerCase()).includes(t.toLowerCase())) return;
    onChange([...tags, t]);
    setDraft("");
  }

  function removeTag(t: string) {
    onChange(tags.filter((x) => x !== t));
  }

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {label}
      </label>

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => removeTag(t)}
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              isDarkMode
                ? "border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800"
                : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
            }`}
            title="Click to remove"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a skill (e.g., Python)"
          className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${
            isDarkMode
              ? "border-gray-700 bg-gray-900 text-gray-200 placeholder:text-gray-500"
              : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
          }`}
        />
        <button
          type="button"
          onClick={addTag}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function MiniListEditor({
  label,
  items,
  isDarkMode,
  helper,
}: {
  label: string;
  items: string[];
  isDarkMode: boolean;
  helper?: string;
}) {
  return (
    <div>
      <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</p>
      {helper && <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>{helper}</p>}

      <div className={`mt-2 rounded-xl border p-3 ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
        {items.length === 0 ? (
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>None found.</p>
        ) : (
          <ul className={`space-y-2 text-sm ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
            {items.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span className="truncate">{x}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
