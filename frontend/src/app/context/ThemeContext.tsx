"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Theme context type definition
 * Provides dark mode toggle and theme state management
 */
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  mounted: boolean;
  refreshTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Theme provider component
 * Manages dark/light mode state and persists user preference to backend
 * Handles theme synchronization across browser tabs
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch theme preference from backend
  const fetchTheme = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsDarkMode(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If 401 or 500, clear token - backend is likely restarted
      if (response.status === 401 || response.status === 500) {
        localStorage.removeItem("token");
        setIsDarkMode(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setIsDarkMode(data.user?.darkMode ?? false);
      }
    } catch (error) {
      console.error("Failed to fetch theme:", error);
      setIsDarkMode(false);
    }
  }, []);

  // Initialize theme on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // User is logged in - fetch fresh from backend
      setIsDarkMode(null);
      fetchTheme();
    } else {
      // User is not logged in - use light mode default
      setIsDarkMode(false);
      localStorage.removeItem("cachedDarkMode");
    }

    setMounted(true);
  }, [fetchTheme]);

  // Listen for storage changes and token modifications
  useEffect(() => {
    let previousToken = localStorage.getItem("token");

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (!e.newValue) {
          // Token was removed (logout)
          setIsDarkMode(false);
          localStorage.removeItem("cachedDarkMode");
        } else {
          // Token was added/changed (login)
          localStorage.removeItem("cachedDarkMode");
          setIsDarkMode(null);
          fetchTheme();
        }
      }
    };

    // Check periodically for token changes (same-tab login detection)
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== previousToken) {
        previousToken = currentToken;
        if (currentToken) {
          // Token was added
          localStorage.removeItem("cachedDarkMode");
          setIsDarkMode(null);
          fetchTheme();
        } else {
          // Token was removed
          setIsDarkMode(false);
          localStorage.removeItem("cachedDarkMode");
        }
      }
    }, 100);

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [fetchTheme]);

  // Apply theme class to DOM
  useEffect(() => {
    if (isDarkMode === null) {
      return; // Still initializing
    }

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Toggle theme and persist to backend
  const toggleTheme = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newDarkMode = !isDarkMode;

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ darkMode: newDarkMode }),
      });

      if (response.ok) {
        setIsDarkMode(newDarkMode);
      }
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  };

  // Force refresh theme from backend
  const refreshTheme = () => {
    fetchTheme();
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode: isDarkMode ?? false,
        toggleTheme,
        mounted,
        refreshTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
