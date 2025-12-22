"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BrainCircuit, 
  ChartNoAxesColumn, 
  CircleUserRound 
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Practice", href: "/practice", icon: BrainCircuit },
    { label: "Analytics", href: "/analytics", icon: ChartNoAxesColumn },
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] z-50">
      {/* Centered Container */}
      <div className="mx-auto w-full max-w-360 h-full px-8 flex items-center justify-between relative">
        
        {/* Left Side: Brand + Links */}
        <div className="flex items-center gap-10">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3D7AF5] rounded-lg flex items-center justify-center">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <Link href="/" className="font-bold text-[#3D7AF5] text-xl tracking-tight">
              InterviewAI
            </Link>
          </div>

          {/* Navigation Links Loop */}
          <nav className="flex items-center gap-2">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className={`font-['Inter'] h-10 px-4 flex items-center justify-center rounded-lg gap-3 transition-all duration-200 text-sm font-medium ${
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

        {/* Right Side: Avatar */}
        <div className="w-9 h-9 bg-[#F5E7F9] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
          <CircleUserRound className="w-6 h-6 text-gray-700" strokeWidth={1.5} 
          />
        </div>
      </div>

      {/* Bottom Separator Line (Full width) */}
      <div className="absolute bottom-0 left-0 w-full border-b border-[#F4F4F4]" />
    </header>
  );
}