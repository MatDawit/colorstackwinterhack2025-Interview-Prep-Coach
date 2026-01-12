"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  mounted: boolean;
  refreshTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // Function to fetch theme from backend
  const fetchTheme = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsDarkMode(false);
        return false;
      }

      const response = await fetch("http://localhost:5000/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const darkModeEnabled = data.ok && data.user?.darkMode ? true : false;
        setIsDarkMode(darkModeEnabled);
        // Cache in localStorage for instant loading next time
        localStorage.setItem(
          "cachedDarkMode",
          darkModeEnabled ? "true" : "false"
        );
        return darkModeEnabled;
      } else {
        setIsDarkMode(false);
        return false;
      }
    } catch (error) {
      console.error("Failed to fetch theme:", error);
      setIsDarkMode(false);
      return false;
    }
  }, []);

  // Initialize theme on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // User is logged in - always fetch fresh from backend, don't use cache on login
      // Start with null to show no flash
      setIsDarkMode(null);
      // Fetch immediately from backend
      fetchTheme();
    } else {
      // User is not logged in
      setIsDarkMode(false);
      localStorage.removeItem("cachedDarkMode");
    }

    setMounted(true);
  }, [fetchTheme]);

  // Listen for storage changes and poll for token changes
  useEffect(() => {
    let previousToken = localStorage.getItem("token");

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (!e.newValue) {
          // Token was removed (user logged out)
          setIsDarkMode(false);
          localStorage.removeItem("cachedDarkMode");
        } else {
          // Token was added or changed (user logged in) - clear cache to force fresh fetch
          localStorage.removeItem("cachedDarkMode");
          // Start with null to avoid stale cache
          setIsDarkMode(null);
          fetchTheme();
        }
      }
    };

    // Also check periodically for token changes (for same-tab logins)
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== previousToken) {
        previousToken = currentToken;
        if (currentToken) {
          // Token was added - clear cache to force fresh fetch
          localStorage.removeItem("cachedDarkMode");
          setIsDarkMode(null);
          fetchTheme();
        } else {
          // Token was removed
          setIsDarkMode(false);
          localStorage.removeItem("cachedDarkMode");
        }
      }
    }, 100); // Check every 100ms for faster login detection

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [fetchTheme]);

  // Apply 'dark' class to <html> whenever theme changes (no mounted check - apply immediately)
  useEffect(() => {
    if (isDarkMode === null) {
      return; // Still initializing, use cached value
    }

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newDarkMode = !isDarkMode;

    try {
      const response = await fetch("http://localhost:5000/api/profile", {
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
