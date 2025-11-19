import { LogEntry, LogSummary } from '../types/log';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Hybrid Log Parser - Fast JavaScript with AI Enhancement
 *
 * This parser uses JavaScript for speed and structure, but leverages AI
 * to intelligently extract thread IDs and other fields that vary by format.
 */

interface AIExtractionResult {
  threadId?: string;
  level: string;
  message: string;
}

/**
 * Parse log file using hybrid approach:
 * 1. Split into lines quickly with JavaScript
 * 2. Use AI to intelligently extract thread IDs and categorize each line
 * 3. Build structured entries
 */
export async function parseLogFileHybrid(
  content: string,
  apiKey: string
): Promise<{ entries: LogEntry[]; summary: LogSummary }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('No content found in log file');
  }

  console.log(`Processing ${lines.length} log lines with AI enhancement...`);

  // Sample first 50 lines to understand the format
  const sampleLines = lines.slice(0, Math.min(50, lines.length));
  const sampleText = sampleLines.join('\n');

  const formatPrompt = `Analyze these log file lines and identify the format pattern:

${sampleText}

Respond with a JSON object containing:
{
  "threadIdPattern": "description of where thread IDs appear (e.g., 'in square brackets after timestamp', 'not present', 'in parentheses')",
  "timestampFormat": "format of timestamps (e.g., 'YYYY-MM-DD HH:mm:ss', 'MM-DD HH:mm:ss')",
  "levelPosition": "where log level appears (e.g., 'after timestamp', 'in brackets', 'at start of message')",
  "example": "one example line parsed showing: timestamp, threadId, level, message"
}`;

  const formatResult = await model.generateContent(formatPrompt);
  const formatAnalysis = formatResult.response.text();

  console.log('AI Format Analysis:', formatAnalysis);

  // Now process all lines in batches using the understood format
  const batchSize = 100;
  const entries: LogEntry[] = [];

  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, Math.min(i + batchSize, lines.length));
    const batchText = batch.join('\n');

    const extractPrompt = `Given this log format pattern:
${formatAnalysis}

Extract structured data from these log lines. For each line, identify:
- timestamp (exact text)
- threadId (if present, extract it - this is CRITICAL)
- level (ERROR, WARN, INFO, DEBUG, or infer from context)
- message (the actual log message)

Log lines:
${batchText}

Respond with a JSON array where each object has: timestamp, threadId, level, message
If a field is not present, use null. Keep messages concise but complete.
IMPORTANT: Look carefully for thread IDs - they might be in brackets, parentheses, or after keywords like "Thread", "TID", etc.`;

    try {
      const result = await model.generateContent(extractPrompt);
      const responseText = result.response.text();

      // Extract JSON from markdown code blocks if present
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        const codeMatch = responseText.match(/```\n([\s\S]*?)\n```/);
        if (codeMatch) {
          jsonText = codeMatch[1];
        }
      }

      const extracted = JSON.parse(jsonText) as AIExtractionResult[];

      // Convert AI extractions to LogEntry objects
      extracted.forEach((item, idx) => {
        const lineIndex = i + idx;
        const rawLine = batch[idx];

        entries.push({
          id: `log-${lineIndex}`,
          timestamp: item.timestamp ? parseTimestamp(item.timestamp) : null,
          threadId: item.threadId || undefined,
          level: normalizeLevel(item.level),
          message: item.message || rawLine,
          source: undefined,
          raw: rawLine,
        });
      });

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(lines.length / batchSize)}`);
    } catch (error) {
      console.error(`Error processing batch at line ${i}:`, error);

      // Fallback: add lines as-is
      batch.forEach((line, idx) => {
        entries.push({
          id: `log-${i + idx}`,
          timestamp: null,
          threadId: undefined,
          level: 'INFO',
          message: line,
          source: undefined,
          raw: line,
        });
      });
    }
  }

  // Generate summary
  const summary = generateLogSummary(entries);

  return { entries, summary };
}

/**
 * Parse timestamp from extracted text
 */
function parseTimestamp(str: string): Date | null {
  if (!str) return null;

  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Continue to other methods
  }

  // Try common formats
  const formats = [
    // YYYY-MM-DD HH:mm:ss
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
    // MM-DD HH:mm:ss (assume current year)
    /^(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
  ];

  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      try {
        const testDate = new Date(str);
        if (!isNaN(testDate.getTime())) {
          return testDate;
        }
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

/**
 * Normalize log level from AI output
 */
function normalizeLevel(level: string): LogEntry['level'] {
  const normalized = level.toUpperCase();

  if (normalized.includes('ERROR') || normalized.includes('ERR') || normalized.includes('FATAL')) {
    return 'ERROR';
  }
  if (normalized.includes('WARN') || normalized.includes('WARNING')) {
    return 'WARN';
  }
  if (normalized.includes('INFO')) {
    return 'INFO';
  }
  if (normalized.includes('DEBUG') || normalized.includes('TRACE')) {
    return 'DEBUG';
  }

  return 'INFO';
}

/**
 * Generate summary statistics from parsed log entries
 */
function generateLogSummary(entries: LogEntry[]): LogSummary {
  const errorCount = entries.filter(e => e.level === 'ERROR').length;
  const warningCount = entries.filter(e => e.level === 'WARN').length;
  const infoCount = entries.filter(e => e.level === 'INFO').length;
  const debugCount = entries.filter(e => e.level === 'DEBUG').length;

  // Find time range
  const validTimestamps = entries
    .map(e => e.timestamp)
    .filter((t): t is Date => t !== null && !isNaN(t.getTime()));

  const timeRange = validTimestamps.length > 0 ? {
    start: new Date(Math.min(...validTimestamps.map(t => t.getTime()))),
    end: new Date(Math.max(...validTimestamps.map(t => t.getTime()))),
  } : {
    start: new Date(),
    end: new Date()
  };

  // Find unique thread IDs
  const uniqueThreads = new Set(entries.filter(e => e.threadId).map(e => e.threadId));

  return {
    totalEntries: entries.length,
    errorCount,
    warningCount,
    infoCount,
    debugCount,
    timeRange,
    topErrors: [],
    errorTrend: [],
    uniqueThreadCount: uniqueThreads.size,
  };
}
