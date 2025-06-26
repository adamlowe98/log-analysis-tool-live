import { AuditEntry, AuditSummary, AuditCategory, CategorizedAuditEntries } from '../types/audit';

/**
 * Audit Trail Parser Utilities
 * 
 * This module handles the parsing and analysis of ProjectWise audit trail CSV files.
 * It converts raw CSV content into structured data for investigation and analysis.
 * 
 * Key Features:
 * - CSV parsing with flexible column mapping
 * - Handles single-column data (all data in column A)
 * - Action categorization for investigation
 * - Key event identification
 * - Statistical analysis and summary generation
 * 
 * Security Note: All processing happens client-side in the browser.
 * No audit data is ever transmitted to external services.
 */

/**
 * Main audit trail CSV parsing function
 * 
 * Takes raw CSV content and converts it into an array of structured
 * AuditEntry objects. Handles various CSV formats including single-column data.
 * 
 * @param content - Raw CSV content of the audit trail file
 * @returns Array of parsed AuditEntry objects
 */
export function parseAuditTrailCSV(content: string): AuditEntry[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Get header row and data rows
  const headerRow = lines[0];
  const dataRows = lines.slice(1);
  
  // Parse header to identify column positions
  const headers = parseCSVRow(headerRow);
  
  // Check if this is a single-column CSV (all data in column A)
  const isSingleColumn = headers.length === 1 || 
                        (headers.length > 1 && headers.slice(1).every(h => !h.trim()));
  
  let columnMap: Record<string, number>;
  
  if (isSingleColumn) {
    console.log('Detected single-column CSV format - attempting to parse structured data from single column');
    columnMap = createSingleColumnMap();
  } else {
    console.log('Detected multi-column CSV format');
    columnMap = mapColumns(headers.map(h => h.toLowerCase().trim()));
  }
  
  const entries: AuditEntry[] = [];

  // Process each data row
  dataRows.forEach((line, index) => {
    const entry = isSingleColumn 
      ? parseSingleColumnAuditRow(line, index)
      : parseAuditRow(line, columnMap, index);
    
    if (entry) {
      entries.push(entry);
    }
  });

  // Sort entries by timestamp (newest first)
  entries.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  console.log(`Parsed ${entries.length} audit entries from ${isSingleColumn ? 'single-column' : 'multi-column'} CSV`);
  return entries;
}

/**
 * Parse individual CSV row into array of values
 * 
 * Handles quoted values and comma separation properly.
 * 
 * @param row - CSV row string
 * @returns Array of parsed values
 */
function parseCSVRow(row: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values.map(v => v.replace(/^"|"$/g, '')); // Remove surrounding quotes
}

/**
 * Create a dummy column map for single-column parsing
 */
function createSingleColumnMap(): Record<string, number> {
  return {
    timestamp: 0,
    action: 0,
    user: 0,
    document: 0,
    folder: 0,
    details: 0,
  };
}

/**
 * Parse single-column audit row where all data is in one column
 * 
 * Attempts to extract structured information from a single text field
 * that contains all the audit information.
 * 
 * @param row - Single column row string
 * @param index - Row index for unique ID generation
 * @returns Parsed AuditEntry object or null if invalid
 */
