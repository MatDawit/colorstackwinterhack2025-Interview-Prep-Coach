"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactCropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import Navbar from "../components/Navbar";
import Link from "next/link";
import {
  Home,
  Settings,
  Settings2,
  SunMoon,
  SlidersHorizontal,
  User,
  UserCircle2,
  BrainCircuit,
  ChartNoAxesColumn,
  Upload,
  MapPin,
  Mail,
  AtSign,
  LogOut,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";

type ProfileForm = {
  name: string;
  email: string;
  displayName: string;
  location: string;
  bio: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    displayName: "",
    location: "",
    bio: "",
  });

  const [avatarShape, setAvatarShape] = useState<"circle" | "square">("circle");
  const [borderColor, setBorderColor] = useState<string>("#3B82F6");
  const BORDER_COLORS = [
    { name: "Red", hex: "#EF4444" },
    { name: "Orange", hex: "#F97316" },
    { name: "Yellow", hex: "#EAB308" },
    { name: "Green", hex: "#22C55E" },
    { name: "Blue", hex: "#3B82F6" },
    { name: "Indigo", hex: "#6366F1" },
    { name: "Violet", hex: "#A855F7" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Black", hex: "#000000" },
  ];
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsSignedIn(!!token);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = await res.text();
        let data: any;
        try {
          data = JSON.parse(raw);
        } catch {
          console.error("Non-JSON response:", raw);
          throw new Error("Backend returned non-JSON");
        }

        if (!res.ok) throw new Error(data.error || "Failed to load profile.");

        setForm({
          name: data.user.name ?? "",
          email: data.user.email ?? "",
          displayName: data.user.displayName ?? "",
          location: data.user.location ?? "",
          bio: data.user.bio ?? "",
        });

        setAvatarShape(
          (data.user.avatarShape as "circle" | "square") ?? "circle"
        );
        setBorderColor(data.user.avatarBorder || "#3B82F6");
        setAvatarUrl(data.user.avatarUrl ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile() {
    setSaveStatus("saving");

    const token = localStorage.getItem("token");
    if (!token) {
      setSaveStatus("error");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          displayName: form.displayName,
          location: form.location,
          bio: form.bio,
          avatarShape,
          avatarBorder: borderColor,
          avatarUrl,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
      } else {
        const raw = await res.text();
        console.error("Non-JSON response:", raw);
        throw new Error("Backend returned non-JSON");
      }

      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
        router.push("/dashboard");
      }, 1500);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    }
  }

  async function handleSignOut() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch("http://localhost:5000/api/profile/signout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("token");
      router.push("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }

  async function handleDeleteAccount() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/profile/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete account");
      }

      localStorage.removeItem("token");
      router.push("/");
    } catch (error) {
      console.error("Delete account failed:", error);
      alert("Failed to delete account. Please try again.");
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedImageUrl(url);
    setIsCropOpen(true);

    e.target.value = "";
  }

  function onCropComplete(_: any, croppedPixels: any) {
    setCroppedAreaPixels(croppedPixels);
  }

  async function applyCrop() {
    if (!selectedImageUrl || !croppedAreaPixels) {
      setIsCropOpen(false);
      return;
    }

    const croppedDataUrl = await getCroppedImageDataUrl(
      selectedImageUrl,
      croppedAreaPixels
    );
    setAvatarUrl(croppedDataUrl);

    setIsCropOpen(false);
    try {
      URL.revokeObjectURL(selectedImageUrl);
    } catch {}
    setSelectedImageUrl(null);
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 px-4 max-w-3xl mx-auto text-sm text-gray-600">
          Loading...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <Navbar />
        <div
          className={`pt-24 px-4 max-w-3xl mx-auto text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Loading profile...
        </div>
      </div>
    );
  }

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
                className={`rounded-2xl border shadow-sm p-3 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`px-3 pt-2 pb-3 text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Navigation
                </div>

                <nav className="flex flex-col gap-1">
                  <SidebarGroup
                    label="Settings"
                    icon={<Settings className="h-4 w-4" />}
                    isDarkMode={isDarkMode}
                  >
                    <SidebarSubLink
                      href="/profile/preferences"
                      label="Preferences"
                      icon={<SlidersHorizontal className="h-4 w-4" />}
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
                      active
                      icon={<UserCircle2 className="h-4 w-4" />}
                      isDarkMode={isDarkMode}
                    />
                  </SidebarGroup>
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0">
              <div className="max-w-4xl">
                {/* Header card */}
                <section
                  className={`rounded-2xl border shadow-sm p-6 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar preview */}
                      <div
                        className={[
                          "h-14 w-14 flex items-center justify-center overflow-hidden",
                          avatarShape === "circle"
                            ? "rounded-full"
                            : "rounded-2xl",
                          "border-2",
                          isDarkMode ? "bg-gray-700" : "bg-gray-100",
                        ].join(" ")}
                        style={{ borderColor }}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            className={`font-semibold ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {(form.name || "User")
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase())
                              .join("") || "U"}
                          </span>
                        )}
                      </div>

                      <div>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Personal Settings
                        </p>
                        <h1
                          className={`mt-1 text-xl font-semibold tracking-tight ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Manage Your Profile
                        </h1>
                        <p
                          className={`mt-1 text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {form.email || "Signed in"}
                        </p>
                      </div>
                    </div>

                    {/* Top right actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSignOut}
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                            : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={saveStatus === "saving"}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Basic Info */}
                <section
                  className={`mt-6 rounded-2xl border shadow-sm p-6 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-sm font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Basic Information
                  </h2>
                  <p
                    className={`mt-1 text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Update your personal details and contact information.
                  </p>

                  <div className="mt-5 grid grid-cols-3 md:grid-cols-1 gap-4">
                    <Input
                      label="Name"
                      icon={<User className="h-4 w-4 text-gray-400" />}
                      value={form.name}
                      onChange={(v) => updateField("name", v)}
                      placeholder="Your name"
                      isDarkMode={isDarkMode}
                    />

                    <Input
                      label="Email"
                      icon={<Mail className="h-4 w-4 text-gray-400" />}
                      value={form.email}
                      readOnly
                      isDarkMode={isDarkMode}
                    />

                    {/* <Input
                      label="Display Name"
                      icon={<AtSign className="h-4 w-4 text-gray-400" />}
                      value={form.displayName}
                      onChange={(v) => updateField("displayName", v)}
                      placeholder="e.g. John Doe"
                      isDarkMode={isDarkMode}
                    /> */}

                    <Input
                      label="Location"
                      icon={<MapPin className="h-4 w-4 text-gray-400" />}
                      value={form.location}
                      onChange={(v) => updateField("location", v)}
                      placeholder="City, State"
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div className="mt-4">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Bio
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      placeholder="Tell us a little about yourself..."
                      className={`w-full min-h-[110px] rounded-xl border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      }`}
                    />
                  </div>
                </section>

                {/* Avatar */}
                <section
                  className={`mt-6 rounded-2xl border shadow-sm p-6 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2
                        className={`text-sm font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Avatar
                      </h2>
                      <p
                        className={`mt-1 text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Upload a profile picture and customize its appearance.
                      </p>
                    </div>

                    <>
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                            : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                      />
                    </>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Shape
                      </p>
                      <div className="mt-2 flex gap-2">
                        <ToggleButton
                          active={avatarShape === "circle"}
                          onClick={() => setAvatarShape("circle")}
                          label="Circle"
                          isDarkMode={isDarkMode}
                        />
                        <ToggleButton
                          active={avatarShape === "square"}
                          onClick={() => setAvatarShape("square")}
                          label="Square"
                          isDarkMode={isDarkMode}
                        />
                      </div>

                      <div className="mt-5">
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Border Color
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {BORDER_COLORS.map((c) => (
                            <ColorDot
                              key={c.hex}
                              active={
                                borderColor.toLowerCase() ===
                                c.hex.toLowerCase()
                              }
                              onClick={() => setBorderColor(c.hex)}
                              color={c.hex}
                              label={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div
                      className={`flex flex-col items-center justify-center rounded-2xl border p-6 ${
                        isDarkMode
                          ? "bg-gray-900 border-gray-700"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div
                        className={[
                          "h-24 w-24 flex items-center justify-center overflow-hidden shadow-sm",
                          avatarShape === "circle"
                            ? "rounded-full"
                            : "rounded-2xl",
                          "border-4",
                          isDarkMode ? "bg-gray-700" : "bg-white",
                        ].join(" ")}
                        style={{ borderColor }}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            className={`font-semibold text-lg ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {(form.name || "User")
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase())
                              .join("") || "U"}
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-3 text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Preview
                      </p>
                    </div>
                  </div>
                </section>

                {/* Danger Zone - Delete Account */}
                <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Danger Zone
                      </h2>
                      <p className="mt-1 text-sm text-red-700">
                        Once you delete your account, there is no going back.
                        Please be certain.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </button>
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {isCropOpen && selectedImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Crop your avatar
              </p>
              <button
                type="button"
                onClick={() => setIsCropOpen(false)}
                className={`text-sm font-semibold ${
                  isDarkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Close
              </button>
            </div>

            <div
              className={`relative h-[320px] ${
                isDarkMode ? "bg-gray-900" : "bg-gray-100"
              }`}
            >
              <ReactCropper
                image={selectedImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />

              <button
                type="button"
                onClick={applyCrop}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>

              <h3
                className={`mt-4 text-center text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Confirm Account Deletion
              </h3>

              <p
                className={`mt-2 text-center text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Are you absolutely sure you wish to delete your InterviewAI
                account?
              </p>

              <p className="mt-3 text-center text-sm text-red-600 font-medium">
                This action is irreversible and all your data, progress, and
                settings will be permanently lost.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes, permanently delete my account
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                      : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  No, keep my account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function getCroppedImageDataUrl(
  imageSrc: string,
  cropPixels: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
  });

  const MAX = 512;
  const scale = Math.min(MAX / cropPixels.width, MAX / cropPixels.height, 1);

  const outW = Math.round(cropPixels.width * scale);
  const outH = Math.round(cropPixels.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    outW,
    outH
  );

  return canvas.toDataURL("image/jpeg", 0.8);
}

/*  Small UI helpers  */

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
          ? "text-gray-300 hover:bg-gray-700"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className={isDarkMode ? "text-gray-500" : "text-gray-500"}>
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
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <span className={isDarkMode ? "text-gray-500" : "text-gray-500"}>
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
          ? "bg-blue-50 text-blue-700 font-semibold"
          : isDarkMode
          ? "text-gray-400 hover:bg-gray-700"
          : "text-gray-600 hover:bg-gray-50",
      ].join(" ")}
    >
      <span
        className={
          active
            ? "text-blue-600"
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

function Input({
  label,
  icon,
  value,
  onChange,
  readOnly = false,
  placeholder,
  isDarkMode,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  isDarkMode: boolean;
}) {
  return (
    <div>
      <label
        className={`block text-sm font-medium mb-2 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </label>

      <div
        className={[
          "flex items-center gap-2 rounded-xl border px-3 py-3",
          readOnly
            ? isDarkMode
              ? "border-gray-700 bg-gray-900"
              : "border-gray-200 bg-gray-50"
            : isDarkMode
            ? "border-gray-600 bg-gray-700"
            : "border-gray-300 bg-white",
          "focus-within:ring-2 focus-within:ring-blue-500",
        ].join(" ")}
      >
        {icon}
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className={[
            "w-full bg-transparent text-sm outline-none placeholder:text-gray-400",
            readOnly
              ? isDarkMode
                ? "text-gray-500"
                : "text-gray-500"
              : isDarkMode
              ? "text-white"
              : "text-gray-900",
          ].join(" ")}
        />
      </div>

      {readOnly && (
        <p
          className={`mt-1 text-xs ${
            isDarkMode ? "text-gray-500" : "text-gray-500"
          }`}
        >
          Email is tied to your login and can't be changed here.
        </p>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  isDarkMode,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  isDarkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border px-3 py-2 text-sm font-semibold",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : isDarkMode
          ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
          : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ColorDot({
  active,
  onClick,
  color,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={[
        "h-6 w-6 rounded-full border",
        active ? "ring-2 ring-offset-2 ring-gray-900" : "ring-0",
      ].join(" ")}
      style={{
        backgroundColor: color,
        borderColor: color.toLowerCase() === "#ffffff" ? "#D1D5DB" : color,
      }}
      aria-label={`Select ${label} border color`}
    />
  );
}
