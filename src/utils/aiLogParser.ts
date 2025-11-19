import { GoogleGenerativeAI } from '@google/generative-ai';
import { LogEntry, LogSummary } from '../types/log';

export async function parseLogFileWithAI(content: string, apiKey: string): Promise<{ entries: LogEntry[], summary: LogSummary }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `You are a universal log file parser for Bentley Systems. Analyze this log file and extract structured data.

CRITICAL INSTRUCTIONS:
1. Parse ALL log entries from the file
2. Extract these fields for each entry (use null if not present):
   - timestamp: ISO format date-time string (YYYY-MM-DDTHH:mm:ss.sssZ) or null
   - threadId: Thread/Process ID if present, or null
   - level: One of: ERROR, WARN, INFO, DEBUG, TRACE, or null
   - message: The actual log message (cleaned up, without timestamp/level/thread)

3. Generate comprehensive statistics:
   - Total entry count
   - Count by level (ERROR, WARN, INFO, DEBUG)
   - List of critical errors (up to 10 most severe)
   - Top 5 most frequent error patterns with counts
   - Time range (earliest and latest timestamps)

4. Return ONLY valid JSON in this exact format:
{
  "entries": [
    {
      "timestamp": "2025-01-15T10:30:00.000Z",
      "threadId": "12345",
      "level": "ERROR",
      "message": "Connection timeout to database"
    }
  ],
  "statistics": {
    "totalEntries": 1000,
    "errorCount": 45,
    "warningCount": 120,
    "infoCount": 800,
    "debugCount": 35,
    "criticalErrors": [
      {"message": "Fatal error description", "timestamp": "2025-01-15T10:30:00.000Z"}
    ],
    "topErrors": [
      {"message": "Error pattern", "count": 15}
    ],
    "timeRange": {
      "start": "2025-01-15T10:00:00.000Z",
      "end": "2025-01-15T12:00:00.000Z"
    }
  }
}

LOG FILE CONTENT:
${content}

Return ONLY the JSON object, no markdown, no explanations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const entries: LogEntry[] = parsed.entries.map((entry: any, index: number) => ({
      id: `log-${index}`,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : null,
      threadId: entry.threadId || undefined,
      level: entry.level || 'INFO',
      message: entry.message || '',
      raw: '',
    }));

    const summary: LogSummary = {
      totalEntries: parsed.statistics.totalEntries || entries.length,
      errorCount: parsed.statistics.errorCount || 0,
      warningCount: parsed.statistics.warningCount || 0,
      infoCount: parsed.statistics.infoCount || 0,
      debugCount: parsed.statistics.debugCount || 0,
      criticalErrors: (parsed.statistics.criticalErrors || []).map((err: any, idx: number) => ({
        id: `critical-${idx}`,
        timestamp: err.timestamp ? new Date(err.timestamp) : null,
        level: 'ERROR' as const,
        message: err.message || '',
        raw: '',
      })),
      topErrors: parsed.statistics.topErrors || [],
      timeRange: {
        start: parsed.statistics.timeRange?.start ? new Date(parsed.statistics.timeRange.start) : new Date(),
        end: parsed.statistics.timeRange?.end ? new Date(parsed.statistics.timeRange.end) : new Date(),
      },
    };

    return { entries, summary };
  } catch (error) {
    console.error('AI parsing error:', error);
    throw new Error(`Failed to parse log file with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