function parseSingleColumnAuditRow(row: string, index: number): AuditEntry | null {
  if (!row.trim()) return null;
  
  // Remove quotes if the entire row is quoted
  let cleanRow = row.trim();
  if (cleanRow.startsWith('"') && cleanRow.endsWith('"')) {
    cleanRow = cleanRow.slice(1, -1);
  }
  
  // Initialize default values
  let timestamp: Date | null = null;
  let action = 'Unknown';
  let user = 'Unknown';
  let document = '';
  let folder = '';
  let details = cleanRow; // Use full row as details by default
  let application = '';
  
  // Try to extract timestamp from the beginning of the row
  const timestampPatterns = [
    // YYYY-MM-DD HH:mm:ss format
    /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/,
    // MM/DD/YYYY HH:mm:ss format
    /^(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}(?:\s*[AP]M)?)/i,
    // DD/MM/YYYY HH:mm:ss format
    /^(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2})/,
    // ISO format
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/,
  ];
  
  let remainingText = cleanRow;
  
  for (const pattern of timestampPatterns) {
    const match = cleanRow.match(pattern);
    if (match) {
      const parsedDate = parseAuditTimestamp(match[1]);
      if (parsedDate) {
        timestamp = parsedDate;
        remainingText = cleanRow.substring(match[0].length).trim();
        break;
      }
    }
  }
  
  // Try to extract common audit trail patterns from the remaining text
  if (remainingText) {
    // Look for action patterns
    const actionPatterns = [
      /\b(deleted?|removed?|purged?)\b/i,
      /\b(moved?|relocated?|transferred?)\b/i,
      /\b(exported?|sent to folder)\b/i,
      /\b(checked out|checked in|freed)\b/i,
      /\b(replaced?|overwrote?|updated?)\b/i,
      /\b(created?|added?|new)\b/i,
      /\b(modified?|changed?|edited?)\b/i,
      /\b(copied?|duplicated?)\b/i,
      /\b(accessed?|opened?|viewed?)\b/i,
    ];
    
    for (const pattern of actionPatterns) {
      const match = remainingText.match(pattern);
      if (match) {
        action = match[1];
        break;
      }
    }
    
    // Look for user patterns (common formats: "by username", "user: username", etc.)
    const userPatterns = [
      /\bby\s+([a-zA-Z0-9._-]+)/i,
      /\buser:?\s*([a-zA-Z0-9._-]+)/i,
      /\b([a-zA-Z0-9._-]+)\s+performed/i,
      /\b([a-zA-Z0-9._-]+)\s+(deleted|moved|created|modified)/i,
    ];
    
    for (const pattern of userPatterns) {
      const match = remainingText.match(pattern);
      if (match) {
        user = match[1];
        break;
      }
    }
    
    // Look for document/file patterns
    const documentPatterns = [
      /\bdocument:?\s*([^\s,;]+)/i,
      /\bfile:?\s*([^\s,;]+)/i,
      /\b([a-zA-Z0-9._-]+\.[a-zA-Z0-9]+)\b/, // filename.extension pattern
      /"([^"]+\.[a-zA-Z0-9]+)"/, // quoted filename
    ];
    
    for (const pattern of documentPatterns) {
      const match = remainingText.match(pattern);
      if (match) {
        document = match[1];
        break;
      }
    }
    
    // Look for folder/path patterns
    const folderPatterns = [
      /\bfolder:?\s*([^\s,;]+)/i,
      /\bpath:?\s*([^\s,;]+)/i,
      /\bin\s+([^\s,;]+)/i,
      /\bfrom\s+([^\s,;]+)/i,
      /\bto\s+([^\s,;]+)/i,
    ];
    
    for (const pattern of folderPatterns) {
      const match = remainingText.match(pattern);
      if (match) {
        folder = match[1];
        break;
      }
    }
    
    // Look for application patterns
    const appPatterns = [
      /\bapplication:?\s*([^\s,;]+)/i,
      /\bapp:?\s*([^\s,;]+)/i,
      /\bvia\s+([^\s,;]+)/i,
    ];
    
    for (const pattern of appPatterns) {
      const match = remainingText.match(pattern);
      if (match) {
        application = match[1];
        break;
      }
    }
  }
  
  // If we couldn't extract much, try to parse as comma-separated values within the single column
  if (action === 'Unknown' && user === 'Unknown') {
    const parts = cleanRow.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      // Try to map parts to fields based on common audit trail formats
      if (parts[0] && parseAuditTimestamp(parts[0])) {
        timestamp = parseAuditTimestamp(parts[0]);
        if (parts[1]) action = parts[1];
        if (parts[2]) user = parts[2];
        if (parts[3]) document = parts[3];
        if (parts[4]) folder = parts[4];
        if (parts[5]) details = parts[5];
      }
    }
  }
  
  return {
    id: `audit-${index}`,
    timestamp,
    action: action.trim(),
    user: user.trim(),
    document: document.trim(),
    folder: folder.trim(),
    details: details.trim(),
    application: application?.trim() || undefined,
    raw: row,
  };
}

