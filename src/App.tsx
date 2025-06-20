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

interface AddedContent {
  id: string;
  content: string;
  timestamp: Date;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<LogSummaryType | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'charts' | 'table' | 'report'>('summary');
  const [isResetting, setIsResetting] = useState(false);
  const [addedReportContent, setAddedReportContent] = useState<AddedContent[]>([]);

  // Check for existing authentication on page load
  useEffect(() => {
    const authStatus = sessionStorage.getItem('logAnalyzerAuth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('logAnalyzerAuth', 'authenticated');
  };

  const handleFileUpload = async (content: string, fileName: string) => {
    try {
      const parsedLogs = parseLogFile(content);
      const logSummary = generateLogSummary(parsedLogs);
      
      setLogs(parsedLogs);
      setSummary(logSummary);
      setFilename(fileName);
      setActiveTab('summary');

      // Save analysis session to database (without log content)
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
      }
    } catch (error) {
      console.error('Error parsing log file:', error);
      // Handle error appropriately
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    
    // Clear all state including added report content
    setLogs([]);
    setSummary(null);
    setFilename('');
    setActiveTab('summary');
    setAddedReportContent([]);
    
    // Small delay for better UX
    setTimeout(() => {
      setIsResetting(false);
    }, 300);
  };

  const handleAddToReport = (content: string) => {
    const newContent: AddedContent = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
    };
    setAddedReportContent(prev => [...prev, newContent]);
  };

  const handleRemoveFromReport = (id: string) => {
    setAddedReportContent(prev => prev.filter(item => item.id !== id));
  };

  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={handleAuthenticated} />;
  }

  // Show knowledge base if requested
  if (showKnowledgeBase) {
    return <KnowledgeBase onClose={() => setShowKnowledgeBase(false)} />;
  }

  const tabs = [
    { id: 'summary', name: 'Summary', icon: FileText },
    { id: 'charts', name: 'Charts', icon: BarChart3 },
    { id: 'table', name: 'Log Table', icon: TrendingUp },
    { id: 'report', name: 'Generate Report', icon: FileDown },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {/* Gradient background with pulse animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-3 rounded-xl shadow-lg">
                  <Activity className="h-7 w-7 text-white" />
                  {/* Subtle glow effect */}
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
            
            <div className="flex items-center space-x-4">
              {/* Knowledge Base Button */}
              <button
                onClick={() => setShowKnowledgeBase(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
              >
                <BookOpen className="h-4 w-4" />
                <span>Knowledge Base</span>
              </button>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Reset Button */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!logs.length ? (
          <div className="flex items-center justify-center min-h-96">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
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

            {/* Content with smooth transitions */}
            <div className="relative">
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'summary' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'summary' && summary && (
                  <LogSummary summary={summary} />
                )}
              </div>
              
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'charts' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'charts' && (
                  <LogCharts logs={logs} />
                )}
              </div>
              
              <div className={`transition-all duration-300 ease-in-out ${
                activeTab === 'table' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
              }`}>
                {activeTab === 'table' && (
                  <LogTable logs={logs} />
                )}
              </div>

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

        {/* Disclaimers Section - Always Visible */}
        <div className="space-y-4 mt-8">
          {/* Privacy Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors duration-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-300">Privacy Protected</h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Log content is processed locally and never stored in the database. 
                  Only analysis metadata (timestamps, counts) is saved for session tracking.
                </p>
              </div>
            </div>
          </div>

          {/* AI Usage Disclaimer */}
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

      {/* Gemini Chatbot */}
      <GeminiChatbot 
        logs={logs} 
        summary={summary}
        onAddToReport={handleAddToReport}
      />
    </div>
  );
}

export default App;