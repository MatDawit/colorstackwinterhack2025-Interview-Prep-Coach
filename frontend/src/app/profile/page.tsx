"use client";

import { useState } from "react";
import { useEffect } from "react";
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


    //This state checks if the user is signed in or not
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

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

            setAvatarShape((data.user.avatarShape as "circle" | "square") ?? "circle");
            setBorderColor((data.user.avatarBorder === "green" ? "green" : "blue") as "blue" | "green");
            } catch (e) {
            console.error(e);
            } finally {
            setLoading(false);
            }
        }

        loadProfile();
    }, []);



    function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
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
        }),
        });

        const raw = await res.text();
        let data: any;
        try {
        data = JSON.parse(raw);
        } catch {
        console.error("Non-JSON response:", raw);
        throw new Error("Backend returned non-JSON");
        }

        if (!res.ok) throw new Error(data.error || "Failed to save profile.");

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
    } catch (e) {
        console.error(e);
        setSaveStatus("error");
    }
    }


  //loading state
    if (loading) {
    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 px-4 max-w-3xl mx-auto text-sm text-gray-600">
            Loading profile...
        </div>
        </div>
    );
    }


  // Guest view UI
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

  // Signed-in view
// Signed-in view
return (
  <div className="min-h-screen bg-gray-50">
    <Navbar />

    {/* Page layout */}
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
                  <SidebarSubLink label="Shortcuts" icon={<Keyboard className="h-4 w-4" />} />
                  <SidebarSubLink label="Account" icon={<User className="h-4 w-4" />} />
                  <SidebarSubLink label="Personal" active icon={<UserCircle2 className="h-4 w-4" />} />
                </SidebarGroup>

                <div className="my-3 h-px bg-gray-100" />

                <SidebarLink href="/practice" label="Practice" icon={<BrainCircuit className="h-4 w-4" />} />
                <SidebarLink href="/analytics" label="Analytics" icon={<ChartNoAxesColumn className="h-4 w-4" />} />
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            <div className="max-w-4xl">
              {/* Header card (modern look) */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar preview */}
                    <div
                      className={[
                        "h-14 w-14 bg-gray-100 flex items-center justify-center overflow-hidden",
                        avatarShape === "circle" ? "rounded-full" : "rounded-2xl",
                        borderColor === "blue" ? "ring-2 ring-blue-500" : "ring-2 ring-green-500",
                      ].join(" ")}
                    >
                      <span className="text-gray-600 font-semibold">
                        {(form.name || "User")
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase())
                          .join("") || "U"}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Profile Settings</p>
                      <h1 className="mt-1 text-xl font-semibold text-gray-900 tracking-tight">
                        Manage Your Profile
                      </h1>
                      <p className="mt-1 text-sm text-gray-600">
                        {form.email || "Signed in"}
                      </p>
                    </div>
                  </div>

                  {/* Top right actions */}
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                      Cancel
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
              <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
                    placeholder="Your name"
                  />

                  <Input
                    label="Email"
                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                    value={form.email}
                    readOnly
                  />

                  <Input
                    label="Display Name"
                    icon={<AtSign className="h-4 w-4 text-gray-400" />}
                    value={form.displayName}
                    onChange={(v) => updateField("displayName", v)}
                    placeholder="e.g. John Doe"
                  />

                  <Input
                    label="Location"
                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                    value={form.location}
                    onChange={(v) => updateField("location", v)}
                    placeholder="City, State"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    placeholder="Tell us a little about yourself..."
                    className="w-full min-h-[110px] rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </section>

              {/* Avatar */}
              <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Avatar</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Upload a profile picture and customize its appearance.
                    </p>
                  </div>

                  <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
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
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <div
                      className={[
                        "h-24 w-24 bg-white flex items-center justify-center overflow-hidden shadow-sm",
                        avatarShape === "circle" ? "rounded-full" : "rounded-2xl",
                        borderColor === "blue" ? "ring-4 ring-blue-500" : "ring-4 ring-green-500",
                      ].join(" ")}
                    >
                      <span className="text-gray-600 font-semibold text-lg">
                        {(form.name || "User")
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase())
                          .join("") || "U"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">Preview</p>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
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
  readOnly = false,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      <div
        className={[
          "flex items-center gap-2 rounded-xl border px-3 py-3",
          readOnly ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-white",
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
            readOnly ? "text-gray-500" : "text-gray-900",
          ].join(" ")}
        />
      </div>

      {readOnly && (
        <p className="mt-1 text-xs text-gray-500">
          Email is tied to your login and can’t be changed here.
        </p>
      )}
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
