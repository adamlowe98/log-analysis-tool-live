import { AuditEntry, AuditSummary, AuditCategory, CategorizedAuditEntries } from '../types/audit';

/**
 * Audit Trail Parser Utilities
 * 
 * This module handles the parsing and analysis of ProjectWise audit trail CSV files.
 * It converts raw CSV content into structured data for investigation and analysis.
 * 
 * Key Features:
 * - Robust parsing that handles space-separated and tab-separated data
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
  console.log('🔄 Starting audit trail CSV parsing...');
  
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    console.error('❌ No lines found in CSV content');
    return [];
  }

  console.log(`📊 Found ${lines.length} lines in CSV`);
  console.log('📋 First line (header):', lines[0]);
  if (lines.length > 1) {
    console.log('📋 Second line (first data):', lines[1]);
  }

  // Get header row and data rows
  const headerRow = lines[0];
  const dataRows = lines.slice(1);
  
  // Parse header to identify column positions
  const headers = parseAuditCSVRow(headerRow);
  console.log('🏷️ Parsed headers:', headers);
  
  // Expected headers for ProjectWise audit trail
  const expectedHeaders = [
    'Object Type', 'Object Name', 'Action Name', 'Date/Time', 'User Name',
    'Object Description', 'Additional Data', 'Comments', 'Path', 'User Description'
  ];
  
  console.log('🔍 Expected headers:', expectedHeaders);
  
  const entries: AuditEntry[] = [];

  // Process each data row
  dataRows.forEach((line, index) => {
    if (line.trim()) {
      const entry = parseAuditDataRow(line, headers, index);
      if (entry) {
        entries.push(entry);
      }
    }
  });

  // Sort entries by timestamp (newest first)
  entries.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  console.log(`✅ Successfully parsed ${entries.length} audit entries from CSV`);
  
  // Log first few entries for debugging
  if (entries.length > 0) {
    console.log('📝 First parsed entry:', entries[0]);
    console.log('📝 Second parsed entry:', entries[1]);
  }
  
  return entries;
}

/**
 * Parse individual CSV row into array of values
 * 
 * This handles the specific format where data might be tab-separated or space-separated
 * rather than comma-separated. It's designed for ProjectWise audit trail format.
 * 
 * @param row - CSV row string
 * @returns Array of parsed values
 */
function parseAuditCSVRow(row: string): string[] {
  // First try tab-separated
  if (row.includes('\t')) {
    console.log('📊 Detected tab-separated format');
    return row.split('\t').map(v => v.trim());
  }
  
  // Then try comma-separated
  if (row.includes(',')) {
    console.log('📊 Detected comma-separated format');
    return parseCSVWithQuotes(row);
  }
  
  // For space-separated data (like your example), we need to be smarter
  // Split by multiple spaces or tabs, but preserve single spaces within values
  console.log('📊 Detected space-separated format');
  
  // Split by multiple consecutive whitespace characters
  const parts = row.split(/\s{2,}|\t/).map(v => v.trim()).filter(v => v);
  
  // If we don't get enough parts, try a different approach
  if (parts.length < 5) {
    // Try splitting by single spaces but be more careful
    const spaceParts = row.trim().split(/\s+/);
    console.log('📊 Space-split parts:', spaceParts);
    return spaceParts;
  }
  
  return parts;
}

/**
 * Parse CSV with proper quote handling
 */
