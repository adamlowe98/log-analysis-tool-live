import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl.startsWith('https://');

let supabase: ReturnType<typeof createClient> | null = null;

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

export interface AnalysisSession {
  id: string;
  created_at: string;
  user_id?: string;
  filename: string;
  total_entries: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  debug_count: number;
}

export async function saveAnalysisSession(data: Omit<AnalysisSession, 'id' | 'created_at'>) {
  if (!supabase) {
    console.warn('Supabase not configured. Analysis session not saved.');
    return null;
  }

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
}

export async function getRecentAnalysisSessions(limit = 10) {
  if (!supabase) {
    console.warn('Supabase not configured. Returning empty sessions.');
    return [];
  }

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
}