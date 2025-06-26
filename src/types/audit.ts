/**
 * Type Definitions for Audit Trail Analysis
 * 
 * This file contains all TypeScript interfaces and types used for
 * ProjectWise audit trail analysis functionality.
 */

/**
 * Individual Audit Trail Entry Interface
 * 
 * Represents a single parsed audit trail entry from CSV data.
 */
export interface AuditEntry {
  /** Unique identifier for the audit entry */
  id: string;
  
  /** 
   * Timestamp of the audit event
   * Can be null if no valid timestamp was found
   */
  timestamp: Date | null;
  
  /** 
   * Action performed (e.g., "Deleted", "Moved", "Checked Out")
   */
  action: string;
  
  /** 
   * User who performed the action
   */
  user: string;
  
  /** 
   * Document/file name affected
   */
  document: string;
  
  /** 
   * Folder/location path
   */
  folder: string;
  
  /** 
   * Additional details or comments
   */
  details: string;
  
  /** 
   * Application used (if available)
   */
  application?: string;
  
  /** 
   * Original raw CSV line
   */
  raw: string;
}

/**
 * Audit Trail Analysis Summary Interface
 * 
 * Contains aggregated statistics and insights from audit trail analysis.
 */
export interface AuditSummary {
  /** Total number of audit entries processed */
  totalEntries: number;
  
  /** Count of deletion events */
  deletionCount: number;
  
  /** Count of movement/relocation events */
  movementCount: number;
  
  /** Count of check-in/check-out events */
  checkInOutCount: number;
  
  /** Count of replacement/versioning events */
  replacementCount: number;
  
  /** Count of other events */
  otherCount: number;
  
  /** 
   * Key events requiring investigation
   */
  keyEvents: AuditEntry[];
  
  /** 
   * Most active users
   */
  topUsers: { user: string; count: number }[];
  
  /** 
   * Most affected documents
   */
  topDocuments: { document: string; count: number }[];
  
  /** 
   * Time range covered by the audit trail
   */
  timeRange: { start: Date; end: Date };
}

/**
 * Audit Event Categories for Investigation
 */
export type AuditCategory = 
  | 'deletion'
  | 'movement'
  | 'checkinout'
  | 'replacement'
  | 'other';

/**
 * Categorized Audit Entries
 */
export interface CategorizedAuditEntries {
  deletion: AuditEntry[];
  movement: AuditEntry[];
  checkinout: AuditEntry[];
  replacement: AuditEntry[];
  other: AuditEntry[];
}