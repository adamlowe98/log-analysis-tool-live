import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Theme Context for Dark/Light Mode Management
 * 
 * This context provides application-wide theme management with support for:
 * - Dark and light mode themes
 * - System preference detection
 * - Persistent theme storage in localStorage
 * - Automatic DOM class management for Tailwind CSS
 * 
 * The theme system integrates with Tailwind CSS's dark mode functionality
 * and provides smooth transitions between themes throughout the application.
 */

/**
 * Theme Context Type Definition
 * 
 * Defines the interface for theme-related state and actions
 * available to consuming components.
 */
interface ThemeContextType {
  /** Current dark mode state */
  isDarkMode: boolean;
  
  /** Function to toggle between dark and light modes */
  toggleDarkMode: () => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * Create the theme context with undefined default
 * This forces consumers to use the context within a provider
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider Component
 * 
 * Manages theme state and provides theme functionality to child components.
 * Handles initialization from localStorage and system preferences.
 * 
 * @param children - Child components that will have access to theme context
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // ============================================================================
  // THEME STATE INITIALIZATION
  // ============================================================================
  
  /**
   * Initialize theme state with intelligent defaults
   * 
   * Priority order:
   * 1. Saved preference in localStorage
   * 2. System/browser preference
   * 3. Default to light mode
   */
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first for user's explicit preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    
    // Fall back to system preference if no saved preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // ============================================================================
  // THEME PERSISTENCE AND DOM MANAGEMENT
  // ============================================================================
  
  /**
   * Effect to handle theme persistence and DOM updates
   * 
   * Runs whenever isDarkMode changes to:
   * - Save preference to localStorage
   * - Update document classes for Tailwind CSS
   */
  useEffect(() => {
    // Persist theme preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // Apply theme to document for Tailwind CSS dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // ============================================================================
  // THEME ACTIONS
  // ============================================================================
  
  /**
   * Toggle between dark and light modes
   * 
   * Provides a simple way for components to switch themes
   * without needing to manage the state directly.
   */
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // ============================================================================
  // CONTEXT PROVIDER
  // ============================================================================
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to use theme context
 * 
 * Provides a convenient way to access theme state and actions
 * with built-in error checking to ensure proper usage.
 * 
 * @returns Theme context value with current state and actions
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  // Ensure hook is used within a ThemeProvider
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}