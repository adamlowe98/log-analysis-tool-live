import React, { useState, useRef } from 'react';
import { FileDown, Loader2, CheckCircle, AlertCircle, MessageCircle, FileText, Trash2, Edit3, Info } from 'lucide-react';
import { LogEntry, LogSummary } from '../types/log';
import { generatePDFReport } from '../utils/pdfGenerator';

interface AddedContent {
  id: string;
  content: string;
  timestamp: Date;
}

interface ReportGeneratorProps {
  logs: LogEntry[];
  summary: LogSummary;
  filename: string;
  addedContent: AddedContent[];
  onRemoveContent: (id: string) => void;
}

export function ReportGenerator({ logs, summary, filename, addedContent, onRemoveContent }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reportName, setReportName] = useState('log-analysis-report');
  const [isEditingName, setIsEditingName] = useState(false);

  const handleGenerateReport = async () => {
    // Validate inputs
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      setError('No log data available to generate report');
      return;
    }

    if (!summary) {
      setError('No summary data available to generate report');
      return;
    }

    if (!reportName.trim()) {
      setError('Please enter a report name');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('generating');
    setError(null);

    try {
      let combinedAdditionalDetails: string | undefined;
      
      if (addedContent.length > 0) {
        const rawContent = addedContent.map(item => item.content).join('\n\n---\n\n');
        // Limit additional content to prevent PDF generation issues
        const MAX_ADDITIONAL_CONTENT_LENGTH = 8000;
        
        if (rawContent.length > MAX_ADDITIONAL_CONTENT_LENGTH) {
          combinedAdditionalDetails = rawContent.substring(0, MAX_ADDITIONAL_CONTENT_LENGTH) + 
            '\n\n[Content truncated due to length limits]';
        } else {
          combinedAdditionalDetails = rawContent;
        }
      }

      await generatePDFReport({
        logs,
        summary,
        filename,
        reportName: reportName.trim(),
        additionalDetails: combinedAdditionalDetails,
      });

      setGenerationStatus('success');
      setTimeout(() => setGenerationStatus('idle'), 3000);
    } catch (err) {
      console.error('Error generating PDF report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF report';
      setError(errorMessage);
      setGenerationStatus('error');
      setTimeout(() => setGenerationStatus('idle'), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingName(false);
  };

  const getButtonContent = () => {
    switch (generationStatus) {
      case 'generating':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating Report...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-4 w-4" />
            <span>Report Generated!</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Generation Failed</span>
          </>
        );
      default:
        return (
          <>
            <FileDown className="h-4 w-4" />
            <span>Generate PDF Report</span>
          </>
        );
    }
  };

  const getButtonClass = () => {
    const baseClass = "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed";
    
    switch (generationStatus) {
      case 'generating':
        return `${baseClass} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-not-allowed`;
      case 'success':
        return `${baseClass} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
      case 'error':
        return `${baseClass} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
      default:
        return `${baseClass} bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transform hover:scale-105`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Generate Analysis Report</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Create a comprehensive PDF report containing all analysis results, charts, and insights from the log file.
            </p>

            {/* Report Name Section */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200">
              {/* Case Number Recommendation Note */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors duration-200">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Recommendation</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      It's recommended to add the Case Number to the report name for better record keeping and organization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Report Name</label>
                
                {isEditingName ? (
                  <form onSubmit={handleNameSubmit} className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200"
                        placeholder="e.g., Case-12345-log-analysis-report"
                        autoFocus
                      />
                      <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 px-2">.pdf</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-sm font-medium transition-colors duration-200"
                      >
                        Save Name
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingName(false);
                          setReportName('log-analysis-report'); // Reset to default if cancelled
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 transition-colors duration-200">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {reportName || 'log-analysis-report'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">.pdf</span>
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 text-sm font-medium"
                      title="Edit report name"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Name</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center transition-colors duration-200">
                <div className="font-semibold text-gray-900 dark:text-white">{summary.totalEntries.toLocaleString()}</div>
                <div className="text-gray-600 dark:text-gray-300">Total Entries</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center transition-colors duration-200">
                <div className="font-semibold text-red-700 dark:text-red-300">{summary.errorCount.toLocaleString()}</div>
                <div className="text-red-600 dark:text-red-400">Errors</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center transition-colors duration-200">
                <div className="font-semibold text-yellow-700 dark:text-yellow-300">{summary.warningCount.toLocaleString()}</div>
                <div className="text-yellow-600 dark:text-yellow-400">Warnings</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center transition-colors duration-200">
                <div className="font-semibold text-blue-700 dark:text-blue-300">{summary.infoCount.toLocaleString()}</div>
                <div className="text-blue-600 dark:text-blue-400">Info</div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 transition-colors duration-200">
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
            )}
          </div>

          <div className="ml-6">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !logs.length || !reportName.trim()}
              className={getButtonClass()}
            >
              {getButtonContent()}
            </button>
          </div>
        </div>

        {/* Report Contents Preview */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Report will include:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
              <span>Executive Summary & Statistics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
              <span>Log Level Distribution Charts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
              <span>Timeline Analysis & Trends</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
              <span>Critical Errors & Top Issues</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 dark:bg-yellow-400 rounded-full"></div>
              <span>Actionable Recommendations</span>
            </div>
            {addedContent.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full"></div>
                <span>Additional Details ({addedContent.length} section{addedContent.length !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assistant Integration Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 transition-colors duration-200">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Enhance Report with Assistant</h4>
            <p className="text-blue-800 dark:text-blue-400 mb-4">
              Want to add custom analysis, specific insights, or recommendations to the report? 
              Use the assistant in the bottom right corner!
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700 transition-colors duration-200">
              <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Example Assistant Requests:</h5>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• "Add a section analyzing error patterns by time of day"</li>
                <li>• "Create recommendations for system optimization"</li>
                <li>• "Analyze the correlation between errors and warnings"</li>
                <li>• "Add insights about the most critical issues"</li>
                <li>• "Include a summary of system health trends"</li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors duration-200">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                <strong>How it works:</strong> Ask the assistant to generate additional content, then click the 
                "Add to Report\" button that appears. The content will be automatically included in the PDF report 
                in a dedicated "Additional Details\" section.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Added Content Display */}
      {addedContent.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Content Added to Report</h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">{addedContent.length} section{addedContent.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="space-y-4">
            {addedContent.map((item, index) => (
              <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 transition-colors duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Section {index + 1}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Added {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveContent(item.id)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    title="Remove from report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 transition-colors duration-200">
                  {item.content.length > 200 
                    ? `${item.content.substring(0, 200)}...` 
                    : item.content
                  }
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg transition-colors duration-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-800 dark:text-green-300">
                This content will be included in the "Additional Details" section of the PDF report.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}