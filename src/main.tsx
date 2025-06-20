import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import './index.css';

/**
 * Application Entry Point
 * 
 * This is the main entry point for the React application. It sets up:
 * - React StrictMode for development warnings and checks
 * - Theme context provider for dark/light mode management
 * - Root component mounting
 * 
 * The application structure:
 * StrictMode -> ThemeProvider -> App
 * 
 * StrictMode helps identify potential problems in the application during
 * development by running additional checks and warnings.
 * 
 * ThemeProvider wraps the entire application to provide theme management
 * functionality to all components.
 */

// Get the root DOM element where the React app will be mounted
const rootElement = document.getElementById('root');

// Ensure the root element exists before proceeding
if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}

// Create the React root and render the application
createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);