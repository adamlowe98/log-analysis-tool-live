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
import { AuditFileUpload } from './components/AuditFileUpload';
import { AuditSummary } from './components/AuditSummary';
import { AuditCategorizedTable } from './components/AuditCategorizedTable';
import { AuditTable } from './components/AuditTable';
import { parseLogFile, generateLogSummary } from './utils/logParser';
import { parseAuditTrailCSV, generateAuditSummary } from './utils/auditParser';
import { LogEntry, LogSummary as LogSummaryType } from './types/log';
import { AuditEntry, AuditSummary as AuditSummaryType } from './types/audit';
import { saveAnalysisSession } from './lib/supabase';
import { BarChart3, FileText, TrendingUp, RotateCcw, FileDown, Bot, Shield, Activity, BookOpen, FileSpreadsheet, Table } from 'lucide-react';

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
 * Application mode type
 */
type AppMode = 'logs' | 'audit';

/**
 * Main Application Component
 * 
 * This is the root component that orchestrates the entire application workflow:
 * 1. Authentication - Password protection for secure access
 * 2. Mode Selection - Switch between log analysis and audit trail analysis
 * 3. File Upload - Handles log file upload and parsing
 * 4. Analysis Display - Shows summary, charts, and detailed tables
 * 5. Report Generation - Creates PDF reports with analysis results
 * 6. AI Integration - Optional AI assistant for enhanced insights
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
   * Application mode - switches between log analysis and audit trail analysis
   */
  const [appMode, setAppMode] = useState<AppMode>('logs');
  
  /**
   * Knowledge base visibility state
   * Controls whether the developer documentation is shown
   */
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  
  // LOG ANALYSIS STATE
  /**
   * Core log analysis data - parsed log entries from uploaded file
   */
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  /**
   * Log analysis summary - aggregated statistics and insights
   */
  const [logSummary, setLogSummary] = useState<LogSummaryType | null>(null);
  
  // AUDIT TRAIL STATE
  /**
   * Core audit trail data - parsed audit entries from uploaded CSV
   */
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  
  /**
   * Audit trail analysis summary - aggregated statistics and insights
   */
  const [auditSummary, setAuditSummary] = useState<AuditSummaryType | null>(null);
  
  // SHARED STATE
  /**
   * Original filename of the uploaded file
   */
  const [filename, setFilename] = useState<string>('');
  
  /**
   * Active tab state - controls which analysis view is displayed
   */
  const [activeTab, setActiveTab] = useState<'summary' | 'charts' | 'table' | 'report' | 'categorized'>('summary');
  
  /**
   * Reset operation state - provides user feedback during data clearing
   */
  const [isResetting, setIsResetting] = useState(false);
  
  /**
   * Additional report content from AI assistant
   */
  const [addedReportContent, setAddedReportContent] = useState<AddedContent[]>([]);

  // ============================================================================
  // AUTHENTICATION MANAGEMENT
  // ============================================================================
  
  /**
   * Check for existing authentication on component mount
   */
  useEffect(() => {
    const authStatus = sessionStorage.getItem('logAnalyzerAuth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  /**
   * Handle successful authentication
   */
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('logAnalyzerAuth', 'authenticated');
  };

  // ============================================================================
  // MODE SWITCHING
  // ============================================================================
  
  /**
   * Handle switching between log analysis and audit trail modes
   */
  const handleModeSwitch = (newMode: AppMode) => {
    if (newMode === appMode) return; // No change needed
    
    // Switch mode and reset all data
    setAppMode(newMode);
    setLogs([]);
    setLogSummary(null);
    setAuditEntries([]);
    setAuditSummary(null);
    setFilename('');
    setActiveTab('summary');
    setAddedReportContent([]);
  };

  // ============================================================================
  // FILE PROCESSING AND ANALYSIS
  // ============================================================================
  
  /**
   * Handle log file upload and processing
   */
  const handleLogFileUpload = async (content: string, fileName: string) => {
    try {
      console.log('Starting fresh log file processing...');
      
      const parsedLogs = parseLogFile(content);
      const summary = generateLogSummary(parsedLogs);
      
      setLogs(parsedLogs);
      setLogSummary(summary);
      setFilename(fileName);
      setActiveTab('summary');

      console.log(`Processed ${parsedLogs.length} log entries from ${fileName}`);

      // Save analysis session metadata to database
      try {
        await saveAnalysisSession({
          filename: fileName,
          total_entries: summary.totalEntries,
          error_count: summary.errorCount,
          warning_count: summary.warningCount,
          info_count: summary.infoCount,
          debug_count: summary.debugCount,
        });
      } catch (dbError) {
        console.error('Failed to save analysis session:', dbError);
      }
    } catch (error) {
      console.error('Error parsing log file:', error);
    }
  };

  /**
   * Handle audit trail CSV upload and processing
   */
  const handleAuditFileUpload = async (content: string, fileName: string) => {
    try {
      console.log('Starting fresh audit trail processing...');
      
      const parsedEntries = parseAuditTrailCSV(content);
      const summary = generateAuditSummary(parsedEntries);
      
      setAuditEntries(parsedEntries);
      setAuditSummary(summary);
      setFilename(fileName);
      setActiveTab('summary');

      console.log(`Processed ${parsedEntries.length} audit entries from ${fileName}`);
    } catch (error) {
      console.error('Error parsing audit trail CSV:', error);
    }
  };

  // ============================================================================
  // APPLICATION RESET FUNCTIONALITY
  // ============================================================================
  
  /**
   * Reset application to initial state
   */
  const handleReset = async () => {
    setIsResetting(true);
    
    console.log('Resetting application state...');
    
    // Clear all analysis state
    setLogs([]);
    setLogSummary(null);
    setAuditEntries([]);
    setAuditSummary(null);
    setFilename('');
    setActiveTab('summary');
    setAddedReportContent([]);
    
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

  // Show knowledge base if requested
  if (showKnowledgeBase) {
    return <KnowledgeBase onClose={() => setShowKnowledgeBase(false)} />;
  }

  // ============================================================================
  // TAB CONFIGURATION BASED ON MODE
  // ============================================================================
  
  const getTabsForMode = () => {
    if (appMode === 'logs') {
      return [
        { id: 'summary', name: 'Summary', icon: FileText },
        { id: 'charts', name: 'Charts', icon: BarChart3 },
        { id: 'table', name: 'Log Table', icon: TrendingUp },
        { id: 'report', name: 'Generate Report', icon: FileDown },
      ];
    } else {
      return [
        { id: 'summary', name: 'Summary', icon: FileText },
        { id: 'categorized', name: 'Categorized Events', icon: BarChart3 },
        { id: 'table', name: 'All Events', icon: Table },
      ];
    }
  };

  const tabs = getTabsForMode();
  const hasData = appMode === 'logs' ? logs.length > 0 : auditEntries.length > 0;
  const currentSummary = appMode === 'logs' ? logSummary : auditSummary;

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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl animate-pulse opacity-20"></div>
                <div className={`relative bg-gradient-to-br ${
                  appMode === 'logs' 
                    ? 'from-blue-600 via-purple-600 to-indigo-700' 
                    : 'from-green-600 via-teal-600 to-blue-700'
                } p-3 rounded-xl shadow-lg transition-all duration-300`}>
                  {appMode === 'logs' ? (
                    <Activity className="h-7 w-7 text-white" />
                  ) : (
                    <FileSpreadsheet className="h-7 w-7 text-white" />
                  )}
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {appMode === 'logs' ? 'Log Analysis Tool' : 'Audit Trail Investigator'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {appMode === 'logs' 
                    ? 'Upload and analyze log files with detailed insights and visualizations'
                    : 'Investigate ProjectWise audit trails for missing files and security events'
                  }
                </p>
              </div>
            </div>
            
            {/* Header action buttons */}
            <div className="flex items-center space-x-4">
              
              {/* Simple Mode Toggle Switch */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 transition-colors duration-200">
                <button
                  onClick={() => handleModeSwitch('logs')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    appMode === 'logs'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span>Log Analysis</span>
                </button>
                <button
                  onClick={() => handleModeSwitch('audit')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    appMode === 'audit'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Audit Trail</span>
                </button>
              </div>
              
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
              
              {/* Reset button - only shown when data exists */}
              {(hasData || filename) && (
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
          
          {/* File information display */}
          {filename && (
            <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-300">
              {appMode === 'logs' ? (
                <FileText className="h-4 w-4 mr-2" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              <span>Analyzing: <strong>{filename}</strong></span>
              {currentSummary && (
                <span className="ml-4 text-gray-500 dark:text-gray-400">
                  • {currentSummary.totalEntries.toLocaleString()} entries
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
        
        {/* Show file upload when no data is loaded */}
        {!hasData ? (
          <div className="flex items-center justify-center min-h-96">
            {appMode === 'logs' ? (
              <FileUpload onFileUpload={handleLogFileUpload} />
            ) : (
              <AuditFileUpload onFileUpload={handleAuditFileUpload} />
            )}
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
                CONTENT PANELS
                ================================================================ */}
            <div className="relative">
              
              {/* Summary Panel */}
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'summary' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'summary' && currentSummary && (
                  appMode === 'logs' ? (
                    <LogSummary summary={logSummary!} />
                  ) : (
                    <AuditSummary summary={auditSummary!} />
                  )
                )}
              </div>
              
              {/* Charts Panel (Log Analysis Only) */}
              {appMode === 'logs' && (
                <div className={`transition-all duration-300 ease-in-out ${
                  activeTab === 'charts' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                }`}>
                  {activeTab === 'charts' && (
                    <LogCharts logs={logs} />
                  )}
                </div>
              )}
              
              {/* Categorized Events Panel (Audit Trail Only) */}
              {appMode === 'audit' && (
                <div className={`transition-all duration-300 ease-in-out ${
                  activeTab === 'categorized' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                }`}>
                  {activeTab === 'categorized' && (
                    <AuditCategorizedTable entries={auditEntries} />
                  )}
                </div>
              )}
              
              {/* Table Panel */}
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'table' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'table' && (
                  appMode === 'logs' ? (
                    <LogTable logs={logs} />
                  ) : (
                    <AuditTable entries={auditEntries} />
                  )
                )}
              </div>

              {/* Report Panel (Log Analysis Only) */}
              {appMode === 'logs' && (
                <div className={`transition-all duration-300 ease-in-out ${
                  activeTab === 'report' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                }`}>
                  {activeTab === 'report' && logSummary && (
                    <ReportGenerator 
                      logs={logs} 
                      summary={logSummary} 
                      filename={filename}
                      addedContent={addedReportContent}
                      onRemoveContent={handleRemoveFromReport}
                    />
                  )}
                </div>
              )}
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
                  {appMode === 'logs' ? 'Log' : 'Audit trail'} content is processed locally and never stored in the database. 
                  Only analysis metadata (timestamps, counts) is saved for session tracking.
                  No data caching ensures fresh processing and maximum security.
                </p>
              </div>
            </div>
          </div>

          {/* AI Usage Transparency Notice (Log Analysis Only) */}
          {appMode === 'logs' && (
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
          )}

          {/* Audit Trail Security Notice */}
          {appMode === 'audit' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-200">
              <div className="flex items-start space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Audit Trail Security</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    <strong>No AI Processing:</strong> Audit trail analysis is performed entirely with browser-side code. 
                    No artificial intelligence processes your audit data. All parsing, categorization, and analysis 
                    happens locally for maximum security and privacy of sensitive audit information.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================
          AI ASSISTANT CHATBOT (LOG ANALYSIS ONLY)
          ======================================================================== */}
      {appMode === 'logs' && (
        <GeminiChatbot 
          logs={logs} 
          summary={logSummary}
          onAddToReport={handleAddToReport}
        />
      )}
    </div>
  );
}

export default App;