/**
 * Map CSV headers to expected column positions
 * 
 * Creates a mapping of data fields to their column indices based on
 * common header names used in ProjectWise audit trails.
 * 
 * @param headers - Array of header names from CSV
 * @returns Object mapping field names to column indices
 */
function mapColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    // Map common header variations to standard field names
    if (header.includes('date') || header.includes('time') || header.includes('timestamp')) {
      map.timestamp = index;
    } else if (header.includes('action') || header.includes('event') || header.includes('operation')) {
      map.action = index;
    } else if (header.includes('user') || header.includes('person') || header.includes('who')) {
      map.user = index;
    } else if (header.includes('document') || header.includes('file') || header.includes('name')) {
      map.document = index;
    } else if (header.includes('folder') || header.includes('path') || header.includes('location')) {
      map.folder = index;
    } else if (header.includes('detail') || header.includes('comment') || header.includes('description')) {
      map.details = index;
    } else if (header.includes('application') || header.includes('app') || header.includes('program')) {
      map.application = index;
    }
  });
  
  return map;
}

/**
 * Parse individual audit row into structured AuditEntry
 * 
 * Extracts and validates data from a single CSV row using the column mapping.
 * 
 * @param row - CSV row string
 * @param columnMap - Mapping of field names to column indices
 * @param index - Row index for unique ID generation
 * @returns Parsed AuditEntry object or null if invalid
 */
function parseAuditRow(row: string, columnMap: Record<string, number>, index: number): AuditEntry | null {
  if (!row.trim()) return null;
  
  const values = parseCSVRow(row);
  
  // Extract values using column mapping with fallbacks
  const timestampStr = values[columnMap.timestamp] || '';
  const action = values[columnMap.action] || 'Unknown';
  const user = values[columnMap.user] || 'Unknown';
  const document = values[columnMap.document] || '';
  const folder = values[columnMap.folder] || '';
  const details = values[columnMap.details] || '';
  const application = values[columnMap.application] || undefined;
  
  // Parse timestamp
  const timestamp = parseAuditTimestamp(timestampStr);
  
  return {
    id: `audit-${index}`,
    timestamp,
    action: action.trim(),
    user: user.trim(),
    document: document.trim(),
    folder: folder.trim(),
    details: details.trim(),
    application: application?.trim(),
    raw: row,
  };
}

/**
 * Parse timestamp from audit trail entry
 * 
 * Handles various timestamp formats commonly found in audit trails.
 * 
 * @param str - Timestamp string to parse
 * @returns Parsed Date object or null if invalid
 */
