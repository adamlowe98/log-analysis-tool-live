/**
 * Type Definitions for Log Analysis
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the log analysis application. These types ensure type safety and provide
 * clear contracts for data structures used across components.
 */

/**
 * Individual Log Entry Interface
 * 
 * Represents a single parsed log entry with all extracted information.
 * This is the core data structure for individual log lines.
 * 
 * @interface LogEntry
 */
export interface LogEntry {
  /** Unique identifier for the log entry */
  id: string;
  
  /** 
   * Timestamp of the log entry
   * Can be null if no valid timestamp was found in the log line
   * This prevents creation of misleading placeholder timestamps
   */
  timestamp: Date | null;
  
  /** 
   * Log level/severity
   * Standardized to these specific values for consistent analysis
   */
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
  
  /** 
   * Main log message content
   * Cleaned of timestamps, levels, and source information
   */
  message: string;
  
  /** 
   * Source component or error code (optional)
   * Extracted from bracketed content like [ComponentName] or [ErrorCode]
   */
  source?: string;
  
  /** 
   * Original raw log line
   * Preserved for reference and debugging purposes
   */
  raw: string;
}

/**
 * Log Analysis Summary Interface
 * 
 * Contains aggregated statistics and insights from log analysis.
 * This provides the high-level overview used throughout the UI.
 * 
 * @interface LogSummary
 */
export interface LogSummary {
  /** Total number of log entries processed */
  totalEntries: number;
  
  /** Count of ERROR level entries */
  errorCount: number;
  
  /** Count of WARN level entries */
  warningCount: number;
  
  /** Count of INFO level entries */
  infoCount: number;
  
  /** Count of DEBUG level entries */
  debugCount: number;
  
  /** 
   * Array of critical errors requiring immediate attention
   * Includes both ERROR level entries and entries with critical keywords
   */
  criticalErrors: LogEntry[];
  
  /** 
   * Most frequently occurring error patterns
   * Helps identify systemic issues and recurring problems
   */
  topErrors: { message: string; count: number }[];
  
  /** 
   * Time range covered by the log analysis
   * Based on valid timestamps found in the log entries
   */
  timeRange: { start: Date; end: Date };
}

/**
 * Chart Data Interface
 * 
 * Structure for chart.js compatible data used in visualizations.
 * Provides consistent format for all charts throughout the application.
 * 
 * @interface ChartData
 */
export interface ChartData {
  /** Chart labels (x-axis values, legend items, etc.) */
  labels: string[];
  
  /** 
   * Chart datasets containing the actual data and styling
   * Each dataset represents a different data series
   */
  datasets: {
    /** Dataset label for legend */
    label: string;
    
    /** Data points corresponding to the labels */
    data: number[];
    
    /** Background color for the dataset */
    backgroundColor: string;
    
    /** Border color for the dataset */
    borderColor: string;
    
    /** Whether to fill the area under line charts (optional) */
    fill?: boolean;
  }[];
}