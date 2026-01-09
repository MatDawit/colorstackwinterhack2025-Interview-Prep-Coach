"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the shape of our context data
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

// Create the context (initially undefined)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider component that wraps your entire app
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme state from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false; // Default to light mode
  });

  // Function to toggle between light and dark mode
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      // Save the new theme preference to localStorage
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  // Apply theme class to the document root element whenever isDarkMode changes
  // This adds/removes the 'dark' class from <html> tag
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Provide the theme state and toggle function to all child components
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to easily access theme in any component
export function useTheme() {
  const context = useContext(ThemeContext);
  
  // Throw error if hook is used outside of ThemeProvider
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}