function parseCSVWithQuotes(row: string): string[] {
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
 * Parse individual audit data row into structured AuditEntry
 * 
 * This function handles the specific ProjectWise audit trail format where
 * data is arranged in the following columns:
 * Object Type | Object Name | Action Name | Date/Time | User Name | Object Description | Additional Data | Comments | Path | User Description
 * 
 * @param row - Data row string
 * @param headers - Headers from the CSV file
 * @param index - Row index for unique ID generation
 * @returns Parsed AuditEntry object or null if invalid
 */
function parseAuditDataRow(row: string, headers: string[], index: number): AuditEntry | null {
  if (!row.trim()) return null;
  
  console.log(`🔍 Parsing row ${index}:`, row);
  
  // For the specific format you provided, let's parse it more intelligently
  // Example: "Document	Q64157-106075-ZZ-W1-M3-AA-CI0001	Freed	6/3/2025 3:54:15 PM	Calum.Kay@aecom.com	Cwm Taf Dan Y Castell 3D Surface LiDAR			/60650514-Cwm Taf WTW/900-Work/911 WP [Q64157]/Civil Engineer/CAD (Civil 3D)	Kay"
  
  let values: string[];
  
  // Try tab-separated first
  if (row.includes('\t')) {
    values = row.split('\t').map(v => v.trim());
  } else {
    // For space-separated data, we need to be very careful
    // Let's use a regex to split on the expected pattern
    
    // Look for the date/time pattern to help us split correctly
    const dateTimePattern = /(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)/i;
    const dateMatch = row.match(dateTimePattern);
    
    if (dateMatch) {
      const dateTime = dateMatch[1];
      const beforeDate = row.substring(0, row.indexOf(dateTime)).trim();
      let afterDate = row.substring(row.indexOf(dateTime) + dateTime.length).trim();
      
      // Split the before-date part more carefully
      const beforeParts = beforeDate.split(/\s+/);
      
      // The first part should be Object Type (Document)
      const objectType = beforeParts[0] || '';
      
      // Find where Action Name likely starts by looking for common actions
      const commonActions = ['Freed', 'Deleted', 'Moved', 'Checked Out', 'Checked In', 'Created', 'Modified', 'Exported', 'Copied'];
      let actionIndex = -1;
      let actionName = '';
      
      for (let i = beforeParts.length - 1; i >= 0; i--) {
        if (commonActions.some(action => action.toLowerCase() === beforeParts[i].toLowerCase())) {
          actionIndex = i;
          actionName = beforeParts[i];
          break;
        }
      }
      
      // Object Name is everything between Object Type and Action Name
      let objectName = '';
      if (actionIndex > 1) {
        objectName = beforeParts.slice(1, actionIndex).join(' ');
      } else if (actionIndex === -1 && beforeParts.length > 1) {
        // If no action found in beforeParts, object name is everything except first part
        objectName = beforeParts.slice(1).join(' ');
        // Action might be the first part of afterDate
        const afterParts = afterDate.split(/\s+/);
        if (afterParts.length > 0) {
          actionName = afterParts[0];
          afterDate = afterParts.slice(1).join(' ');
        }
      }
      
      // Split the after-date part
      const afterParts = afterDate.split(/\s+/);
      const userName = afterParts[0] || '';
      
      // The rest is more complex - let's try to identify the path (starts with /)
      let pathIndex = -1;
      for (let i = 0; i < afterParts.length; i++) {
        if (afterParts[i].startsWith('/')) {
          pathIndex = i;
          break;
        }
      }
      
      let objectDescription = '';
      let path = '';
      let userDescription = '';
      
      if (pathIndex > 1) {
        objectDescription = afterParts.slice(1, pathIndex).join(' ');
        // Path might span multiple parts until we hit the last part (user description)
        const pathParts = afterParts.slice(pathIndex);
        if (pathParts.length > 1) {
          path = pathParts.slice(0, -1).join(' ');
          userDescription = pathParts[pathParts.length - 1];
        } else {
          path = pathParts[0];
        }
      } else if (pathIndex === 1) {
        // Path starts immediately after username
        const pathParts = afterParts.slice(1);
        if (pathParts.length > 1) {
          path = pathParts.slice(0, -1).join(' ');
          userDescription = pathParts[pathParts.length - 1];
        } else {
          path = pathParts[0];
        }
      } else {
        // No path found, everything after username might be description
        objectDescription = afterParts.slice(1).join(' ');
      }
      
      values = [
        objectType,           // Object Type
        objectName,           // Object Name  
        actionName,           // Action Name
        dateTime,             // Date/Time
        userName,             // User Name
        objectDescription,    // Object Description
        '',                   // Additional Data
        '',                   // Comments
        path,                 // Path
        userDescription       // User Description
      ];
      
    } else {
      // Fallback: split by multiple spaces
      values = row.split(/\s{2,}/).map(v => v.trim()).filter(v => v);
      
      // Ensure we have at least 10 values (pad with empty strings)
      while (values.length < 10) {
        values.push('');
      }
    }
  }
  
  console.log(`📝 Parsed values for row ${index}:`, values);
  
  // Map values to expected positions
  const objectType = values[0] || '';
  const objectName = values[1] || '';
  const actionName = values[2] || 'Unknown Action';
  const dateTimeStr = values[3] || '';
  const userName = values[4] || 'Unknown User';
  const objectDescription = values[5] || '';
  const additionalData = values[6] || '';
  const comments = values[7] || '';
  const path = values[8] || '';
  const userDescription = values[9] || '';
  
  console.log(`📝 Extracted data for row ${index}:`, {
    objectType,
    objectName,
    actionName,
    dateTimeStr,
    userName,
    objectDescription,
    additionalData,
    comments,
    path,
    userDescription
  });
  
  // Parse timestamp
  const timestamp = parseAuditTimestamp(dateTimeStr);
  
  // Combine details from multiple sources
  const detailParts = [objectDescription, additionalData, comments, userDescription]
    .filter(part => part && part.trim())
    .join(' | ');
  
  const category = categorizeAction(actionName.trim());

  const entry: AuditEntry = {
    id: `audit-${index}`,
    timestamp,
    user: userName.trim(),
    action: actionName.trim(),
    resource: objectName.trim(),
    details: detailParts.trim(),
    category,
    document: objectName.trim(),
    folder: path.trim(),
    application: objectType.trim() || undefined,
    raw: row,
  };
  
  console.log(`✅ Created entry for row ${index}:`, entry);
  
  return entry;
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
 * Categorize action based on action type
 *
 * Determines which category an action belongs to.
 *
 * @param action - Action name
 * @returns Category classification
 */
function categorizeAction(action: string): AuditCategory {
  const actionLower = action.toLowerCase();

  // Missing file events
  if (actionLower.includes('missing') || actionLower.includes('not found') || actionLower.includes('cannot find')) {
    return 'file_missing';
  }

  // Deletion events
  if (actionLower.includes('delete') || actionLower.includes('purge') || actionLower.includes('remove')) {
    return 'file_deleted';
  }

  // File operations
  if (actionLower.includes('create') || actionLower.includes('modify') || actionLower.includes('update') ||
      actionLower.includes('move') || actionLower.includes('copy') || actionLower.includes('check') ||
      actionLower.includes('free') || actionLower.includes('lock') || actionLower.includes('export')) {
    return 'file_operations';
  }

  // Security events
  if (actionLower.includes('login') || actionLower.includes('logout') || actionLower.includes('auth') ||
      actionLower.includes('permission') || actionLower.includes('access') || actionLower.includes('grant')) {
    return 'security_events';
  }

  // System events
  if (actionLower.includes('start') || actionLower.includes('stop') || actionLower.includes('restart') ||
      actionLower.includes('shutdown') || actionLower.includes('init')) {
    return 'system_events';
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
  // Count by category
  const fileMissingCount = entries.filter(e => e.category === 'file_missing').length;
  const fileDeletedCount = entries.filter(e => e.category === 'file_deleted').length;
  const fileOperationsCount = entries.filter(e => e.category === 'file_operations').length;
  const securityEventsCount = entries.filter(e => e.category === 'security_events').length;
  const systemEventsCount = entries.filter(e => e.category === 'system_events').length;

  // Calculate user activity
  const userActivity = entries.reduce((acc, entry) => {
    acc[entry.user] = (acc[entry.user] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActiveUsers = Object.entries(userActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([user, count]) => ({ user, count }));

  // Calculate resource activity
  const resourceActivity = entries
    .filter(entry => entry.resource)
    .reduce((acc, entry) => {
      acc[entry.resource] = (acc[entry.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const mostAffectedResources = Object.entries(resourceActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([resource, count]) => ({ resource, count }));

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
    fileMissingCount,
    fileDeletedCount,
    fileOperationsCount,
    securityEventsCount,
    systemEventsCount,
    mostActiveUsers,
    mostAffectedResources,
    timeRange,
  };
}