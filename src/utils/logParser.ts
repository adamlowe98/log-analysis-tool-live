import { LogEntry, LogSummary } from '../types/log';

export function parseLogFile(content: string): LogEntry[] {
  const lines = content.split('\n').filter(line => line.trim());
  const entries: LogEntry[] = [];

  lines.forEach((line, index) => {
    const entry = parseLogLine(line, index);
    if (entry) {
      entries.push(entry);
    }
  });

  // Sort entries by timestamp (newest first for display)
  entries.sort((a, b) => {
    // Handle null timestamps - put them at the end
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return entries;
}

function parseLogLine(line: string, index: number): LogEntry | null {
  if (!line.trim()) return null;

  let timestamp: Date | null = null;
  let level = 'INFO';
  let message = line;
  let source = '';

  // CRITICAL: Only parse timestamps that actually exist in the log line
  // Do NOT create fallback timestamps

  // Method 1: Everything before first comma (your main format)
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

  // Extract error codes/sources from square brackets in the remaining message
  const bracketMatches = message.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    for (const match of bracketMatches) {
      const content = match.slice(1, -1); // Remove brackets
      
      // Check if this looks like an error code (hex, alphanumeric, etc.)
      if (!isLogLevel(content) && 
          !content.match(/^\d{4}-\d{2}-\d{2}/) && // Not a date
          !content.match(/^\d{2}-\d{2}/) && // Not MM-dd format
          !content.match(/^\d{2}:\d{2}:\d{2}/) && // Not time format
          content.length > 0) {
        source = content;
        break; // Use the first valid error code found
      }
    }
  }

  // Detect log level from the message
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

  // Clean up the message
  let cleanMessage = message;

  // Remove the error code brackets if they were extracted as source
  if (source) {
    cleanMessage = cleanMessage.replace(new RegExp(`\\[${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), '').trim();
  }

  // Remove level indicators from message
  cleanMessage = cleanMessage.replace(/\[(ERROR|WARN|WARNING|INFO|DEBUG|TRACE|FATAL|CRITICAL)\]/gi, '').trim();
  cleanMessage = cleanMessage.replace(/\b(ERROR|WARN|WARNING|INFO|DEBUG|TRACE|FATAL|CRITICAL):\s*/gi, '').trim();

  return {
    id: `log-${index}`,
    timestamp, // This can be null now
    level: level as LogEntry['level'],
    message: cleanMessage || message,
    source: source || undefined,
    raw: line,
  };
}

function parseTimestampStrict(str: string): Date | null {
  if (!str || typeof str !== 'string') return null;
  
  const trimmed = str.trim();
  if (!trimmed) return null;

  // ONLY parse specific formats that we know exist in log files
  // DO NOT create fallback dates with current year/date

  // Format 1: YYYY-MM-DD HH:mm:ss (your main format)
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
      return date;
    }
  }

  // Format 2: MM-DD HH:mm:ss - ONLY if we can determine the year from context
  // For now, skip this format to avoid year assumptions
  
  // Format 3: ISO format
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

function detectLevelFromMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
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
  
  if (lowerMessage.includes('warn') || 
      lowerMessage.includes('warning') ||
      lowerMessage.includes('deprecated') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('retry')) {
    return 'WARN';
  }
  
  if (lowerMessage.includes('debug') || 
      lowerMessage.includes('trace') ||
      lowerMessage.includes('verbose')) {
    return 'DEBUG';
  }
  
  return 'INFO';
}

function isLogLevel(str: string): boolean {
  if (!str) return false;
  const normalized = str.toUpperCase().trim();
  return ['ERROR', 'ERR', 'WARN', 'WARNING', 'INFO', 'DEBUG', 'TRACE', 'FATAL', 'CRITICAL'].includes(normalized);
}

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

export function generateLogSummary(entries: LogEntry[]): LogSummary {
  const errorCount = entries.filter(e => e.level === 'ERROR').length;
  const warningCount = entries.filter(e => e.level === 'WARN').length;
  const infoCount = entries.filter(e => e.level === 'INFO').length;
  const debugCount = entries.filter(e => e.level === 'DEBUG').length;

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
    .slice(0, 10);

  // Count error message frequencies
  const errorMessages = entries
    .filter(e => e.level === 'ERROR')
    .reduce((acc, entry) => {
      let key = entry.message
        .replace(/\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d{3})?/g, '')
        .replace(/\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g, '')
        .replace(/\[[^\]]+\]/g, '')
        .replace(/\b\d+\b/g, 'N')
        .substring(0, 80)
        .trim();
      
      if (key.length < 10) key = entry.message.substring(0, 80);
      
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topErrors = Object.entries(errorMessages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([message, count]) => ({ message, count }));

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

  const timeRange = validTimestamps.length > 0 ? {
    start: new Date(Math.min(...validTimestamps.map(t => t.getTime()))),
    end: new Date(Math.max(...validTimestamps.map(t => t.getTime()))),
  } : { 
    // If no valid timestamps found, use placeholder range
    start: new Date('2025-01-01'), 
    end: new Date('2025-01-01') 
  };

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