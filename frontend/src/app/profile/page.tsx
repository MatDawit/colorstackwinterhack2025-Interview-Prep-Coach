"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import {
  Home,
  Settings,
  Keyboard,
  User,
  UserCircle2,
  BrainCircuit,
  ChartNoAxesColumn,
  Upload,
  MapPin,
  Mail,
  AtSign,
} from "lucide-react";

type ProfileForm = {
  name: string;
  email: string;
  displayName: string;
  location: string;
  bio: string;
};

export default function ProfilePage() {
  // ✅ TEMP: replace later with real auth check
  const isSignedIn = true;

  // Form state (what user edits)
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    displayName: "",
    location: "",
    bio: "",
  });

  const [avatarShape, setAvatarShape] = useState<"circle" | "square">("circle");
  const [borderColor, setBorderColor] = useState<"blue" | "green">("blue");

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // -----------------------------
  // Guest view (you already had)
  // -----------------------------
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-24 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Profile
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your account details and preferences.
            </p>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Guest User</p>
              <p className="mt-1 text-sm text-gray-600">Not signed in</p>

              <div className="mt-6 grid gap-3">
                <button className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                  Sign in
                </button>
                <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Create account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Signed-in view (screenshot UI)
  // -----------------------------
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Page layout: sidebar + content */}
      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-100 bg-white px-4 py-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">
            Navigation
          </div>

          <nav className="mt-3 flex flex-col gap-1">
            <SidebarLink href="/dashboard" label="Home" icon={<Home className="h-4 w-4" />} />
            <SidebarGroup label="Settings" icon={<Settings className="h-4 w-4" />}>
              <SidebarSubLink label="Shortcuts" icon={<Keyboard className="h-4 w-4" />} />
              <SidebarSubLink label="Account" icon={<User className="h-4 w-4" />} />
              <SidebarSubLink label="Personal" active icon={<UserCircle2 className="h-4 w-4" />} />
            </SidebarGroup>

            <div className="my-3 h-px bg-gray-100" />

            <SidebarLink href="/practice" label="Practice" icon={<BrainCircuit className="h-4 w-4" />} />
            <SidebarLink href="/analytics" label="Analytics" icon={<ChartNoAxesColumn className="h-4 w-4" />} />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-white px-6 py-6">
          <div className="max-w-4xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Profile Settings</p>
                <h1 className="mt-1 text-xl font-semibold text-gray-900 tracking-tight">
                  Manage Your Profile
                </h1>
              </div>
            </div>

            {/* Basic Info Card */}
            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal details and contact information.
              </p>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  icon={<User className="h-4 w-4 text-gray-400" />}
                  value={form.name}
                  onChange={(v) => updateField("name", v)}
                />
                <Input
                  label="Email"
                  icon={<Mail className="h-4 w-4 text-gray-400" />}
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                />
                <Input
                  label="Display Name"
                  icon={<AtSign className="h-4 w-4 text-gray-400" />}
                  value={form.displayName}
                  onChange={(v) => updateField("displayName", v)}
                />
                <Input
                  label="Location"
                  icon={<MapPin className="h-4 w-4 text-gray-400" />}
                  value={form.location}
                  onChange={(v) => updateField("location", v)}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  className="w-full min-h-[96px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>

            {/* Avatar Card */}
            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Avatar Customization</h2>
              <p className="mt-1 text-sm text-gray-500">
                Upload a profile picture and customize its appearance.
              </p>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    Upload Avatar
                  </button>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-gray-700">Shape</p>
                    <div className="mt-2 flex gap-2">
                      <ToggleButton
                        active={avatarShape === "circle"}
                        onClick={() => setAvatarShape("circle")}
                        label="Circle"
                      />
                      <ToggleButton
                        active={avatarShape === "square"}
                        onClick={() => setAvatarShape("square")}
                        label="Square"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-gray-700">Border Color</p>
                    <div className="mt-2 flex gap-2">
                      <ColorDot
                        active={borderColor === "blue"}
                        onClick={() => setBorderColor("blue")}
                        className="bg-blue-500"
                      />
                      <ColorDot
                        active={borderColor === "green"}
                        onClick={() => setBorderColor("green")}
                        className="bg-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      "h-24 w-24 bg-gray-100 flex items-center justify-center overflow-hidden",
                      avatarShape === "circle" ? "rounded-full" : "rounded-xl",
                      borderColor === "blue" ? "ring-4 ring-blue-500" : "ring-4 ring-green-500",
                    ].join(" ")}
                  >
                    <span className="text-gray-500 font-semibold text-lg">AJ</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">Preview</p>
                </div>
              </div>
            </section>

            {/* Footer buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                Cancel
              </button>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/*  Small UI helpers  */

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
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        active ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50",
      ].join(" ")}
    >
      <span className={active ? "text-blue-600" : "text-gray-400"}>{icon}</span>
      {label}
    </div>
  );
}

function Input({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
        {icon}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-gray-900 outline-none"
        />
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border px-3 py-2 text-sm font-semibold",
        active
          ? "border-blue-600 bg-blue-600 text-white"
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
  className,
}: {
  active: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-6 w-6 rounded-full",
        className,
        active ? "ring-2 ring-offset-2 ring-gray-900" : "ring-0",
      ].join(" ")}
      aria-label="Select border color"
    />
  );
}
