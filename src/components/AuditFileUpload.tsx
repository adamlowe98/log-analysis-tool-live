import React, { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle, Info, ExternalLink, FileSpreadsheet } from 'lucide-react';

/**
 * Props interface for the AuditFileUpload component
 */
interface AuditFileUploadProps {
  onFileUpload: (content: string, filename: string) => void;
}

/**
 * AuditFileUpload Component
 * 
 * Handles CSV audit trail file upload functionality with drag-and-drop support.
 * Specifically designed for ProjectWise audit trail CSV files.
 * 
 * Features:
 * - Drag and drop CSV file upload
 * - File type validation (CSV files only)
 * - File size validation (50MB limit)
 * - CSV parsing and validation
 * - Handles single-column CSV data (all data in column A)
 * - Visual feedback during upload process
 * - Error handling with user-friendly messages
 * 
 * Security considerations:
 * - All file processing happens client-side
 * - No files are uploaded to servers
 * - Content is processed in browser memory only
 */
export function AuditFileUpload({ onFileUpload }: AuditFileUploadProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FILE PROCESSING LOGIC
  // ============================================================================
  
  const handleFile = useCallback(async (file: File) => {
    // File type validation - accept CSV files and text files
    const isValidType = file.type.includes('csv') || 
                       file.name.endsWith('.csv') ||
                       file.type.includes('text/csv') ||
                       file.type.includes('application/csv') ||
                       file.type.includes('text/plain') ||
                       file.name.endsWith('.txt');

    if (!isValidType) {
      setError('Please upload a CSV file (.csv format) or text file (.txt)');
      return;
    }

    // File size validation - 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Read file content as text
      const content = await file.text();
      
      // Basic content validation
      if (!content.trim()) {
        setError('The file appears to be empty');
        return;
      }
      
      // Check if it has multiple lines (basic structure check)
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setError('The file must contain at least a header row and one data row');
        return;
      }
      
      // More flexible validation - accept files even if they don't have commas
      // This handles the case where all data is in column A
      console.log(`Processing ${file.name} with ${lines.length} lines`);
      console.log('First few lines:', lines.slice(0, 3));
      
      onFileUpload(content, file.name);
    } catch (err) {
      console.error('File reading error:', err);
      setError('Failed to read the file. Please ensure it\'s a valid text or CSV file.');
    } finally {
      setUploading(false);
    }
  }, [onFileUpload]);

  // ============================================================================
  // DRAG AND DROP EVENT HANDLERS
  // ============================================================================
  
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

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      
      {/* ========================================================================
          AUDIT TRAIL INFORMATION NOTICE
          ======================================================================== */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-200">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg flex-shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
              ProjectWise Audit Trail Analysis
            </h4>
            <p className="text-blue-800 dark:text-blue-400 mb-3">
              Upload your ProjectWise audit trail CSV file to investigate missing files, unauthorized access, 
              and track document lifecycle events. The tool will categorize events and highlight key activities 
              that may indicate security concerns or data loss.
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700 transition-colors duration-200">
              <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Key Investigation Areas:</h5>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• <strong>Deletion Events:</strong> Document/folder deletions and purge operations</li>
                <li>• <strong>Movement Events:</strong> File relocations, exports, and transfers</li>
                <li>• <strong>Check-in/Check-out:</strong> Document locking and version control activities</li>
                <li>• <strong>Replacement Events:</strong> File overwrites and version replacements</li>
                <li>• <strong>User Activity:</strong> Tracking who performed which actions when</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================
          CSV FILE UPLOAD DROP ZONE
          ======================================================================== */}
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
        {/* Hidden file input for click-to-upload functionality */}
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        {/* Upload interface content */}
        <div className="flex flex-col items-center space-y-4">
          {/* Upload icon or loading spinner */}
          {uploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          ) : (
            <div className="relative">
              <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400 absolute -bottom-1 -right-1" />
            </div>
          )}
          
          {/* Upload instructions and file format information */}
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {uploading ? 'Processing audit trail file...' : 'Upload Audit Trail CSV'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Drag and drop your ProjectWise audit trail CSV file here, or click to browse
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supports .csv and .txt files up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================
          ERROR DISPLAY
          ======================================================================== */}
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

      {/* ========================================================================
          CSV FORMAT REQUIREMENTS
          ======================================================================== */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors duration-200">
        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Supported File Formats:</h5>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>CSV files:</strong> Standard comma-separated values format</li>
          <li>• <strong>Single-column CSV:</strong> All data in column A (automatically detected)</li>
          <li>• <strong>Text files:</strong> Plain text audit trail exports</li>
          <li>• <strong>Mixed formats:</strong> Tool will attempt to parse any structured audit data</li>
        </ul>
        
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg transition-colors duration-200">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 dark:text-green-300 font-medium">Flexible Format Support</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                The tool automatically detects and handles various CSV formats, including files where all data 
                is contained in a single column. No need to reformat your audit trail exports!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}