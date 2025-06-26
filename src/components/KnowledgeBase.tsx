import React, { useState } from 'react';
import { X, ArrowLeft, Sun, Moon, FileText, HelpCircle, Settings, Clock, Code, Globe, Zap, Shield, FileSpreadsheet, Search, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface KnowledgeBaseProps {
  onClose: () => void;
}

export function KnowledgeBase({ onClose }: KnowledgeBaseProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'getting-started' | 'troubleshooting' | 'specifications' | 'changelog'>('getting-started');

  const tabs = [
    { id: 'getting-started', name: 'Getting Started', icon: FileText },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: HelpCircle },
    { id: 'specifications', name: 'Technical Specs', icon: Settings },
    { id: 'changelog', name: 'Changelog', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 transition-colors duration-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to App</span>
              </button>
              
              <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Developer Documentation
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Complete technical reference for Log Analysis & Audit Trail Tools
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-2 mb-8 shadow-lg transition-colors duration-200">
          <nav className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg transition-colors duration-200">
          {activeTab === 'getting-started' && (
            <div className="p-8 space-y-8">
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quick Start Guide</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Get up and running with both Log Analysis and Audit Trail Investigation tools. 
                  This guide covers everything from file upload to report generation.
                </p>
              </div>

              {/* Tool Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Log Analysis Tool</h3>
                      <p className="text-blue-800 dark:text-blue-300 text-sm">System log file analysis and visualization</p>
                    </div>
                  </div>
                  <ul className="text-blue-800 dark:text-blue-300 space-y-2 text-sm">
                    <li>• Upload .log, .txt, .out, .json files (up to 50MB)</li>
                    <li>• Automatic timestamp and log level detection</li>
                    <li>• Interactive charts and visualizations</li>
                    <li>• PDF report generation with AI insights</li>
                    <li>• Error pattern analysis and recommendations</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mr-4">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Trail Investigator</h3>
                      <p className="text-green-800 dark:text-green-300 text-sm">ProjectWise audit trail analysis for security</p>
                    </div>
                  </div>
                  <ul className="text-green-800 dark:text-green-300 space-y-2 text-sm">
                    <li>• Upload ProjectWise audit trail CSV files</li>
                    <li>• Categorized event analysis (deletions, movements, etc.)</li>
                    <li>• User activity tracking and investigation</li>
                    <li>• Missing file detection and security analysis</li>
                    <li>• Export filtered results for further investigation</li>
                  </ul>
                </div>
              </div>

              {/* Common Workflow Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Step 1 */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-3">1</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Choose Your Tool</h3>
                  </div>
                  <ul className="text-purple-800 dark:text-purple-300 space-y-2 text-sm">
                    <li>• Use the toggle switch in the header to select mode</li>
                    <li>• <strong>Log Analysis:</strong> For system logs, error analysis, performance monitoring</li>
                    <li>• <strong>Audit Trail:</strong> For ProjectWise security investigations, missing files</li>
                    <li>• Switch between modes anytime (data will be cleared)</li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-3">2</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Upload & Analyze</h3>
                  </div>
                  <ul className="text-orange-800 dark:text-orange-300 space-y-2 text-sm">
                    <li>• Drag & drop files or click to browse</li>
                    <li>• Automatic format detection and parsing</li>
                    <li>• Real-time processing with progress feedback</li>
                    <li>• Immediate summary statistics and insights</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold mr-3">3</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Explore Results</h3>
                  </div>
                  <ul className="text-teal-800 dark:text-teal-300 space-y-2 text-sm">
                    <li>• Navigate between Summary, Charts/Categories, and Tables</li>
                    <li>• Use search and filtering to find specific events</li>
                    <li>• Export data to CSV for external analysis</li>
                    <li>• Identify patterns and critical issues</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold mr-3">4</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Generate Reports</h3>
                  </div>
                  <ul className="text-pink-800 dark:text-pink-300 space-y-2 text-sm">
                    <li>• <strong>Log Analysis:</strong> Professional PDF reports with charts and AI insights</li>
                    <li>• <strong>Audit Trail:</strong> Export categorized events for investigation</li>
                    <li>• Custom case numbering and report naming</li>
                    <li>• Actionable recommendations and next steps</li>
                  </ul>
                </div>
              </div>

              {/* Advanced Features */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-indigo-600" />
                  Advanced Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-2">Log Analysis AI Assistant</h4>
                    <p className="text-sm text-indigo-800 dark:text-indigo-400">
                      Generate custom analysis sections and insights for enhanced reporting capabilities. 
                      Ask for specific analysis patterns or recommendations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-2">Audit Trail Categorization</h4>
                    <p className="text-sm text-indigo-800 dark:text-indigo-400">
                      Automatic categorization of audit events into investigation categories: 
                      deletions, movements, check-in/out, replacements, and other activities.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-2">Security & Privacy</h4>
                    <p className="text-sm text-indigo-800 dark:text-indigo-400">
                      All processing happens locally in your browser. No data is transmitted to external servers. 
                      Only metadata is optionally saved for session tracking.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-2">Export & Integration</h4>
                    <p className="text-sm text-indigo-800 dark:text-indigo-400">
                      Export filtered data to CSV format for further analysis in external tools. 
                      Generate professional PDF reports for documentation and sharing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'troubleshooting' && (
            <div className="p-8 space-y-8">
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-full mb-4">
                  <HelpCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Troubleshooting Guide</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Common issues and solutions for both Log Analysis and Audit Trail Investigation tools.
                </p>
              </div>

              <div className="space-y-6">
                {/* Log Analysis Issues */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
                    <Activity className="h-6 w-6 mr-3 text-blue-600" />
                    Log Analysis Tool Issues
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">File Upload Problems</h4>
                      <div className="text-blue-800 dark:text-blue-400 text-sm space-y-2">
                        <p><strong>Issue:</strong> "File size must be less than 50MB"</p>
                        <p><strong>Solutions:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• Use `split -l 10000 logfile.log` to create smaller chunks</li>
                          <li>• Extract specific time ranges: `grep "2025-01-" logfile.log &gt; filtered.log`</li>
                          <li>• Focus on error-heavy time periods for analysis</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Timestamp Detection Issues</h4>
                      <div className="text-blue-800 dark:text-blue-400 text-sm space-y-2">
                        <p><strong>Issue:</strong> Charts show "No valid timestamps found"</p>
                        <p><strong>Supported Formats:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• YYYY-MM-DD HH:mm:ss (recommended)</li>
                          <li>• ISO 8601: 2025-01-15T10:30:00Z</li>
                          <li>• Bracketed: [2025-01-15 10:30:00]</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Trail Issues */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <h3 className="text-xl font-semibold text-green-900 dark:text-green-300 mb-4 flex items-center">
                    <FileSpreadsheet className="h-6 w-6 mr-3 text-green-600" />
                    Audit Trail Investigator Issues
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">CSV Parsing Problems</h4>
                      <div className="text-green-800 dark:text-green-400 text-sm space-y-2">
                        <p><strong>Issue:</strong> "No valid data found" or parsing errors</p>
                        <p><strong>Solutions:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• Ensure CSV has proper headers (Object Type, Object Name, Action Name, etc.)</li>
                          <li>• Check that data is not all in column A (export properly from ProjectWise)</li>
                          <li>• Verify file encoding is UTF-8</li>
                          <li>• Remove any special characters or formatting from CSV</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Missing Event Categories</h4>
                      <div className="text-green-800 dark:text-green-400 text-sm space-y-2">
                        <p><strong>Issue:</strong> Events not categorized correctly</p>
                        <p><strong>Expected Action Names:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• <strong>Deletions:</strong> "Deleted", "Document Deleted", "Purge"</li>
                          <li>• <strong>Movements:</strong> "Moved", "Exported", "Sent to Folder"</li>
                          <li>• <strong>Check-in/out:</strong> "Checked Out", "Checked In", "Freed"</li>
                          <li>• <strong>Replacements:</strong> "Replaced", "Version", "Overwrite"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Issues */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-xl font-semibold text-yellow-900 dark:text-yellow-300 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">⚡</div>
                    Performance Optimization
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">Browser Requirements</h4>
                      <ul className="text-yellow-800 dark:text-yellow-400 text-sm space-y-1">
                        <li>• Chrome 120+ (recommended)</li>
                        <li>• Firefox 121+</li>
                        <li>• Safari 17+</li>
                        <li>• Edge 120+</li>
                      </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">Memory Management</h4>
                      <ul className="text-yellow-800 dark:text-yellow-400 text-sm space-y-1">
                        <li>• Close unnecessary browser tabs</li>
                        <li>• Process smaller file chunks</li>
                        <li>• Use filtering to focus analysis</li>
                        <li>• Clear browser cache if needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="p-8 space-y-8">
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full mb-4">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Technical Specifications</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Detailed technical requirements and constraints for both tools.
                </p>
              </div>

              <div className="space-y-6">
                {/* Browser Support */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-blue-600" />
                    Browser Compatibility Matrix
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">Google Chrome</h5>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Version 120+ (December 2023 or newer)</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Optimal performance & full feature support</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">Mozilla Firefox</h5>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                          Supported
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Version 121+ (December 2023 or newer)</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Full compatibility with all features</p>
                    </div>
                  </div>
                </div>

                {/* File Processing Limits */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-600" />
                    File Processing Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-3">Log Analysis Tool</h4>
                      <div className="space-y-3">
                        <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">50MB</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Maximum file size</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">.log, .txt, .out, .json</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Supported formats</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-3">Audit Trail Investigator</h4>
                      <div className="space-y-3">
                        <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">50MB</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Maximum CSV file size</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">.csv, .txt</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">ProjectWise audit formats</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security & Privacy */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                    Security & Privacy Model
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-2">Data Processing</h4>
                      <ul className="text-indigo-800 dark:text-indigo-400 text-sm space-y-1">
                        <li>• Client-side processing only</li>
                        <li>• No file content stored remotely</li>
                        <li>• Metadata-only database storage</li>
                        <li>• Session-based authentication</li>
                      </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-2">AI Integration</h4>
                      <ul className="text-indigo-800 dark:text-indigo-400 text-sm space-y-1">
                        <li>• Log Analysis: Optional AI assistant</li>
                        <li>• Audit Trail: No AI processing</li>
                        <li>• Summary statistics only (never raw data)</li>
                        <li>• Google Gemini API integration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="p-8 space-y-8">
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Release History</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Track all updates, improvements, and new features added to both tools.
                </p>
              </div>

              <div className="space-y-6">
                {/* Latest Release */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-l-4 border-blue-500">
                  <div className="flex items-center space-x-2 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">January 15, 2025</h3>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                      Latest Release
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">🎯 Major Features</h4>
                      <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 mt-1 ml-4">
                        <li>• <strong>Audit Trail Investigator:</strong> Complete ProjectWise audit trail analysis tool</li>
                        <li>• Categorized event analysis (deletions, movements, check-in/out, replacements)</li>
                        <li>• User activity tracking and security investigation features</li>
                        <li>• CSV export functionality for filtered audit data</li>
                        <li>• Dual-mode application with smooth mode switching</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">🔧 Improvements</h4>
                      <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 mt-1 ml-4">
                        <li>• Enhanced UI design with cleaner mode toggle</li>
                        <li>• Improved file parsing for various CSV formats</li>
                        <li>• Better error handling and user feedback</li>
                        <li>• Updated knowledge base with audit trail documentation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Previous Releases */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">June 19, 2025</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">📚 Documentation</h4>
                      <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 mt-1 ml-4">
                        <li>• Comprehensive Developer Documentation with tabbed navigation</li>
                        <li>• Professional Knowledge Base design for technical teams</li>
                        <li>• Enhanced troubleshooting guides with code examples</li>
                        <li>• Detailed browser compatibility matrix</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 border-l-4 border-purple-500">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">June 15, 2025</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">🤖 AI Integration</h4>
                      <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 mt-1 ml-4">
                        <li>• Google Gemini AI assistant integration for log analysis</li>
                        <li>• "Add to Report" functionality for AI content</li>
                        <li>• Contextual responses based on log statistics</li>
                        <li>• Chat interface with message history</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-6 border-l-4 border-gray-500">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">May 22, 2025</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">🚀 Initial Release</h4>
                      <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 mt-1 ml-4">
                        <li>• Core log file upload and parsing</li>
                        <li>• Basic analysis with error categorization</li>
                        <li>• Simple summary statistics</li>
                        <li>• Initial PDF report generation</li>
                        <li>• Foundation UI with React and TypeScript</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}