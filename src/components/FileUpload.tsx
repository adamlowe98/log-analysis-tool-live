import React, { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle, Info, ExternalLink } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (content: string, filename: string) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    // Check file type - accept text files, log files, and JSON files
    const isValidType = file.type.includes('text') || 
                       file.type.includes('json') || 
                       file.name.endsWith('.log') || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.json') ||
                       file.name.endsWith('.out');

    if (!isValidType) {
      setError('Please upload a text, log, or JSON file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const content = await file.text();
      
      // If it's a JSON file, try to parse and format it for log analysis
      if (file.name.endsWith('.json') || file.type.includes('json')) {
        try {
          const jsonData = JSON.parse(content);
          const formattedContent = formatJsonForLogAnalysis(jsonData, file.name);
          onFileUpload(formattedContent, file.name);
        } catch (jsonError) {
          // If JSON parsing fails, treat it as regular text
          console.warn('JSON parsing failed, treating as text:', jsonError);
          onFileUpload(content, file.name);
        }
      } else {
        // Regular text/log file
        onFileUpload(content, file.name);
      }
    } catch (err) {
      setError('Failed to read file');
    } finally {
      setUploading(false);
    }
  }, [onFileUpload]);

  // Helper function to format JSON data for log analysis
  const formatJsonForLogAnalysis = (jsonData: any, filename: string): string => {
    const lines: string[] = [];
    
    // Handle different JSON structures
    if (Array.isArray(jsonData)) {
      // Array of log entries
      jsonData.forEach((entry, index) => {
        const logLine = formatJsonEntry(entry, index);
        if (logLine) lines.push(logLine);
      });
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      // Single object or object with nested structure
      if (jsonData.logs && Array.isArray(jsonData.logs)) {
        // Object with logs array
        jsonData.logs.forEach((entry: any, index: number) => {
          const logLine = formatJsonEntry(entry, index);
          if (logLine) lines.push(logLine);
        });
      } else if (jsonData.entries && Array.isArray(jsonData.entries)) {
        // Object with entries array
        jsonData.entries.forEach((entry: any, index: number) => {
          const logLine = formatJsonEntry(entry, index);
          if (logLine) lines.push(logLine);
        });
      } else {
        // Single log entry object
        const logLine = formatJsonEntry(jsonData, 0);
        if (logLine) lines.push(logLine);
      }
    }
    
    // If no structured format found, convert to string representation
    if (lines.length === 0) {
      lines.push(`JSON Content from ${filename}: ${JSON.stringify(jsonData, null, 2)}`);
    }
    
    return lines.join('\n');
  };

  // Helper function to format individual JSON entries
  const formatJsonEntry = (entry: any, index: number): string | null => {
    if (typeof entry !== 'object' || entry === null) {
      return `Entry ${index + 1}: ${String(entry)}`;
    }

    // Try to extract common log fields
    const timestamp = entry.timestamp || entry.time || entry.date || entry['@timestamp'] || '';
    const level = entry.level || entry.severity || entry.priority || 'INFO';
    const message = entry.message || entry.msg || entry.text || entry.description || '';
    const source = entry.source || entry.component || entry.service || entry.logger || '';
    
    // Build log line in a standard format
    const parts: string[] = [];
    
    if (timestamp) {
      parts.push(timestamp);
    }
    
    if (level) {
      parts.push(`[${level.toString().toUpperCase()}]`);
    }
    
    if (source) {
      parts.push(`[${source}]`);
    }
    
    if (message) {
      parts.push(message.toString());
    } else {
      // If no message field, stringify the entire object
      parts.push(JSON.stringify(entry));
    }
    
    return parts.join(' ');
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Log Elevation Notice */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-200">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg flex-shrink-0">
            <Info className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Maximize Analysis Quality
            </h4>
            <p className="text-blue-800 dark:text-blue-400 mb-3">
              For the most comprehensive analysis results, consider elevating the log file to capture more detailed information before uploading.
            </p>
            <a
              href="https://bentleysystems.service-now.com/community?id=kb_article_view&sysparm_article=KB0019935"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
            >
              <span>View Log Elevation Guide</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".log,.txt,.out,.json"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          ) : (
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {uploading ? 'Processing file...' : 'Upload log file'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Drag and drop the log file here, or click to browse
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supports .log, .txt, .out, .json files up to 50MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 transition-colors duration-200">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}