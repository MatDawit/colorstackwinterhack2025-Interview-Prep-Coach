"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const fetchAndApplyTheme = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // Not logged in - use light mode
          document.documentElement.classList.remove("dark");
          return;
        }

        // Fetch user profile to get darkMode setting
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.user?.darkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          // Failed to fetch - default to light mode
          document.documentElement.classList.remove("dark");
        }
      } catch (error) {
        console.error("Failed to fetch theme settings:", error);
        document.documentElement.classList.remove("dark");
      }
    };

    fetchAndApplyTheme();
  }, []);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
