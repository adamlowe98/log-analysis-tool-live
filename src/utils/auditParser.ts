import { AuditEntry, AuditSummary, AuditCategory, CategorizedAuditEntries } from '../types/audit';

/**
 * Audit Trail Parser Utilities
 * 
 * This module handles the parsing and analysis of ProjectWise audit trail CSV files.
 * It converts raw CSV content into structured data for investigation and analysis.
 * 
 * Key Features:
 * - Simple CSV parsing that preserves original column structure
 * - Direct mapping of ProjectWise audit trail columns
 * - Action categorization for investigation
 * - Statistical analysis and summary generation
 * 
 * Security Note: All processing happens client-side in the browser.
 * No audit data is ever transmitted to external services.
 */

/**
 * Main audit trail CSV parsing function
 * 
 * Takes raw CSV content and converts it into an array of structured
 * AuditEntry objects that preserve the original CSV structure.
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
  
  console.log('Detected CSV headers:', headers);
  
  // Create column mapping based on detected headers
  const columnMap = createColumnMapping(headers);
  console.log('Column mapping:', columnMap);
  
  const entries: AuditEntry[] = [];

  // Process each data row
  dataRows.forEach((line, index) => {
    const entry = parseAuditRow(line, headers, columnMap, index);
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

  console.log(`Successfully parsed ${entries.length} audit entries from CSV`);
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
 * Create column mapping based on detected headers
 * 
 * Maps the actual CSV headers to our internal field structure
 * 
 * @param headers - Array of header names from CSV
 * @returns Object mapping field names to column indices
 */
function createColumnMapping(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();
    
    // Map standard ProjectWise audit trail columns
    if (normalizedHeader.includes('object type')) {
      map.objectType = index;
    } else if (normalizedHeader.includes('object name')) {
      map.objectName = index;
    } else if (normalizedHeader.includes('action name')) {
      map.actionName = index;
    } else if (normalizedHeader.includes('date') && normalizedHeader.includes('time')) {
      map.dateTime = index;
    } else if (normalizedHeader.includes('user name')) {
      map.userName = index;
    } else if (normalizedHeader.includes('object description')) {
      map.objectDescription = index;
    } else if (normalizedHeader.includes('additional data')) {
      map.additionalData = index;
    } else if (normalizedHeader.includes('comments')) {
      map.comments = index;
    } else if (normalizedHeader.includes('path')) {
      map.path = index;
    } else if (normalizedHeader.includes('user description')) {
      map.userDescription = index;
    }
  });
  
  return map;
}

/**
 * Parse individual audit row into structured AuditEntry
 * 
 * @param row - CSV row string
 * @param headers - Original headers for reference
 * @param columnMap - Mapping of field names to column indices
 * @param index - Row index for unique ID generation
 * @returns Parsed AuditEntry object or null if invalid
 */
function parseAuditRow(
  row: string, 
  headers: string[], 
  columnMap: Record<string, number>, 
  index: number
): AuditEntry | null {
  if (!row.trim()) return null;
  
  const values = parseCSVRow(row);
  
  // Ensure we have enough values
  if (values.length === 0) return null;
  
  // Extract values using column mapping with safe fallbacks
  const objectType = values[columnMap.objectType] || '';
  const objectName = values[columnMap.objectName] || '';
  const actionName = values[columnMap.actionName] || 'Unknown';
  const dateTimeStr = values[columnMap.dateTime] || '';
  const userName = values[columnMap.userName] || 'Unknown';
  const objectDescription = values[columnMap.objectDescription] || '';
  const additionalData = values[columnMap.additionalData] || '';
  const comments = values[columnMap.comments] || '';
  const path = values[columnMap.path] || '';
  const userDescription = values[columnMap.userDescription] || '';
  
  // Parse timestamp
  const timestamp = parseAuditTimestamp(dateTimeStr);
  
  // Combine details from multiple sources
  const detailParts = [objectDescription, additionalData, comments, userDescription]
    .filter(part => part && part.trim())
    .join(' | ');
  
  return {
    id: `audit-${index}`,
    timestamp,
    action: actionName.trim(),
    user: userName.trim(),
    document: objectName.trim(),
    folder: path.trim(),
    details: detailParts.trim(),
    application: objectType.trim() || undefined,
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

  // Try parsing the timestamp directly
  const date = new Date(trimmed);
  if (!isNaN(date.getTime()) && date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
    return date;
  }

  // Try common formats if direct parsing fails
  const formats = [
    // MM/DD/YYYY HH:mm:ss AM/PM
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?$/i,
    // YYYY-MM-DD HH:mm:ss
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
    // DD/MM/YYYY HH:mm:ss
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
  ];

  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) {
      try {
        const testDate = new Date(trimmed);
        if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 2020 && testDate.getFullYear() <= 2030) {
          return testDate;
        }
      } catch (e) {
        // Continue to next format
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