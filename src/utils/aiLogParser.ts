import { GoogleGenerativeAI } from '@google/generative-ai';
import { LogEntry, LogSummary } from '../types/log';

async function parseJSONSafely(text: string): Promise<any> {
  let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const jsonMatch = jsonText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }

  jsonText = jsonMatch[0];

  const braceCount = (jsonText.match(/\{/g) || []).length;
  const closeBraceCount = (jsonText.match(/\}/g) || []).length;
  if (braceCount > closeBraceCount) {
    jsonText += '}'.repeat(braceCount - closeBraceCount);
  }

  const bracketCount = (jsonText.match(/\[/g) || []).length;
  const closeBracketCount = (jsonText.match(/\]/g) || []).length;
  if (bracketCount > closeBracketCount) {
    jsonText += ']'.repeat(bracketCount - closeBracketCount);
  }

  jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(jsonText);
  } catch (parseError) {
    jsonText = jsonText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    return JSON.parse(jsonText);
  }
}

export async function parseLogFileWithAI(content: string, apiKey: string): Promise<{ entries: LogEntry[], summary: LogSummary }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  console.log('Starting chunked AI log parsing...');

  const lines = content.split('\n').filter(line => line.trim());
  const chunkSize = 50;
  const allEntries: LogEntry[] = [];

  const totalChunks = Math.ceil(lines.length / chunkSize);
  console.log(`Processing ${lines.length} lines in ${totalChunks} chunks...`);

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, Math.min(i + chunkSize, lines.length));
    const chunkNumber = Math.floor(i / chunkSize) + 1;

    const chunkPrompt = `Parse these ${chunk.length} log lines. Extract timestamp, threadId, level (ERROR/WARN/INFO/DEBUG), and message for each line.

Return ONLY a JSON array with this format:
[
  {"timestamp": "2025-01-15T10:30:00.000Z", "threadId": "12345", "level": "ERROR", "message": "error text"},
  {"timestamp": null, "threadId": null, "level": "INFO", "message": "info text"}
]

Use null for missing fields. No markdown, no explanations.

LINES:
${chunk.join('\n')}`;

    try {
      const result = await model.generateContent(chunkPrompt);
      const response = await result.response;
      const text = response.text();

      const parsed = await parseJSONSafely(text);
      const chunkEntries = Array.isArray(parsed) ? parsed : [parsed];

      chunkEntries.forEach((entry: any, idx: number) => {
        allEntries.push({
          id: `log-${i + idx}`,
          timestamp: entry.timestamp ? new Date(entry.timestamp) : null,
          threadId: entry.threadId || undefined,
          level: entry.level || 'INFO',
          message: entry.message || chunk[idx] || '',
          raw: chunk[idx] || '',
        });
      });

      console.log(`Processed chunk ${chunkNumber}/${totalChunks}`);

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error processing chunk ${chunkNumber}:`, error);
      chunk.forEach((line, idx) => {
        allEntries.push({
          id: `log-${i + idx}`,
          timestamp: null,
          threadId: undefined,
          level: 'INFO',
          message: line,
          raw: line,
        });
      });
    }
  }

  console.log('Generating summary statistics...');

  const errorCount = allEntries.filter(e => e.level === 'ERROR').length;
  const warningCount = allEntries.filter(e => e.level === 'WARN').length;
  const infoCount = allEntries.filter(e => e.level === 'INFO').length;
  const debugCount = allEntries.filter(e => e.level === 'DEBUG').length;

  const criticalErrors = allEntries
    .filter(e => e.level === 'ERROR')
    .slice(0, 10);

  const errorMessages = allEntries
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

  const validTimestamps = allEntries
    .map(e => e.timestamp)
    .filter((t): t is Date => t !== null && !isNaN(t.getTime()));

  const timeRange = validTimestamps.length > 0 ? {
    start: new Date(Math.min(...validTimestamps.map(t => t.getTime()))),
    end: new Date(Math.max(...validTimestamps.map(t => t.getTime()))),
  } : {
    start: new Date(),
    end: new Date()
  };

  const summary: LogSummary = {
    totalEntries: allEntries.length,
    errorCount,
    warningCount,
    infoCount,
    debugCount,
    criticalErrors,
    topErrors,
    timeRange,
  };

  console.log(`Parsing complete: ${allEntries.length} entries processed`);

  return { entries: allEntries, summary };
}
