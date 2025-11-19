/**
 * Type Definitions for Audit Trail Analysis
 *
 * This file contains all TypeScript interfaces and types used for
 * universal audit trail analysis functionality across Bentley Systems.
 */

/**
 * Individual Audit Trail Entry Interface
 *
 * Represents a single parsed audit trail entry with generic fields.
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
   * User who performed the action
   */
  user: string;

  /**
   * Action performed (e.g., "File Deleted", "User Login", "Permission Changed")
   */
  action: string;

  /**
   * Resource affected (file name, system component, etc.)
   */
  resource: string;

  /**
   * Additional details or context about the action
   */
  details: string;

  /**
   * Category of the audit event
   */
  category: 'file_missing' | 'file_deleted' | 'file_operations' | 'security_events' | 'system_events' | 'other';

  /**
   * Original raw data line (optional)
   */
  raw?: string;

  /** Legacy fields for backward compatibility */
  document?: string;
  folder?: string;
  application?: string;
}

/**
 * Audit Trail Analysis Summary Interface
 *
 * Contains aggregated statistics and insights from audit trail analysis.
 */
export interface AuditSummary {
  /** Total number of audit entries processed */
  totalEntries: number;

  /** Count of file missing events */
  fileMissingCount: number;

  /** Count of file deletion events */
  fileDeletedCount: number;

  /** Count of file operation events */
  fileOperationsCount: number;

  /** Count of security-related events */
  securityEventsCount: number;

  /** Count of system-level events */
  systemEventsCount: number;

  /**
   * Most active users
   */
  mostActiveUsers: { user: string; count: number }[];

  /**
   * Most affected resources
   */
  mostAffectedResources: { resource: string; count: number }[];

  /**
   * Time range covered by the audit trail
   */
  timeRange: { start: Date; end: Date };

  /** Legacy fields for backward compatibility */
  deletionCount?: number;
  movementCount?: number;
  checkInOutCount?: number;
  replacementCount?: number;
  otherCount?: number;
  keyEvents?: AuditEntry[];
  topUsers?: { user: string; count: number }[];
  topDocuments?: { document: string; count: number }[];
}

/**
 * Audit Event Categories for Investigation
 */
export type AuditCategory =
  | 'file_missing'
  | 'file_deleted'
  | 'file_operations'
  | 'security_events'
  | 'system_events'
  | 'other';

/**
 * Categorized Audit Entries
 */
export interface CategorizedAuditEntries {
  file_missing: AuditEntry[];
  file_deleted: AuditEntry[];
  file_operations: AuditEntry[];
  security_events: AuditEntry[];
  system_events: AuditEntry[];
  other: AuditEntry[];
}
