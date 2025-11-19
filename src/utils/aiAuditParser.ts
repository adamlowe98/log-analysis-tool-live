import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuditEntry, AuditSummary } from '../types/audit';

export async function parseAuditTrailWithAI(content: string, apiKey: string): Promise<{ entries: AuditEntry[], summary: AuditSummary }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `You are a universal audit trail parser for Bentley Systems. Analyze this audit trail/CSV file and extract structured data.

CRITICAL INSTRUCTIONS:
1. Parse ALL entries from the file
2. Extract these fields for each entry (use null if not present):
   - timestamp: ISO format date-time string (YYYY-MM-DDTHH:mm:ss.sssZ) or null
   - user: Username or user ID who performed the action
   - action: The action type (e.g., "File Deleted", "File Modified", "User Login", etc.)
   - resource: The resource affected (e.g., file name, system component)
   - details: Additional details about the action

3. Categorize entries into these event types:
   - file_missing: Files that are missing or cannot be found
   - file_deleted: Files that were explicitly deleted
   - file_operations: General file operations (create, modify, move, copy)
   - security_events: Authentication, authorization, access control events
   - system_events: System-level operations and events
   - other: Anything that doesn't fit above categories

4. Generate comprehensive statistics:
   - Total entry count
   - Count by category
   - Most active users (top 5)
   - Most affected resources (top 5)
   - Time range (earliest and latest timestamps)

5. Return ONLY valid JSON in this exact format:
{
  "entries": [
    {
      "timestamp": "2025-01-15T10:30:00.000Z",
      "user": "john.doe",
      "action": "File Deleted",
      "resource": "document.pdf",
      "details": "Permanently deleted from system",
      "category": "file_deleted"
    }
  ],
  "statistics": {
    "totalEntries": 1000,
    "fileMissingCount": 45,
    "fileDeletedCount": 120,
    "fileOperationsCount": 600,
    "securityEventsCount": 200,
    "systemEventsCount": 35,
    "mostActiveUsers": [
      {"user": "john.doe", "count": 150}
    ],
    "mostAffectedResources": [
      {"resource": "document.pdf", "count": 25}
    ],
    "timeRange": {
      "start": "2025-01-15T10:00:00.000Z",
      "end": "2025-01-15T12:00:00.000Z"
    }
  }
}

AUDIT TRAIL CONTENT:
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

    const entries: AuditEntry[] = parsed.entries.map((entry: any, index: number) => ({
      id: `audit-${index}`,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : null,
      user: entry.user || 'Unknown',
      action: entry.action || 'Unknown Action',
      resource: entry.resource || '',
      details: entry.details || '',
      category: entry.category || 'other',
    }));

    const summary: AuditSummary = {
      totalEntries: parsed.statistics.totalEntries || entries.length,
      fileMissingCount: parsed.statistics.fileMissingCount || 0,
      fileDeletedCount: parsed.statistics.fileDeletedCount || 0,
      fileOperationsCount: parsed.statistics.fileOperationsCount || 0,
      securityEventsCount: parsed.statistics.securityEventsCount || 0,
      systemEventsCount: parsed.statistics.systemEventsCount || 0,
      mostActiveUsers: parsed.statistics.mostActiveUsers || [],
      mostAffectedResources: parsed.statistics.mostAffectedResources || [],
      timeRange: {
        start: parsed.statistics.timeRange?.start ? new Date(parsed.statistics.timeRange.start) : new Date(),
        end: parsed.statistics.timeRange?.end ? new Date(parsed.statistics.timeRange.end) : new Date(),
      },
    };

    return { entries, summary };
  } catch (error) {
    console.error('AI parsing error:', error);
    throw new Error(`Failed to parse audit trail with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
