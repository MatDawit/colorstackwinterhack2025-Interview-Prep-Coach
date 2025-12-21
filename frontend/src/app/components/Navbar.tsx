// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { LayoutDashboard, BrainCircuit, ChartNoAxesColumn, CircleUserRound } from "lucide-react";

// export default function Navbar() {
//   const pathname = usePathname();
  
//   const isDashboard = pathname?.startsWith("/dashboard");
//   const isPractice = pathname?.startsWith("/practice");
//   const isAnalytics = pathname?.startsWith("/analytics");

//   return (
//     <header className="relative z-40 h-16 w-full bg-black shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
//       <div className="relative mx-auto w-full max-w-[1440px] h-16">
//         {/* Brand icon square */}
//         <div className="absolute top-[15px] left-[32px] h-8 w-8 rounded-[6px] bg-[#6A99F7] flex items-center justify-center">
//           <BrainCircuit className="h-[22px] w-[22px] text-black" />
//         </div>

//         {/* Brand text */}
//         <Link
//           href="/"
//           style={{ fontFamily: "Inter" }}
//           className="absolute top-[21px] left-[70px] text-[20px] leading-[20px] font-bold text-[#6A99F7]"
//         >
//           InterviewAI
//         </Link>

//         {/* Dashboard */}
//         <Link
//           href="/dashboard"
//           aria-label="Dashboard"
//           style={{ fontFamily: "Inter" }}
//           className={`absolute top-[11px] left-[198px] h-10 w-[124.65625px] px-3 inline-flex items-center justify-center text-sm leading-[22px] font-medium bg-transparent rounded-lg gap-4 ${
//             isDashboard ? "text-[#6A99F7]" : "text-white"
//           }`}
//         >
//           <LayoutDashboard className={`h-4 w-4 ${isDashboard ? "text-[#6A99F7]" : ""}`} />
//           Dashboard
//         </Link>

//         {/* Practice */}
//         <Link
//           href="/practice"
//           aria-label="Practice"
//           style={{ fontFamily: "Inter" }}
//           className={`absolute top-[11px] left-[339px] h-10 w-[109.09375px] px-3 inline-flex items-center justify-center text-sm leading-[22px] font-medium bg-transparent rounded-lg gap-4 ${
//             isPractice ? "text-[#6A99F7]" : "text-white"
//           }`}
//         >
//           <BrainCircuit className={`h-4 w-4 ${isPractice ? "text-[#6A99F7]" : ""}`} />
//           Practice
//         </Link>

//         {/* Analytics */}
//         <Link
//           href="/analytics"
//           aria-label="Analytics"
//           style={{ fontFamily: "Inter" }}
//           className={`absolute top-[11px] left-[464px] h-10 w-[117.65625px] px-3 inline-flex items-center justify-center text-sm leading-[22px] font-medium bg-transparent rounded-lg gap-4 ${
//             isAnalytics ? "text-[#6A99F7]" : "text-white"
//           }`}
//         >
//           <ChartNoAxesColumn className={`h-4 w-4 ${isAnalytics ? "text-[#6A99F7]" : ""}`} />
//           Analytics
//         </Link>

//         {/* Avatar */}
//         <div className="absolute top-[13px] left-[1372px] w-9 h-9 bg-[#E3FED8] overflow-hidden rounded-[18px] flex items-center justify-center">
//           <CircleUserRound className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
//         </div>

//         {/* Bottom line */}
//         <div className="absolute top-[64px] left-0 w-[1440px] border-t border-[#383838]" />
//       </div>
//     </header>
//   );
// }
