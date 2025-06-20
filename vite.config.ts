import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration
 * 
 * This configuration file sets up the Vite build tool for the React application.
 * Vite provides fast development server and optimized production builds.
 * 
 * Configuration includes:
 * - React plugin for JSX support and Fast Refresh
 * - Optimization settings for better performance
 * - Development server configuration
 * 
 * The optimizeDeps.exclude setting for 'lucide-react' prevents Vite from
 * pre-bundling this dependency, which can help with build performance
 * and avoid potential issues with icon loading.
 */

// https://vitejs.dev/config/
export default defineConfig({
  // ============================================================================
  // PLUGINS CONFIGURATION
  // ============================================================================
  
  plugins: [
    /**
     * React plugin provides:
     * - JSX transformation
     * - Fast Refresh for hot module replacement
     * - React-specific optimizations
     */
    react()
  ],
  
  // ============================================================================
  // DEPENDENCY OPTIMIZATION
  // ============================================================================
  
  optimizeDeps: {
    /**
     * Exclude lucide-react from pre-bundling
     * 
     * This prevents Vite from pre-bundling the lucide-react icon library,
     * which can improve build performance and avoid potential issues with
     * dynamic icon imports and tree-shaking.
     */
    exclude: ['lucide-react'],
  },
});