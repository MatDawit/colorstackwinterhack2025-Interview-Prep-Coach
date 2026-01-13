"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import {
  FileUser,
  Upload,
  FileText,
  Sparkles,
  Save,
  RefreshCcw,
} from "lucide-react";

type ResumeMeta = {
  resumeUrl: string;
  resumeFileName: string;
  resumeUpdatedAt: string;
};

type ParsedResume = {
  headline: string;
  summary: string;
  skills: string[];
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

export default function ResumePage() {
  const { isDarkMode, mounted } = useTheme();
  const pageBg = !mounted
    ? "min-h-screen bg-gray-50"
    : isDarkMode
    ? "min-h-screen bg-gray-900"
    : "min-h-screen bg-gray-50";

  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [meta, setMeta] = useState<ResumeMeta | null>(null);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);

  // AI Feedback state
  const [feedback, setFeedback] = useState<string>("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    async function loadResume() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 1) Fetch resume metadata from backend
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

          // 2) Fetch parsed data from backend
          console.log('Fetching parsed resume data...');
          try {
            const parsedRes = await fetch("http://localhost:5000/api/profile/resume/parse", {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Parse response status:', parsedRes.status);
            
            if (parsedRes.ok) {
              const parsedData = await parsedRes.json();
              console.log('Parsed resume data received:', parsedData);
              setParsed(parsedData.parsed);
            } else {
              const errorData = await parsedRes.json();
              console.error('Failed to parse resume:', errorData);
            }
          } catch (parseError) {
            console.error('Error fetching parsed data:', parseError);
          }
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
    return meta.resumeUrl;
  }, [meta]);

  function formatDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleString();
  }

  // Re-parse the resume
  async function reparseResume() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setParsing(true);
      const parsedRes = await fetch("http://localhost:5000/api/profile/resume/parse", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (parsedRes.ok) {
        const parsedData = await parsedRes.json();
        setParsed(parsedData.parsed);
        alert("Resume re-parsed successfully!");
      } else {
        alert("Failed to re-parse resume");
      }
    } catch (error) {
      console.error('Error re-parsing:', error);
      alert("Error re-parsing resume");
    } finally {
      setParsing(false);
    }
  }

  async function saveEdits() {
    alert("Save edits will call the backend later.");
  }

  // Generate AI feedback
  async function generateFeedback() {
    if (!parsed) {
      alert("No resume data to analyze");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingFeedback(true);
      const response = await fetch("http://localhost:5000/api/resume/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parsedResume: parsed }),
      });

      const data = await response.json();
      if (response.ok) {
        setFeedback(data.feedback);
      } else {
        alert("Failed to generate feedback");
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      alert("Error generating feedback");
    } finally {
      setLoadingFeedback(false);
    }
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
                    Parse your resume, verify/edit details, and get AI-powered feedback.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={reparseResume}
                  disabled={parsing || !meta}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                      : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  <RefreshCcw className={`h-4 w-4 ${parsing ? 'animate-spin' : ''}`} />
                  {parsing ? 'Parsing...' : 'Re-parse'}
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
                    Verify and edit anything that looks off. These fields will power personalized feedback.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5 max-h-[640px] overflow-y-auto">
                {parsed ? (
                  <>
                    <TextField
                      label="Headline"
                      value={parsed.headline}
                      onChange={(v) => setParsed((p) => p ? ({ ...p, headline: v }) : null)}
                      isDarkMode={isDarkMode}
                      placeholder="e.g., Computer Engineering Student | ML Projects | Full-stack"
                    />

                    <TextArea
                      label="Summary"
                      value={parsed.summary}
                      onChange={(v) => setParsed((p) => p ? ({ ...p, summary: v }) : null)}
                      isDarkMode={isDarkMode}
                      placeholder="2–4 lines summarizing your strengths, interests, and target roles…"
                    />

                    <TagsEditor
                      label="Skills"
                      tags={parsed.skills}
                      onChange={(tags) => setParsed((p) => p ? ({ ...p, skills: tags }) : null)}
                      isDarkMode={isDarkMode}
                    />

                    <MiniListEditor
                      label="Experience"
                      items={parsed.roles.map((r) => `${r.title} — ${r.company}`)}
                      isDarkMode={isDarkMode}
                      helper="Later you can expand this to edit each role's bullets."
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
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {loading || parsing ? 'Parsing your resume...' : 'Upload a resume to see parsed data'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* AI Resume Feedback Section */}
          <section
            className={`mt-6 rounded-2xl border p-6 shadow-sm ${
              isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${
                  isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}>
                  <Sparkles className={`${isDarkMode ? "text-gray-200" : "text-gray-700"} h-5 w-5`} />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    AI Resume Review
                  </h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Get personalized feedback on your resume from our AI career coach
                  </p>
                </div>
              </div>

              <button
                onClick={generateFeedback}
                disabled={!parsed || loadingFeedback}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className={`h-4 w-4 ${loadingFeedback ? 'animate-spin' : ''}`} />
                {loadingFeedback ? "Analyzing..." : "Get Feedback"}
              </button>
            </div>

            {/* Feedback Display */}
{feedback ? (
  <div className={`mt-6 rounded-lg border p-6 ${
    isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-300 bg-white"
  }`}>
    <div className="space-y-6">
      {feedback.split('\n\n').map((section, idx) => {
        // Check if it's a header (starts with **)
        if (section.startsWith('**') && section.includes(':**')) {
          const title = section.replace(/\*\*/g, '').replace(':', '');
          return (
            <div key={idx}>
              <h3 className={`text-lg font-bold mb-3 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {title}
              </h3>
            </div>
          );
        }
        
        // Check if it's a numbered/bulleted list item
        if (section.match(/^\d+\.|^\*/)) {
          const items = section.split('\n').filter(line => line.trim());
          return (
            <div key={idx} className="space-y-4">
              {items.map((item, itemIdx) => {
                // Main bullet point
                if (item.match(/^\d+\.|^\*   \*\*/)) {
                  const cleanItem = item.replace(/^\d+\.\s*/, '').replace(/^\*\s*/, '').replace(/\*\*/g, '');
                  return (
                    <div key={itemIdx} className="ml-0">
                      <div className={`flex gap-3 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                          isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                        }`} />
                        <p className="font-semibold">{cleanItem}</p>
                      </div>
                    </div>
                  );
                }
                
                // Sub-items (Problem/Example)
                if (item.includes('**Problem:**') || item.includes('**Example:**')) {
                  const [label, ...rest] = item.split('**').filter(Boolean);
                  const content = rest.join('').replace(/:/g, '').trim();
                  const isExample = item.includes('**Example:**');
                  
                  return (
                    <div key={itemIdx} className="ml-8 mt-2">
                      <p className={`text-sm font-semibold mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {label.trim()}:
                      </p>
                      <p className={`text-sm ml-4 italic ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {content}
                      </p>
                    </div>
                  );
                }
                
                // Regular sub-bullet
                if (item.trim().startsWith('*')) {
                  const cleanItem = item.replace(/^\*\s*/, '');
                  return (
                    <div key={itemIdx} className="ml-8 flex gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
                      }`} />
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {cleanItem}
                      </p>
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
          );
        }
        
        // Regular paragraph
        if (section.trim()) {
          return (
            <p key={idx} className={`text-sm leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-800'
            }`}>
              {section}
            </p>
          );
        }
        
        return null;
      })}
    </div>
  </div>
) : (
  <div className={`mt-6 rounded-lg border-2 border-dashed p-12 text-center ${
    isDarkMode ? "border-gray-700" : "border-gray-300"
  }`}>
    <Sparkles className={`mx-auto h-12 w-12 ${
      isDarkMode ? "text-gray-600" : "text-gray-400"
    }`} />
    <p className={`mt-4 text-sm font-medium ${
      isDarkMode ? "text-gray-300" : "text-gray-700"
    }`}>
      No feedback yet
    </p>
    <p className={`mt-1 text-sm ${
      isDarkMode ? "text-gray-500" : "text-gray-600"
    }`}>
      Click "Get Feedback" to receive AI-powered resume insights
    </p>
  </div>
)}
          </section>

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
