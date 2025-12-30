"use client";
import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";

export default function ThemeToggle() {
    const ctx = useContext(ThemeContext);
    if (!ctx) return null;

    return (
        <button
            onClick={ctx.toggleTheme}
            className="border px-3 py-1 rounded-lg text-sm mt-3 hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-white transition-colors"
        >
            {ctx.theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
    );
}
