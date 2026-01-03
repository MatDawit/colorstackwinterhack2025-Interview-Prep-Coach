"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BrainCircuit,
  ChartNoAxesColumn,
  CircleUserRound,
  Menu, // hamburger icon
  X, // close icon
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  // ✅ controls whether the mobile menu is open
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Practice", href: "/practice", icon: BrainCircuit },
    { label: "Analytics", href: "/analytics", icon: ChartNoAxesColumn },
  ];

  // ✅ close the mobile menu automatically when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] z-50">
      <div className="mx-auto w-full max-w-6xl h-full px-4 sm:px-8 flex items-center justify-between">
        {/* LEFT: Hamburger + Brand */}
        <div className="flex items-center gap-2 sm:gap-10">
          {/* ✅ Hamburger (ONLY on small screens) */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-50"
          >
            {mobileOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3D7AF5] rounded-lg flex items-center justify-center">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <Link href="/" className="font-semibold text-[#3D7AF5] text-lg tracking-tight">
              InterviewAI
            </Link>
          </div>

          {/* ✅ Desktop links (hidden on small screens) */}
          <nav className="hidden sm:flex items-center gap-2">
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
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#3D7AF5]" : "text-gray-500"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: Profile icon (links to profile page) */}
        <Link
          href="/profile"
          aria-label="Profile"
          className="w-9 h-9 bg-[#F5E7F9] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
        >
          <CircleUserRound className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
        </Link>
      </div>

      {/* ✅ Mobile dropdown menu (ONLY on small screens, and only when open) */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white">
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
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-[#3D7AF5]" : "text-gray-500"}`} />
                  {link.label}
                </Link>
              );
            })}

            <Link
              href="/profile"
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <CircleUserRound className="h-5 w-5 text-gray-500" />
              Profile
            </Link>
          </nav>
        </div>
      )}

      {/* Bottom Separator Line */}
      <div className="absolute bottom-0 left-0 w-full border-b border-[#F4F4F4]" />
    </header>
  );
}
