"use client";

import React from "react";
import { useTheme } from "../context/ThemeContext";

/**
 * Footer component
 * Displays copyright information at the bottom of pages
 * Respects dark mode theme setting
 */
const Footer = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer
      className={`w-full border-t py-10 mt-auto ${
        isDarkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-[#f9f9f9d6] border-gray-100"
      }`}
    >
      <div className="max-w-[1296px] mx-auto px-8">
        <p
          className={`text-[14px] font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          © 2025 InterviewAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
