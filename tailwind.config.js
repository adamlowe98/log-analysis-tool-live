/**
 * Tailwind CSS Configuration
 * 
 * This configuration file sets up Tailwind CSS for the log analysis application.
 * It defines the content sources, dark mode strategy, and any custom theme extensions.
 * 
 * Key configurations:
 * - Content paths for purging unused styles in production
 * - Dark mode using class strategy for manual theme switching
 * - Theme extensions for custom design system elements
 * - Plugin integrations for additional functionality
 */

/** @type {import('tailwindcss').Config} */
export default {
  // ============================================================================
  // CONTENT CONFIGURATION
  // ============================================================================
  
  /**
   * Content sources for Tailwind CSS purging
   * 
   * Tells Tailwind which files to scan for class names to include in the
   * final CSS bundle. This enables tree-shaking of unused styles in production.
   */
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  
  // ============================================================================
  // DARK MODE CONFIGURATION
  // ============================================================================
  
  /**
   * Dark mode strategy
   * 
   * Uses 'class' strategy which means dark mode is controlled by adding/removing
   * the 'dark' class on the document element. This allows for manual theme
   * switching via JavaScript rather than relying on system preferences only.
   * 
   * The ThemeContext manages this class automatically.
   */
  darkMode: 'class',
  
  // ============================================================================
  // THEME CONFIGURATION
  // ============================================================================
  
  theme: {
    /**
     * Theme extensions
     * 
     * Currently using default Tailwind theme without custom extensions.
     * This section can be expanded to add:
     * - Custom colors for brand consistency
     * - Custom spacing scales
     * - Custom typography settings
     * - Custom animation definitions
     */
    extend: {
      // Custom theme extensions can be added here as needed
      // Example:
      // colors: {
      //   brand: {
      //     primary: '#your-color',
      //     secondary: '#your-color',
      //   }
      // }
    },
  },
  
  // ============================================================================
  // PLUGINS CONFIGURATION
  // ============================================================================
  
  /**
   * Tailwind CSS plugins
   * 
   * Currently no additional plugins are configured.
   * Common plugins that might be added:
   * - @tailwindcss/forms for better form styling
   * - @tailwindcss/typography for rich text content
   * - @tailwindcss/aspect-ratio for responsive aspect ratios
   */
  plugins: [],
};