import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { LogSummary } from './components/LogSummary';
import { LogCharts } from './components/LogCharts';
import { LogTable } from './components/LogTable';
import { ReportGenerator } from './components/ReportGenerator';
import { GeminiChatbot } from './components/GeminiChatbot';
import { PasswordProtection } from './components/PasswordProtection';
import { ThemeToggle } from './components/ThemeToggle';
import { KnowledgeBase } from './components/KnowledgeBase';
import { parseLogFile, generateLogSummary } from './utils/logParser';
import { LogEntry, LogSummary as LogSummaryType } from './types/log';
import { saveAnalysisSession } from './lib/supabase';
import { BarChart3, FileText, TrendingUp, RotateCcw, FileDown, Bot, Shield, Activity, BookOpen } from 'lucide-react';

/**
 * Interface for additional content that can be added to reports
 * This is used by the AI assistant to add custom sections to PDF reports
 */
interface AddedContent {
  id: string;
  content: string;
  timestamp: Date;
}

/**
 * Main Application Component
 * 
 * This is the root component that orchestrates the entire log analysis workflow:
 * 1. Authentication - Password protection for secure access
 * 2. File Upload - Handles log file upload and parsing
 * 3. Analysis Display - Shows summary, charts, and detailed log table
 * 4. Report Generation - Creates PDF reports with analysis results
 * 5. AI Integration - Optional AI assistant for enhanced insights
 * 
 * The app maintains all analysis state and coordinates between components.
 * No data caching is implemented to ensure fresh processing and data security.
 */
