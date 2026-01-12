"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import {
  Home,
  Settings,
  SlidersHorizontal,
  SunMoon,
  User,
  UserCircle2,
  BrainCircuit,
  ChartNoAxesColumn,
  Mail,
  Shield,
  LogOut,
  Link as LinkIcon,
  FileText,
  Upload,
  Trash2,
  Sun,
  Moon,
} from "lucide-react";

type AccountData = {
  email: string;
  providerGoogleConnected: boolean;
  providerGithubConnected: boolean;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  resumeUpdatedAt?: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  
  // Get theme state and toggle function from context
const { isDarkMode, toggleTheme, mounted } = useTheme();

const pageBg = !mounted
  ? "min-h-screen bg-gray-50"     // default to light mode until mounted
  : isDarkMode
    ? "min-h-screen bg-gray-900"
    : "min-h-screen bg-gray-50";

  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // pretend these come from backend
  const [account, setAccount] = useState<AccountData>({
    email: "",
    providerGoogleConnected: false,
    providerGithubConnected: false,
    resumeFileName: null,
    resumeUpdatedAt: null,
  });

  
  // resume upload UI state
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);

  // password UI state (placeholders)
  const [pwLoading, setPwLoading] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  // optional: detect if password exists (if you return this from backend)
  const [hasPassword, setHasPassword] = useState(true);

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsSignedIn(!!token);

    // Load account info
    async function loadAccount() {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // 1) Profile for email + providers
            const profileRes = await fetch("http://localhost:5000/api/profile", {
            headers: { Authorization: `Bearer ${token}` },
            });

            const profileData = await profileRes.json();
            if (!profileRes.ok) throw new Error(profileData.error || "Failed to load profile");

            // 2) Resume metadata (Resume table)
            const resumeRes = await fetch("http://localhost:5000/api/profile/resume", {
            headers: { Authorization: `Bearer ${token}` },
            });

            const resumeData = await resumeRes.json();
            if (!resumeRes.ok) throw new Error(resumeData.error || "Failed to load resume");

            setAccount({
            email: profileData.user.email ?? "",
            providerGoogleConnected: !!profileData.user.googleId,
            providerGithubConnected: !!profileData.user.githubId,

            resumeUrl: resumeData.resume?.resumeUrl ?? null,
            resumeFileName: resumeData.resume?.resumeFileName ?? null,
            resumeUpdatedAt: resumeData.resume?.resumeUpdatedAt ?? null,
            });

            // clear local preview if backend has no resume
            if (!resumeData.resume?.resumeUrl) setResumePreviewUrl(null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }


    loadAccount();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("isGuest");
    router.push("/login");
  }

  function openResumePicker() {
    resumeInputRef.current?.click();
  }

  async function onResumeSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeError(null);

    // simple client validation
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setResumeError("Please upload a PDF or Word document (.pdf, .doc, .docx).");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError("File too large. Please keep resumes under 10MB.");
      e.target.value = "";
      return;
    }

    setResumeUploading(true);

    try {
      // TODO: Implement backend upload:
      // POST http://localhost:5000/api/profile/resume (multipart/form-data)
      // const token = localStorage.getItem("token");
      // const formData = new FormData();
      // formData.append("resume", file);
      // const res = await fetch("http://localhost:5000/api/profile/resume", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      // const data = await res.json();
      // setAccount(prev => ({ ...prev, resumeFileName: data.fileName, resumeUpdatedAt: data.updatedAt }));

      // UI-only simulation
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");

    const formData = new FormData();
    formData.append("resume", file);

    // local instant preview (PDF)
    if (file.type === "application/pdf") {
    const localUrl = URL.createObjectURL(file);
    setResumePreviewUrl(localUrl);
    }

    const res = await fetch("http://localhost:5000/api/profile/resume", {
    method: "POST",
    headers: {
        Authorization: `Bearer ${token}`,
        // DO NOT set Content-Type manually for FormData
    },
    body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");

    setAccount((prev) => ({
    ...prev,
    resumeUrl: data.resume.resumeUrl,
    resumeFileName: data.resume.resumeFileName,
    resumeUpdatedAt: data.resume.resumeUpdatedAt,
    }));

    } catch (err) {
      console.error(err);
      setResumeError("Upload failed. Please try again.");
    } finally {
      setResumeUploading(false);
      e.target.value = "";
    }
  }

async function submitPasswordChange() {
  setPwError(null);

  if (!newPassword || newPassword.length < 8) {
    setPwError("New password must be at least 8 characters.");
    return;
  }
  if (newPassword !== confirmPassword) {
    setPwError("New password and confirmation do not match.");
    return;
  }

  setPwSaving(true);

  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not signed in");

    const res = await fetch("http://localhost:5000/api/auth/password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: currentPassword || undefined,
        newPassword,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to change password");

    setPwOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (e: any) {
    setPwError(e.message || "Failed to change password");
  } finally {
    setPwSaving(false);
  }
}


async function removeResume() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch("http://localhost:5000/api/profile/resume", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Remove failed");

    setAccount((prev) => ({
      ...prev,
      resumeUrl: null,
      resumeFileName: null,
      resumeUpdatedAt: null,
    }));

    if (resumePreviewUrl) {
      try { URL.revokeObjectURL(resumePreviewUrl); } catch {}
    }
    setResumePreviewUrl(null);
  } catch (e) {
    console.error(e);
    setResumeError("Remove failed. Please try again.");
  }
}


  function connectGoogle() {
    // For OAuth flow: redirect to backend
    window.location.href = "http://localhost:5000/api/auth/google";
  }

  function connectGithub() {
    window.location.href = "http://localhost:5000/api/auth/github";
  }

  function disconnectProvider(provider: "google" | "github") {
    // TODO: call backend (PATCH) to unlink provider
    // or a dedicated endpoint like POST /api/profile/unlink-provider
    if (provider === "google") {
      setAccount((prev) => ({ ...prev, providerGoogleConnected: false }));
    } else {
      setAccount((prev) => ({ ...prev, providerGithubConnected: false }));
    }
  }

  function formatDate(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  }

  if (loading) {
    return (
      <div className={pageBg}>
        <Navbar />
        <div className={`pt-24 px-4 max-w-3xl mx-auto text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading account...
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={pageBg}>
        <Navbar />
        <div className="pt-24 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Account
            </h1>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You must be signed in to view this page.
            </p>
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
    <div className={pageBg}>
      <Navbar />

      <div className="pt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className={`rounded-2xl border p-3 shadow-sm ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <div className={`px-3 pt-2 pb-3 text-xs font-semibold uppercase tracking-wide ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Navigation
                </div>

                <nav className="flex flex-col gap-1">
                  <SidebarLink href="/dashboard" label="Home" icon={<Home className="h-4 w-4" />} isDarkMode={isDarkMode} />

                  <SidebarGroup label="Settings" icon={<Settings className="h-4 w-4" />} isDarkMode={isDarkMode}>
                    <SidebarSubLink href="/profile/preferences" label="Preferences" icon={<SlidersHorizontal className="h-4 w-4" />} isDarkMode={isDarkMode} />
                    <SidebarSubLink href="/profile/account" label="Account" active icon={<User className="h-4 w-4" />} isDarkMode={isDarkMode} />
                    <SidebarSubLink href="/profile" label="Personal" icon={<UserCircle2 className="h-4 w-4" />} isDarkMode={isDarkMode} />
                  </SidebarGroup>

                  <div className={`my-3 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />

                  <SidebarLink href="/practice" label="Practice" icon={<BrainCircuit className="h-4 w-4" />} isDarkMode={isDarkMode} />
                  <SidebarLink href="/analytics" label="Analytics" icon={<ChartNoAxesColumn className="h-4 w-4" />} isDarkMode={isDarkMode} />
                </nav>
              </div>
            </aside>

            {/* Main */}
            <main className="min-w-0">
              <div className="max-w-4xl">
                {/* Header */}
                <section className={`rounded-2xl border p-6 shadow-sm ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <Shield className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Account Settings</p>
                        <h1 className={`mt-1 text-xl font-semibold tracking-tight ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Manage Your Account
                        </h1>
                        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {account.email || "Signed in"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Theme Toggle Button */}
                      <button
                        onClick={toggleTheme}
                        className={`rounded-lg p-2 transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-label="Toggle theme"
                      >
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      </button>

                      <button
                        onClick={() => router.push("/profile")}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Back
                      </button>
                      <button
                        onClick={logout}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                          isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-black'
                        }`}
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                </section>

                {/* Account */}
                <section className={`mt-6 rounded-2xl border p-6 shadow-sm ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Account
                  </h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Your core account details.
                  </p>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField
                      label="Email"
                      value={account.email}
                      icon={<Mail className="h-4 w-4 text-gray-400" />}
                      helper="Email is tied to your login and can't be changed here."
                      isDarkMode={isDarkMode}
                    />

                    <ReadOnlyField
                      label="Auth Status"
                      value="Active"
                      icon={<Shield className="h-4 w-4 text-gray-400" />}
                      helper="Your account is active and ready to use."
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </section>

                {/* Connected Providers */}
                <section className={`mt-6 rounded-2xl border p-6 shadow-sm ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Connected Providers
                  </h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Connect social accounts for quick sign-in.
                  </p>

                  <div className="mt-5 space-y-3">
                    <ProviderRow
                      name="Google"
                      connected={account.providerGoogleConnected}
                      onConnect={connectGoogle}
                      onDisconnect={() => disconnectProvider("google")}
                      isDarkMode={isDarkMode}
                    />
                    <ProviderRow
                      name="GitHub"
                      connected={account.providerGithubConnected}
                      onConnect={connectGithub}
                      onDisconnect={() => disconnectProvider("github")}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <p className={`mt-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Tip: If you sign in with Google or GitHub, we'll link accounts by email (when available).
                  </p>
                </section>

                {/* Resume */}
                <section className={`mt-6 rounded-2xl border p-6 shadow-sm ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Resume
                      </h2>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Upload your resume to personalize interview questions and feedback.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openResumePicker}
                        disabled={resumeUploading}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-60 ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        {account.resumeFileName ? "Replace" : "Upload"}
                      </button>

                      {account.resumeFileName && (
                        <button
                          type="button"
                          onClick={removeResume}
                          disabled={resumeUploading}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-60 ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                              : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      ref={resumeInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={onResumeSelected}
                    />
                  </div>

                  <div className={`mt-5 rounded-xl border p-4 ${
                    isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                  }`}>
                    {account.resumeFileName ? (
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-10 w-10 rounded-lg border flex items-center justify-center ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                          <FileText className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {account.resumeFileName}
                          </p>
                          <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Last updated: {formatDate(account.resumeUpdatedAt)}
                          </p>
                          <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            We'll use your resume to tailor questions and highlight skill gaps during practice.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-10 w-10 rounded-lg border flex items-center justify-center ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                          <Upload className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            No resume uploaded
                          </p>
                          <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Upload a PDF or Word document to personalize your practice sessions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                    
                {/* Large PDF Preview */}
                {(resumePreviewUrl || account.resumeUrl) && (
                <div className={`mt-6 rounded-2xl border overflow-hidden ${
                    isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
                }`}>
                    <div className={`px-4 py-3 text-sm font-semibold ${
                    isDarkMode ? "text-white border-b border-gray-700" : "text-gray-900 border-b border-gray-200"
                    }`}>
                    Resume Preview
                    </div>

                    <div className="h-[750px] w-full">
                    <iframe
                        title="Resume Preview"
                        className="h-full w-full"
                        src={
                        resumePreviewUrl ||
                        `http://localhost:5000${account.resumeUrl}`
                        }
                    />
                    </div>
                </div>
                )}


                  {resumeError && (
                    <p className="mt-3 text-sm text-red-600">{resumeError}</p>
                  )}
                </section>

                {/* Security */}
                <section className={`mt-6 rounded-2xl border p-6 shadow-sm ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Security
                  </h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Manage password and sign-in settings.
                  </p>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionCard
                      title="Change Password"
                      description="Update your password for email + password login."
                      buttonLabel="Change"
                      onClick={() => {
                        // alert("Hook up Change Password flow here.");
                        setPwOpen(true);

                      }}
                      loading={pwLoading}
                      icon={<Shield className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />}
                      isDarkMode={isDarkMode}
                    />

                    <ActionCard
                      title="Sign out"
                      description="Log out of this device."
                      buttonLabel="Log out"
                      onClick={logout}
                      loading={false}
                      icon={<LogOut className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <p className={`mt-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    If you signed up with Google/GitHub only, password features may be unavailable until you set a password.
                  </p>
                </section>

                {pwOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${
                    isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                        <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            Change Password
                        </h2>
                        <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            Choose a strong password you’ll remember.
                        </p>
                        </div>
                        <button
                        onClick={() => setPwOpen(false)}
                        className={`text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                        Close
                        </button>
                    </div>

                    <div className="mt-5 space-y-4">
                        {/* If you want to always require current password, keep this always */}
                        <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={`w-full rounded-xl border px-3 py-3 text-sm outline-none ${
                            isDarkMode ? "border-gray-700 bg-gray-950 text-gray-200" : "border-gray-300 bg-white text-gray-900"
                            }`}
                            placeholder="••••••••"
                        />
                        </div>

                        <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full rounded-xl border px-3 py-3 text-sm outline-none ${
                            isDarkMode ? "border-gray-700 bg-gray-950 text-gray-200" : "border-gray-300 bg-white text-gray-900"
                            }`}
                            placeholder="At least 8 characters"
                        />
                        </div>

                        <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full rounded-xl border px-3 py-3 text-sm outline-none ${
                            isDarkMode ? "border-gray-700 bg-gray-950 text-gray-200" : "border-gray-300 bg-white text-gray-900"
                            }`}
                            placeholder="Repeat new password"
                        />
                        </div>

                        {pwError && <p className="text-sm text-red-600">{pwError}</p>}

                        <button
                        onClick={submitPasswordChange}
                        disabled={pwSaving}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                        {pwSaving ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                    </div>
                </div>
                )}



                {/* Danger Zone */}
                <section className={`mt-6 rounded-2xl border p-6 shadow-sm ${
                  isDarkMode ? 'border-red-900 bg-red-950/20' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${
                      isDarkMode ? 'bg-red-950 border-red-900' : 'bg-red-100 border-red-200'
                    }`}>
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>
                        Danger Zone
                      </h2>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-300/80' : 'text-red-700'}`}>
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => {
                        // TODO: Implement delete account flow
                        const confirmed = confirm("Are you sure you want to delete your account? This action cannot be undone.");
                        if (confirmed) {
                          alert("Hook up Delete Account API here");
                        }
                      }}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                        isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      Delete Account
                    </button>
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

/* ---------- Small UI helpers ---------- */

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
          ? 'text-gray-300 hover:bg-gray-700' 
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{icon}</span>
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
      <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{icon}</span>
        {label}
      </div>
      <div className="ml-9 flex flex-col gap-1">{children}</div>
    </div>
  );
}

// Updated: now supports linking (href) and active styling
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
          ? "bg-blue-50 text-blue-700 font-semibold" 
          : isDarkMode 
            ? "text-gray-400 hover:bg-gray-700" 
            : "text-gray-600 hover:bg-gray-50",
      ].join(" ")}
    >
      <span className={active ? "text-blue-600" : isDarkMode ? "text-gray-500" : "text-gray-400"}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
  helper,
  isDarkMode,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  helper?: string;
  isDarkMode: boolean;
}) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {label}
      </label>
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-3 ${
        isDarkMode 
          ? 'border-gray-700 bg-gray-900' 
          : 'border-gray-200 bg-gray-50'
      }`}>
        {icon}
        <div className={`text-sm font-semibold truncate ${
          isDarkMode ? 'text-gray-300' : 'text-gray-900'
        }`}>
          {value || "-"}
        </div>
      </div>
      {helper && (
        <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {helper}
        </p>
      )}
    </div>
  );
}

function ProviderRow({
  name,
  connected,
  onConnect,
  onDisconnect,
  isDarkMode,
}: {
  name: "Google" | "GitHub";
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isDarkMode: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
      isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <LinkIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {name}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {connected ? "Connected" : "Not connected"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {connected ? (
          <button
            onClick={onDisconnect}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
            }`}
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  buttonLabel,
  onClick,
  loading,
  icon,
  isDarkMode,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  loading: boolean;
  icon: React.ReactNode;
  isDarkMode: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${
      isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </p>
          <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={onClick}
          disabled={loading}
          className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-60 ${
            isDarkMode 
              ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
              : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
          }`}
        >
          {loading ? "Please wait..." : buttonLabel}
        </button>
      </div>
    </div>
  );
}