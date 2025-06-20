import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative inline-flex items-center justify-center w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div
        className={`absolute w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center ${
          isDarkMode ? 'translate-x-3' : '-translate-x-3'
        }`}
      >
        {isDarkMode ? (
          <Moon className="h-3 w-3 text-gray-700" />
        ) : (
          <Sun className="h-3 w-3 text-yellow-500" />
        )}
      </div>
    </button>
  );
}