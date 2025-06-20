/*
  # Create analysis sessions table

  1. New Tables
    - `analysis_sessions`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, optional for future user auth)
      - `filename` (text, just the filename for reference)
      - `total_entries` (integer, count of log entries analyzed)
      - `error_count` (integer, count of errors found)
      - `warning_count` (integer, count of warnings found)
      - `info_count` (integer, count of info messages found)
      - `debug_count` (integer, count of debug messages found)

  2. Security
    - Enable RLS on `analysis_sessions` table
    - Add policy for public access (since no auth yet)

  3. Notes
    - No actual log content is stored, only metadata and counts
    - Filename is stored for user reference but no log content
*/

CREATE TABLE IF NOT EXISTS analysis_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  filename text,
  total_entries integer DEFAULT 0,
  error_count integer DEFAULT 0,
  warning_count integer DEFAULT 0,
  info_count integer DEFAULT 0,
  debug_count integer DEFAULT 0
);

ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (can be restricted later with auth)
CREATE POLICY "Public can insert analysis sessions"
  ON analysis_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read analysis sessions"
  ON analysis_sessions
  FOR SELECT
  TO public
  USING (true);