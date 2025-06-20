import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Database Integration
 * 
 * This module handles all database operations for the log analysis tool.
 * It provides a secure, privacy-focused approach where only analysis metadata
 * is stored - never the actual log content.
 * 
 * Privacy Features:
 * - Only stores aggregated statistics and metadata
 * - No actual log content is ever transmitted or stored
 * - Session tracking for usage analytics only
 * - Graceful degradation when database is unavailable
 */

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Check if Supabase environment variables are properly configured
 * Validates that URLs are properly formatted and keys are not placeholder values
 */
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl.startsWith('https://');

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

let supabase: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Supabase client with error handling
 * Only creates client if environment is properly configured
 */
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn('Supabase is not configured. Please set up your environment variables.');
}

export { supabase };

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Analysis Session Interface
 * 
 * Represents metadata about a log analysis session stored in the database.
 * IMPORTANT: This contains only metadata - no actual log content.
 */
export interface AnalysisSession {
  /** Unique session identifier */
  id: string;
  
  /** Session creation timestamp */
  created_at: string;
  
  /** Optional user identifier for future authentication features */
  user_id?: string;
  
  /** Original filename (for reference only) */
  filename: string;
  
  /** Total number of log entries analyzed */
  total_entries: number;
  
  /** Count of error-level entries found */
  error_count: number;
  
  /** Count of warning-level entries found */
  warning_count: number;
  
  /** Count of info-level entries found */
  info_count: number;
  
  /** Count of debug-level entries found */
  debug_count: number;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save analysis session metadata to database
 * 
 * Stores only aggregated statistics and metadata about the analysis session.
 * This enables usage tracking and analytics without compromising privacy.
 * 
 * @param data - Analysis session data (excluding id and created_at)
 * @returns Promise resolving to the saved session or null if failed
 */
export async function saveAnalysisSession(data: Omit<AnalysisSession, 'id' | 'created_at'>) {
  // Graceful degradation - return null if Supabase not configured
  if (!supabase) {
    console.warn('Supabase not configured. Analysis session not saved.');
    return null;
  }

  try {
    const { data: session, error } = await supabase
      .from('analysis_sessions')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error saving analysis session:', error);
      throw error;
    }

    return session;
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
}

/**
 * Retrieve recent analysis sessions
 * 
 * Fetches recent analysis sessions for usage analytics and history tracking.
 * Used for understanding tool usage patterns and system performance.
 * 
 * @param limit - Maximum number of sessions to retrieve (default: 10)
 * @returns Promise resolving to array of recent sessions
 */
export async function getRecentAnalysisSessions(limit = 10) {
  // Graceful degradation - return empty array if Supabase not configured
  if (!supabase) {
    console.warn('Supabase not configured. Returning empty sessions.');
    return [];
  }

  try {
    const { data: sessions, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching analysis sessions:', error);
      throw error;
    }

    return sessions || [];
  } catch (error) {
    console.error('Database query failed:', error);
    throw error;
  }
}