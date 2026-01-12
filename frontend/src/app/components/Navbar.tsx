"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  BrainCircuit,
  ChartNoAxesColumn,
  CircleUserRound,
  FileUser,
  Menu,
  X,
} from "lucide-react";

/**
 * Navigation bar component
 * Displays main navigation links and user profile avatar
 * Includes mobile menu toggle and responsive layout
 */
export default function Navbar() {
  const { isDarkMode } = useTheme();

  type Me = {
    name: string | null;
    avatarUrl: string | null;
    avatarShape: string | null;
    avatarBorder: string | null;
  };

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    async function loadMe() {
      const token = localStorage.getItem("token");
      if (!token) {
        setMe(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setMe(null);
          return;
        }

        const data = await res.json();
        setMe({
          name: data?.user?.name ?? null,
          avatarUrl: data?.user?.avatarUrl ?? null,
          avatarShape: data?.user?.avatarShape ?? null,
          avatarBorder: data?.user?.avatarBorder ?? null,
        });
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Navigation links configuration
  const links = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Practice", href: "/practice", icon: BrainCircuit },
    { label: "Analytics", href: "/analytics", icon: ChartNoAxesColumn },
    { label: "Resume", href: "/resume", icon: FileUser },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /**
   * Render user profile avatar component
   * Shows loading skeleton while fetching profile data
   */
  function ProfileAvatar({
    me,
    isLoading,
  }: {
    me: Me | null;
    isLoading: boolean;
  }) {
    // Show skeleton while loading
    if (isLoading) {
      return (
        <div
          className={`w-9 h-9 rounded-full animate-pulse ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        />
      );
    }

    // Extract initials from user name
    const initials =
      (me?.name ?? "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "U";

    const isCircle = (me?.avatarShape ?? "circle") === "circle";

    const border = me?.avatarBorder?.startsWith("#")
      ? me.avatarBorder
      : me?.avatarBorder === "green"
      ? "#22c55e"
      : "#3D7AF5";

    // Use avatar image if available
    if (me?.avatarUrl) {
      return (
        <img
          src={me.avatarUrl}
          alt="Profile avatar"
          className={[
            "w-9 h-9 object-cover",
            isCircle ? "rounded-full" : "rounded-xl",
          ].join(" ")}
          style={{ border: `2px solid ${border}` }}
        />
      );
    }

    // Fallback to initials badge
    return (
      <div
        className={[
          "w-9 h-9 flex items-center justify-center text-xs font-semibold",
          isCircle ? "rounded-full" : "rounded-xl",
          isDarkMode
            ? "bg-gray-700 text-gray-300"
            : "bg-gray-100 text-gray-700",
        ].join(" ")}
        style={{ border: `2px solid ${border}` }}
      >
        {initials}
      </div>
    );
  }

  return (
    <header
      className={`fixed top-0 left-0 w-full h-16 shadow-[0_2px_4px_rgba(0,0,0,0.08)] z-50 ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl h-full px-4 sm:px-8 flex items-center justify-between">
        {/* LEFT: Hamburger + Brand */}
        <div className="flex items-center gap-2 sm:gap-10">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
            }`}
          >
            {mobileOpen ? (
              <X
                className={`w-6 h-6 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              />
            ) : (
              <Menu
                className={`w-6 h-6 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              />
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3D7AF5] rounded-lg flex items-center justify-center">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <Link
              href="/dashboard"
              className="font-semibold text-[#3D7AF5] text-lg tracking-tight"
            >
              InterviewAI
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className={`h-10 px-4 flex items-center justify-center rounded-lg gap-3 transition-all duration-200 text-[13px] font-semibold tracking-tight ${
                    isActive
                      ? "text-[#3D7AF5] bg-[#3D7AF5]/10"
                      : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-[#3D7AF5]"
                        : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: Profile icon */}
        <Link
          href="/profile"
          className={`mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
            isDarkMode
              ? "text-gray-300 hover:bg-gray-700"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className="shrink-0">
            {/* Pass loading state here */}
            <ProfileAvatar me={me} isLoading={loading} />
          </div>
          Profile
        </Link>
      </div>

      {mobileOpen && (
        <div
          className={`md:hidden border-t ${
            isDarkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-100 bg-white"
          }`}
        >
          <nav className="px-4 py-3 flex flex-col gap-1">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                    isActive
                      ? "bg-blue-50 text-[#3D7AF5]"
                      : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive
                        ? "text-[#3D7AF5]"
                        : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 w-full border-b ${
          isDarkMode ? "border-gray-700" : "border-[#F4F4F4]"
        }`}
      />
    </header>
  );
}