function parseAuditTimestamp(str: string): Date | null {
  if (!str || typeof str !== 'string') return null;
  
  const trimmed = str.trim();
  if (!trimmed) return null;

  // Try various timestamp formats
  const formats = [
    // Standard formats
    /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?$/,
    /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}(?:\s*[AP]M)?$/i,
    /^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}$/,
    // ISO format
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/,
  ];

  for (const format of formats) {
    if (format.test(trimmed)) {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime()) && date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Categorize audit entry based on action type
 * 
 * Determines which investigation category an audit entry belongs to
 * based on the action performed.
 * 
 * @param entry - Audit entry to categorize
 * @returns Category classification
 */
export function categorizeAuditEntry(entry: AuditEntry): AuditCategory {
  const action = entry.action.toLowerCase();
  const details = entry.details.toLowerCase();
  
  // Deletion events
  if (action.includes('delete') || action.includes('purge') || action.includes('remove')) {
    return 'deletion';
  }
  
  // Movement/relocation events
  if (action.includes('move') || action.includes('export') || action.includes('copy') || 
      action.includes('sent to') || action.includes('relocat')) {
    return 'movement';
  }
  
  // Check-in/check-out events
  if (action.includes('check') || action.includes('free') || action.includes('lock')) {
    return 'checkinout';
  }
  
  // Replacement/versioning events
  if (action.includes('replace') || action.includes('version') || action.includes('overwrite')) {
    return 'replacement';
  }
  
  return 'other';
}

/**
 * Identify key events that require investigation
 * 
 * Filters audit entries to find events that are most likely to be
 * related to missing files or security concerns.
 * 
 * @param entries - Array of audit entries
 * @returns Array of key events requiring attention
 */
export function identifyKeyEvents(entries: AuditEntry[]): AuditEntry[] {
  const keyEvents: AuditEntry[] = [];
  
  entries.forEach(entry => {
    const action = entry.action.toLowerCase();
    const details = entry.details.toLowerCase();
    
    // High priority events for missing file investigation
    const isKeyEvent = 
      // Direct deletion events
      action.includes('deleted') || action.includes('document deleted') ||
      action.includes('folder deleted') || action.includes('purge') ||
      
      // Movement that could indicate relocation
      action.includes('moved') || action.includes('exported') ||
      action.includes('sent to folder') ||
      
      // Replacement events
      action.includes('replaced file') || action.includes('replaced') ||
      
      // Check-out without check-in (potential data loss)
      (action.includes('checked out') && !details.includes('checked in')) ||
      
      // Freed documents (potential data inconsistency)
      action.includes('freed') ||
      
      // Version-related events that might indicate data loss
      action.includes('version deleted') || action.includes('version') ||
      
      // Any action with concerning keywords in details
      details.includes('error') || details.includes('failed') ||
      details.includes('corrupt') || details.includes('missing');
    
    if (isKeyEvent) {
      keyEvents.push(entry);
    }
  });
  
  return keyEvents.slice(0, 50); // Limit to top 50 for performance
}

/**
 * Categorize all audit entries into investigation categories
 * 
 * Groups audit entries by their category for organized investigation.
 * 
 * @param entries - Array of audit entries
 * @returns Object with entries categorized by type
 */
export function categorizeAllEntries(entries: AuditEntry[]): CategorizedAuditEntries {
  const categorized: CategorizedAuditEntries = {
    deletion: [],
    movement: [],
    checkinout: [],
    replacement: [],
    other: [],
  };
  
  entries.forEach(entry => {
    const category = categorizeAuditEntry(entry);
    categorized[category].push(entry);
  });
  
  return categorized;
}

/**
 * Generate comprehensive audit trail analysis summary
 * 
 * Creates statistical analysis and insights from parsed audit entries.
 * 
 * @param entries - Array of parsed audit entries
 * @returns Comprehensive AuditSummary object
 */
export function generateAuditSummary(entries: AuditEntry[]): AuditSummary {
  // Categorize entries
  const categorized = categorizeAllEntries(entries);
  
  // Identify key events
  const keyEvents = identifyKeyEvents(entries);
  
  // Calculate user activity
  const userActivity = entries.reduce((acc, entry) => {
    acc[entry.user] = (acc[entry.user] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topUsers = Object.entries(userActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([user, count]) => ({ user, count }));
  
  // Calculate document activity
  const documentActivity = entries
    .filter(entry => entry.document)
    .reduce((acc, entry) => {
      acc[entry.document] = (acc[entry.document] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  const topDocuments = Object.entries(documentActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([document, count]) => ({ document, count }));
  
  // Calculate time range
  const validTimestamps = entries
    .map(e => e.timestamp)
    .filter((t): t is Date => 
      t !== null && 
      !isNaN(t.getTime()) && 
      t.getFullYear() > 2020 && 
      t.getFullYear() < 2030
    );

  const timeRange = validTimestamps.length > 0 ? {
    start: new Date(Math.min(...validTimestamps.map(t => t.getTime()))),
    end: new Date(Math.max(...validTimestamps.map(t => t.getTime()))),
  } : { 
    start: new Date('2025-01-01'), 
    end: new Date('2025-01-01') 
  };
  
  return {
    totalEntries: entries.length,
    deletionCount: categorized.deletion.length,
    movementCount: categorized.movement.length,
    checkInOutCount: categorized.checkinout.length,
    replacementCount: categorized.replacement.length,
    otherCount: categorized.other.length,
    keyEvents,
    topUsers,
    topDocuments,
    timeRange,
  };
}