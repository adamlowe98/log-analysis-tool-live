import { LogEntry, LogSummary } from '../types/log';

/**
 * Log Parser Utilities
 * 
 * This module handles the core log file parsing and analysis functionality.
 * It converts raw log file content into structured data that can be analyzed
 * and visualized throughout the application.
 * 
 * Key Features:
 * - Multi-format log parsing (various timestamp formats, log levels)
 * - Robust timestamp extraction and validation
 * - Log level detection and normalization
 * - Error pattern analysis and categorization
 * - Statistical summary generation
 * 
 * Security Note: All processing happens client-side in the browser.
 * No log content is ever transmitted to external services.
 */

/**
 * Main log file parsing function
 * 
 * Takes raw log file content and converts it into an array of structured
 * LogEntry objects. Handles various log formats and provides fallback
 * parsing for unrecognized formats.
 * 
 * @param content - Raw text content of the log file
 * @returns Array of parsed LogEntry objects
 */
export function parseLogFile(content: string): LogEntry[] {
  // Split content into individual lines and filter out empty lines
  const lines = content.split('\n').filter(line => line.trim());
  const entries: LogEntry[] = [];

  // Process each line individually
  lines.forEach((line, index) => {
    const entry = parseLogLine(line, index);
    if (entry) {
      entries.push(entry);
    }
  });

  // Sort entries by timestamp (newest first for display)
  // This provides a consistent ordering regardless of input file order
  entries.sort((a, b) => {
    // Handle null timestamps - put them at the end
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return entries;
}

/**
 * Parse individual log line into structured LogEntry
 * 
 * This is the core parsing logic that extracts:
 * - Timestamps (various formats)
 * - Log levels (ERROR, WARN, INFO, DEBUG, etc.)
 * - Source/component information
 * - Log messages
 * 
 * @param line - Single line from log file
 * @param index - Line index for unique ID generation
 * @returns Parsed LogEntry object or null if line is invalid
 */
function parseLogLine(line: string, index: number): LogEntry | null {
  if (!line.trim()) return null;

  let timestamp: Date | null = null;
  let level = 'INFO';
  let message = line;
  let source = '';
  let threadId: string | undefined = undefined;

  // ============================================================================
  // TIMESTAMP EXTRACTION
  // ============================================================================
  
  // CRITICAL: Only parse timestamps that actually exist in the log line
  // Do NOT create fallback timestamps to avoid misleading analysis

  // Method 1: Everything before first comma (common format)
  const commaIndex = line.indexOf(',');
  if (commaIndex !== -1) {
    const timestampPart = line.substring(0, commaIndex).trim();
    const remainingPart = line.substring(commaIndex + 1).trim();
    
    const parsedDate = parseTimestampStrict(timestampPart);
    if (parsedDate) {
      timestamp = parsedDate;
      message = remainingPart;
    }
  }

  // Method 2: If no comma or comma parsing failed, try other patterns
  if (!timestamp) {
    const timestampPatterns = [
      // YYYY-MM-DD HH:mm:ss at start
      /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?)\s+(.*)$/,
      // MM-DD HH:mm:ss at start (with current year)
      /^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.*)$/,
      // ISO timestamp
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s+(.*)$/,
      // Bracketed timestamp
      /^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?)\]\s+(.*)$/,
    ];

    for (const pattern of timestampPatterns) {
      const match = line.match(pattern);
      if (match) {
        const parsedDate = parseTimestampStrict(match[1]);
        if (parsedDate) {
          timestamp = parsedDate;
          message = match[2] || '';
          break;
        }
      }
    }
  }

  // If we still don't have a valid timestamp, leave it as null
  // DO NOT use current date/time or placeholder dates
  if (!timestamp) {
    console.warn(`No valid timestamp found in log line: ${line.substring(0, 50)}...`);
    // timestamp remains null - this will be handled in display components
  }

  // ============================================================================
  // THREAD ID EXTRACTION
  // ============================================================================

  // Try to extract thread ID from common patterns
  const threadPatterns = [
    /\[(\d+)\]/,  // [12345]
    /thread[:\s]+(\d+)/i,  // thread: 12345 or thread 12345
    /tid[:\s]+(\d+)/i,  // tid: 12345
    /\((\d+)\)/,  // (12345)
  ];

  for (const pattern of threadPatterns) {
    const match = message.match(pattern);
    if (match && match[1] && match[1].length >= 3) {
      threadId = match[1];
      break;
    }
  }

  // ============================================================================
  // SOURCE/ERROR CODE EXTRACTION
  // ============================================================================

  // Extract error codes/sources from square brackets in the message
  const bracketMatches = message.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    for (const match of bracketMatches) {
      const content = match.slice(1, -1); // Remove brackets

      // Check if this looks like an error code (hex, alphanumeric, etc.)
      // Exclude log levels, timestamp formats, and thread IDs
      if (!isLogLevel(content) &&
          !content.match(/^\d{4}-\d{2}-\d{2}/) && // Not a date
          !content.match(/^\d{2}-\d{2}/) && // Not MM-dd format
          !content.match(/^\d{2}:\d{2}:\d{2}/) && // Not time format
          !content.match(/^\d+$/) && // Not just numbers (likely thread ID)
          content.length > 0) {
        source = content;
        break; // Use the first valid error code found
      }
    }
  }

  // ============================================================================
  // LOG LEVEL DETECTION
  // ============================================================================
  
  // Detect log level from the message using various patterns
  const levelPatterns = [
    // Level in brackets: [ERROR] Message
    /\[(\w+)\]/,
    // Level followed by colon: ERROR: Message
    /\b(\w+):\s/,
    // Level as standalone word: DEBUG, ERROR, INFO, etc.
    /\b(ERROR|WARN|WARNING|INFO|DEBUG|TRACE|FATAL|CRITICAL)\b/i,
  ];

  let matched = false;
  for (const pattern of levelPatterns) {
    const match = message.match(pattern);
    if (match && isLogLevel(match[1])) {
      matched = true;
      level = normalizeLogLevel(match[1]);
      break;
    }
  }

  // If no explicit level found, try to detect from content
  if (!matched) {
    level = detectLevelFromMessage(message);
  }

  // ============================================================================
  // MESSAGE CLEANUP
  // ============================================================================
  
  // Clean up the message by removing extracted components
  let cleanMessage = message;

  // Remove the error code brackets if they were extracted as source
  if (source) {
    cleanMessage = cleanMessage.replace(new RegExp(`\\[${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), '').trim();
  }

  // Remove level indicators from message
  cleanMessage = cleanMessage.replace(/\[(ERROR|WARN|WARNING|INFO|DEBUG|TRACE|FATAL|CRITICAL)\]/gi, '').trim();
  cleanMessage = cleanMessage.replace(/\b(ERROR|WARN|WARNING|INFO|DEBUG|TRACE|FATAL|CRITICAL):\s*/gi, '').trim();

  // ============================================================================
  // RETURN STRUCTURED LOG ENTRY
  // ============================================================================
  
  return {
    id: `log-${index}`,
    timestamp, // This can be null now
    threadId,
    level: level as LogEntry['level'],
    message: cleanMessage || message,
    source: source || undefined,
    raw: line,
  };
}

/**
 * Strict timestamp parsing function
 * 
 * Only parses specific timestamp formats that are known to exist in log files.
 * Does NOT create fallback dates to avoid misleading analysis.
 * 
 * @param str - Timestamp string to parse
 * @returns Parsed Date object or null if invalid
 */
function parseTimestampStrict(str: string): Date | null {
  if (!str || typeof str !== 'string') return null;
  
  const trimmed = str.trim();
  if (!trimmed) return null;

  // ONLY parse specific formats that we know exist in log files
  // DO NOT create fallback dates with current year/date

  // Format 1: YYYY-MM-DD HH:mm:ss (most common format)
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
      return date;
    }
  }

  // Format 2: MM-DD HH:mm:ss - ONLY if we can determine the year from context
  // For now, skip this format to avoid year assumptions
  
  // Format 3: ISO format (2025-01-15T10:30:00Z)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
      return date;
    }
  }

  // If none of the strict patterns match, return null
  // DO NOT attempt to parse with new Date() as it might create current dates
  return null;
}

/**
 * Detect log level from message content
 * 
 * Uses keyword analysis to infer log level when not explicitly stated.
 * Looks for common error/warning/debug keywords in the message.
 * 
 * @param message - Log message content
 * @returns Inferred log level
 */
function detectLevelFromMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Error-indicating keywords
  if (lowerMessage.includes('error') || 
      lowerMessage.includes('exception') || 
      lowerMessage.includes('fail') ||
      lowerMessage.includes('fatal') ||
      lowerMessage.includes('critical') ||
      lowerMessage.includes('panic') ||
      lowerMessage.includes('abort') ||
      lowerMessage.includes('crash')) {
    return 'ERROR';
  }
  
  // Warning-indicating keywords
  if (lowerMessage.includes('warn') || 
      lowerMessage.includes('warning') ||
      lowerMessage.includes('deprecated') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('retry')) {
    return 'WARN';
  }
  
  // Debug-indicating keywords
  if (lowerMessage.includes('debug') || 
      lowerMessage.includes('trace') ||
      lowerMessage.includes('verbose')) {
    return 'DEBUG';
  }
  
  // Default to INFO level
  return 'INFO';
}

/**
 * Check if a string represents a valid log level
 * 
 * @param str - String to check
 * @returns True if string is a recognized log level
 */
function isLogLevel(str: string): boolean {
  if (!str) return false;
  const normalized = str.toUpperCase().trim();
  return ['ERROR', 'ERR', 'WARN', 'WARNING', 'INFO', 'DEBUG', 'TRACE', 'FATAL', 'CRITICAL'].includes(normalized);
}

/**
 * Normalize log level to standard format
 * 
 * Converts various log level representations to standardized values.
 * 
 * @param level - Raw log level string
 * @returns Normalized log level
 */
function normalizeLogLevel(level: string): string {
  if (!level) return 'INFO';
  
  const normalized = level.toUpperCase().trim();
  switch (normalized) {
    case 'ERR':
    case 'FATAL':
    case 'CRITICAL':
      return 'ERROR';
    case 'WARNING':
      return 'WARN';
    default:
      return ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'].includes(normalized) ? normalized : 'INFO';
  }
}

/**
 * Generate comprehensive log analysis summary
 * 
 * Creates statistical analysis and insights from parsed log entries.
 * Includes error counts, critical issue identification, time range analysis,
 * and pattern detection for the most common errors.
 * 
 * @param entries - Array of parsed log entries
 * @returns Comprehensive LogSummary object
 */
export function generateLogSummary(entries: LogEntry[]): LogSummary {
  // ============================================================================
  // BASIC STATISTICS CALCULATION
  // ============================================================================
  
  const errorCount = entries.filter(e => e.level === 'ERROR').length;
  const warningCount = entries.filter(e => e.level === 'WARN').length;
  const infoCount = entries.filter(e => e.level === 'INFO').length;
  const debugCount = entries.filter(e => e.level === 'DEBUG').length;

  // ============================================================================
  // CRITICAL ERROR IDENTIFICATION
  // ============================================================================
  
  // Identify critical errors based on level and content keywords
  const criticalErrors = entries
    .filter(e => e.level === 'ERROR' || (
      e.message.toLowerCase().includes('critical') ||
      e.message.toLowerCase().includes('fatal') ||
      e.message.toLowerCase().includes('exception') ||
      e.message.toLowerCase().includes('null pointer') ||
      e.message.toLowerCase().includes('out of memory') ||
      e.message.toLowerCase().includes('stack trace') ||
      e.message.toLowerCase().includes('traceback') ||
      e.message.toLowerCase().includes('panic') ||
      e.message.toLowerCase().includes('abort')
    ))
    .slice(0, 10); // Limit to top 10 for performance

  // ============================================================================
  // ERROR PATTERN ANALYSIS
  // ============================================================================
  
  // Count error message frequencies to identify patterns
  const errorMessages = entries
    .filter(e => e.level === 'ERROR')
    .reduce((acc, entry) => {
      // Normalize error messages by removing timestamps and numbers
      let key = entry.message
        .replace(/\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d{3})?/g, '') // Remove timestamps
        .replace(/\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g, '') // Remove MM-DD timestamps
        .replace(/\[[^\]]+\]/g, '') // Remove bracketed content
        .replace(/\b\d+\b/g, 'N') // Replace numbers with 'N'
        .substring(0, 80) // Limit length
        .trim();
      
      // Fallback to original message if normalized version is too short
      if (key.length < 10) key = entry.message.substring(0, 80);
      
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Get top 5 most frequent error patterns
  const topErrors = Object.entries(errorMessages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([message, count]) => ({ message, count }));

  // ============================================================================
  // TIME RANGE ANALYSIS
  // ============================================================================
  
  // CRITICAL: Only use timestamps that are actually valid
  // Filter out null timestamps and invalid dates
  const validTimestamps = entries
    .map(e => e.timestamp)
    .filter((t): t is Date => 
      t !== null && 
      !isNaN(t.getTime()) && 
      t.getFullYear() > 2020 && 
      t.getFullYear() < 2030 &&
      t.getTime() > new Date('2020-01-01').getTime()
    );

  // Calculate time range from valid timestamps
  const timeRange = validTimestamps.length > 0 ? {
    start: new Date(Math.min(...validTimestamps.map(t => t.getTime()))),
    end: new Date(Math.max(...validTimestamps.map(t => t.getTime()))),
  } : { 
    // If no valid timestamps found, use placeholder range
    start: new Date('2025-01-01'), 
    end: new Date('2025-01-01') 
  };

  // ============================================================================
  // RETURN COMPREHENSIVE SUMMARY
  // ============================================================================
  
  return {
    totalEntries: entries.length,
    errorCount,
    warningCount,
    infoCount,
    debugCount,
    criticalErrors,
    topErrors,
    timeRange,
  };
}