import { LogEntry, LogSummary } from '../types/log';

/**
 * Hybrid Log Parser - Fast JavaScript with OpenAI Enhancement
 *
 * This parser uses JavaScript for speed and structure, but leverages OpenAI
 * to intelligently extract thread IDs and other fields that vary by format.
 */

interface AIExtractionResult {
  timestamp?: string;
  threadId?: string;
  level: string;
  message: string;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a log file analysis expert. Respond only with valid JSON, no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Parse log file using hybrid approach:
 * 1. Split into lines quickly with JavaScript
 * 2. Use OpenAI to intelligently extract thread IDs and categorize each line
 * 3. Build structured entries
 */
export async function parseLogFileHybrid(
  content: string,
  apiKey: string
): Promise<{ entries: LogEntry[]; summary: LogSummary }> {
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('No content found in log file');
  }

  console.log(`Processing ${lines.length} log lines with OpenAI enhancement...`);

  // Sample first 50 lines to understand the format
  const sampleLines = lines.slice(0, Math.min(50, lines.length));
  const sampleText = sampleLines.join('\n');

  const formatPrompt = `Analyze these log file lines and identify the format pattern:

${sampleText}

Respond with ONLY a JSON object (no markdown, no code blocks) containing:
{
  "threadIdPattern": "description of where thread IDs appear",
  "timestampFormat": "format of timestamps",
  "levelPosition": "where log level appears",
  "example": "one example line parsed"
}`;

  const formatAnalysis = await callOpenAI(apiKey, formatPrompt);
  console.log('OpenAI Format Analysis:', formatAnalysis);

  // Now process all lines in batches
  const batchSize = 100;
  const entries: LogEntry[] = [];

  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, Math.min(i + batchSize, lines.length));
    const batchText = batch.map((line, idx) => `${i + idx}: ${line}`).join('\n');

    const extractPrompt = `Given this log format pattern:
${formatAnalysis}

Extract structured data from these log lines. For EACH line, identify:
- timestamp (exact text, or null if not present)
- threadId (CRITICAL: extract any thread/process ID you find - look in brackets, parentheses, or after keywords)
- level (ERROR, WARN, INFO, DEBUG, or infer from context)
- message (the actual log message)

Log lines:
${batchText}

Respond with ONLY a JSON array (no markdown, no code blocks) where each object has: timestamp, threadId, level, message
If a field is not present, use null. IMPORTANT: Look carefully for thread IDs in any format.`;

    try {
      const responseText = await callOpenAI(apiKey, extractPrompt);

      // Clean up response - remove markdown if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const extracted = JSON.parse(jsonText) as AIExtractionResult[];

      // Convert AI extractions to LogEntry objects
      extracted.forEach((item, idx) => {
        const lineIndex = i + idx;
        const rawLine = batch[idx] || lines[lineIndex];

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

  // Find critical errors
  const criticalErrors = entries.filter(e =>
    e.level === 'ERROR' ||
    e.message.toLowerCase().includes('critical') ||
    e.message.toLowerCase().includes('fatal')
  ).slice(0, 10);

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

  // Count error patterns
  const errorMessages = entries
    .filter(e => e.level === 'ERROR')
    .map(e => e.message.substring(0, 100));

  const errorCounts = errorMessages.reduce((acc, msg) => {
    acc[msg] = (acc[msg] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topErrors = Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([message, count]) => ({ message, count }));

  // Find unique thread IDs
  const uniqueThreads = new Set(entries.filter(e => e.threadId).map(e => e.threadId));

  return {
    totalEntries: entries.length,
    errorCount,
    warningCount,
    infoCount,
    debugCount,
    criticalErrors,
    topErrors,
    timeRange,
    uniqueThreadCount: uniqueThreads.size,
    errorTrend: [],
  };
}