function App() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /**
   * Authentication state - controls access to the application
   * Uses session storage to persist authentication across page reloads
   */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  /**
   * Knowledge base visibility state
   * Controls whether the developer documentation is shown
   */
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  
  /**
   * Core analysis data - parsed log entries from uploaded file
   * This is the primary data structure containing all log information
   */
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  /**
   * Analysis summary - aggregated statistics and insights
   * Generated from the logs array and used throughout the UI
   */
  const [summary, setSummary] = useState<LogSummaryType | null>(null);
  
  /**
   * Original filename of the uploaded log file
   * Used for display purposes and report generation
   */
  const [filename, setFilename] = useState<string>('');
  
  /**
   * Active tab state - controls which analysis view is displayed
   * Manages the main navigation between different analysis sections
   */
  const [activeTab, setActiveTab] = useState<'summary' | 'charts' | 'table' | 'report'>('summary');
  
  /**
   * Reset operation state - provides user feedback during data clearing
   * Shows loading state when user clicks "Start Over"
   */
  const [isResetting, setIsResetting] = useState(false);
  
  /**
   * Additional report content from AI assistant
   * Stores custom analysis sections that can be added to PDF reports
   */
  const [addedReportContent, setAddedReportContent] = useState<AddedContent[]>([]);

  // ============================================================================
  // AUTHENTICATION MANAGEMENT
  // ============================================================================
  
  /**
   * Check for existing authentication on component mount
   * Restores authentication state from session storage to persist login
   */
  useEffect(() => {
    const authStatus = sessionStorage.getItem('logAnalyzerAuth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  /**
   * Handle successful authentication
   * Sets authentication state and persists to session storage
   */
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('logAnalyzerAuth', 'authenticated');
  };

  // ============================================================================
  // FILE PROCESSING AND ANALYSIS
  // ============================================================================
  
  /**
   * Handle file upload and processing
   * 
   * This is the core workflow that:
   * 1. Parses the uploaded log file content
   * 2. Generates analysis summary and statistics
   * 3. Updates application state with results
   * 4. Saves session metadata to database (without log content)
   * 
   * No caching is applied to ensure fresh processing every time
   * 
   * @param content - Raw text content of the uploaded log file
   * @param fileName - Original filename for reference
   */
  const handleFileUpload = async (content: string, fileName: string) => {
    try {
      console.log('Starting fresh log file processing...');
      
      // Parse log file content into structured LogEntry objects
      // This handles various log formats and extracts timestamps, levels, messages
      const parsedLogs = parseLogFile(content);
      
      // Generate comprehensive analysis summary from parsed logs
      // Includes error counts, critical issues, time ranges, etc.
      const logSummary = generateLogSummary(parsedLogs);
      
      // Update application state with analysis results
      setLogs(parsedLogs);
      setSummary(logSummary);
      setFilename(fileName);
      setActiveTab('summary'); // Navigate to summary view

      console.log(`Processed ${parsedLogs.length} log entries from ${fileName}`);

      // Save analysis session metadata to database
      // IMPORTANT: Only metadata is saved, never actual log content
      try {
        await saveAnalysisSession({
          filename: fileName,
          total_entries: logSummary.totalEntries,
          error_count: logSummary.errorCount,
          warning_count: logSummary.warningCount,
          info_count: logSummary.infoCount,
          debug_count: logSummary.debugCount,
        });
      } catch (dbError) {
        console.error('Failed to save analysis session:', dbError);
        // Continue with analysis even if database save fails
        // This ensures the tool works even without database connectivity
      }
    } catch (error) {
      console.error('Error parsing log file:', error);
      // TODO: Add user-facing error handling here
    }
  };

  // ============================================================================
  // APPLICATION RESET FUNCTIONALITY
  // ============================================================================
  
  /**
   * Reset application to initial state
   * 
   * Clears all analysis data and returns to file upload screen
   * Includes visual feedback for better user experience
   * No cache clearing needed since we don't cache data
   */
  const handleReset = async () => {
    setIsResetting(true);
    
    console.log('Resetting application state...');
    
    // Clear all analysis state including AI-generated content
    setLogs([]);
    setSummary(null);
    setFilename('');
    setActiveTab('summary');
    setAddedReportContent([]);
    
    // Small delay for better UX - shows loading state briefly
    setTimeout(() => {
      setIsResetting(false);
      console.log('Application reset complete');
    }, 300);
  };

  // ============================================================================
  // AI ASSISTANT INTEGRATION
  // ============================================================================
  
  /**
   * Add content from AI assistant to report
   * 
   * Allows AI-generated insights to be included in PDF reports
   * Each piece of content is timestamped and can be removed individually
   * 
   * @param content - AI-generated analysis content
   */
  const handleAddToReport = (content: string) => {
    const newContent: AddedContent = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
    };
    setAddedReportContent(prev => [...prev, newContent]);
  };

  /**
   * Remove AI-generated content from report
   * 
   * @param id - Unique identifier of content to remove
   */
  const handleRemoveFromReport = (id: string) => {
    setAddedReportContent(prev => prev.filter(item => item.id !== id));
  };

  // ============================================================================
  // CONDITIONAL RENDERING LOGIC
  // ============================================================================
  
  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={handleAuthenticated} />;
  }

  // Show knowledge base (developer documentation) if requested
  if (showKnowledgeBase) {
    return <KnowledgeBase onClose={() => setShowKnowledgeBase(false)} />;
  }

  // ============================================================================
  // MAIN NAVIGATION CONFIGURATION
  // ============================================================================
  
  /**
   * Tab configuration for main navigation
   * Each tab represents a different view of the analysis results
   */
  const tabs = [
    { id: 'summary', name: 'Summary', icon: FileText },
    { id: 'charts', name: 'Charts', icon: BarChart3 },
    { id: 'table', name: 'Log Table', icon: TrendingUp },
    { id: 'report', name: 'Generate Report', icon: FileDown },
  ];

  // ============================================================================
  // MAIN APPLICATION RENDER
  // ============================================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      
      {/* ========================================================================
          APPLICATION HEADER
          ======================================================================== */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            
            {/* Application branding and title */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                {/* Animated gradient background for logo */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-3 rounded-xl shadow-lg">
                  <Activity className="h-7 w-7 text-white" />
                  {/* Status indicator - shows system is active */}
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Log Analysis Tool
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Upload and analyze log files with detailed insights and visualizations
                </p>
              </div>
            </div>
            
            {/* Header action buttons */}
            <div className="flex items-center space-x-4">
              
              {/* Knowledge Base access button */}
              <button
                onClick={() => setShowKnowledgeBase(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
              >
                <BookOpen className="h-4 w-4" />
                <span>Knowledge Base</span>
              </button>
              
              {/* Dark/Light theme toggle */}
              <ThemeToggle />
              
              {/* Reset button - only shown when analysis data exists */}
              {(logs.length > 0 || filename) && (
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Resetting...' : 'Start Over'}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* File information display - shown when file is loaded */}
          {filename && (
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-300">
              <FileText className="h-4 w-4 mr-2" />
              <span>Analyzing: <strong>{filename}</strong></span>
              {summary && (
                <span className="ml-4 text-gray-500 dark:text-gray-400">
                  • {summary.totalEntries.toLocaleString()} entries
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================
          MAIN CONTENT AREA
          ======================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Show file upload when no logs are loaded */}
        {!logs.length ? (
          <div className="flex items-center justify-center min-h-96">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ================================================================
                TAB NAVIGATION
                ================================================================ */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 transition-colors duration-200">
              <nav className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ================================================================
                CONTENT PANELS WITH SMOOTH TRANSITIONS
                ================================================================ */}
            <div className="relative">
              
              {/* Summary Panel - Overview statistics and key metrics */}
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'summary' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'summary' && summary && (
                  <LogSummary summary={summary} />
                )}
              </div>
              
              {/* Charts Panel - Visual analysis with graphs and charts */}
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'charts' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'charts' && (
                  <LogCharts logs={logs} />
                )}
              </div>
              
              {/* Table Panel - Detailed log entry browser with filtering */}
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'table' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'table' && (
                  <LogTable logs={logs} />
                )}
              </div>

              {/* Report Panel - PDF generation with customization options */}
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'report' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'report' && summary && (
                  <ReportGenerator 
                    logs={logs} 
                    summary={summary} 
                    filename={filename}
                    addedContent={addedReportContent}
                    onRemoveContent={handleRemoveFromReport}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            PRIVACY AND SECURITY DISCLAIMERS
            ==================================================================== */}
        <div className="space-y-4 mt-8">
          
          {/* Privacy Protection Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors duration-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-300">Privacy Protected</h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Log content is processed locally and never stored in the database. 
                  Only analysis metadata (timestamps, counts) is saved for session tracking.
                  No data caching ensures fresh processing and maximum security.
                </p>
              </div>
            </div>
          </div>

          {/* AI Usage Transparency Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-200">
            <div className="flex items-start space-x-2">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">AI Usage Notice</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  <strong>Limited AI Integration:</strong> Only the optional AI chatbot assistant uses artificial intelligence (Google Gemini). 
                  All core log analysis features (parsing, statistics, charts, and reports) are processed locally without AI. 
                  The AI assistant only receives summary statistics, never actual log content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================
          AI ASSISTANT CHATBOT
          ======================================================================== */}
      {/* 
        Floating AI assistant that can provide additional insights
        Only receives summary statistics, never actual log content
        Can generate content that gets added to PDF reports
      */}
      <GeminiChatbot 
        logs={logs} 
        summary={summary}
        onAddToReport={handleAddToReport}
      />
    </div>
  );
}

export default App;