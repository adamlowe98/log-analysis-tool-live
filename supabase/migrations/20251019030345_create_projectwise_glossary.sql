/*
  # Create ProjectWise Glossary Table

  1. New Tables
    - `projectwise_glossary`
      - `id` (uuid, primary key)
      - `abbreviation` (text, the short form)
      - `full_term` (text, the full name)
      - `aliases` (text array, alternative names)
      - `description` (text, explanation of the term)
      - `category` (text, type of term: product, component, technology, etc.)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `projectwise_glossary` table
    - Add policy for public read access (glossary is reference data)

  3. Initial Data
    - Populate with common ProjectWise abbreviations and terms
*/

CREATE TABLE IF NOT EXISTS projectwise_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abbreviation text NOT NULL,
  full_term text NOT NULL,
  aliases text[] DEFAULT '{}',
  description text,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projectwise_glossary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to glossary"
  ON projectwise_glossary
  FOR SELECT
  TO public
  USING (true);

-- Insert common ProjectWise abbreviations
INSERT INTO projectwise_glossary (abbreviation, full_term, aliases, description, category) VALUES
('PWDI', 'ProjectWise Design Integration', ARRAY['ProjectWise Integration Server', 'PWI Server', 'Integration Server'], 'Server component that enables integration between ProjectWise and various design applications', 'product'),
('PWE', 'ProjectWise Explorer', ARRAY['ProjectWise Client', 'PW Explorer'], 'Primary client application for accessing ProjectWise datasources', 'product'),
('PWA', 'ProjectWise Administrator', ARRAY['PW Administrator', 'Admin Console'], 'Administrative interface for managing ProjectWise environments', 'product'),
('PWW', 'ProjectWise Web', ARRAY['PW Web'], 'Web-based interface for ProjectWise', 'product'),
('PWCS', 'ProjectWise Caching Server', ARRAY['Caching Server'], 'Server that caches content for improved performance in distributed environments', 'product'),
('PWGS', 'ProjectWise Gateway Service', ARRAY['Gateway Service'], 'Service that provides gateway functionality for ProjectWise Cloud', 'product'),
('PW Cloud', 'ProjectWise Cloud', ARRAY['ProjectWise 365', 'PWCloud'], 'Cloud-hosted version of ProjectWise', 'product'),
('RLS', 'Row Level Security', ARRAY[]::text[], 'Security feature in ProjectWise and databases', 'technology'),
('iCS', 'i-model Composition Server', ARRAY['iModel Composition Server'], 'Server for creating and managing i-models from design files', 'product'),
('CONNECT Edition', 'CONNECT Edition', ARRAY['CE'], 'Major version family of Bentley products released from 2016 onwards', 'version'),
('PWPS', 'ProjectWise ProjectServer', ARRAY['ProjectServer'], 'Legacy ProjectWise server component', 'product'),
('CEL', 'CONNECT Edition Licensing', ARRAY[]::text[], 'Licensing system used in CONNECT Edition products', 'technology'),
('v8i', 'Version 8i', ARRAY['V8i'], 'Previous major version family of Bentley products (before CONNECT Edition)', 'version'),
('ISM', 'Integration Server Manager', ARRAY[]::text[], 'Tool for managing ProjectWise Integration Server', 'product')
ON CONFLICT (id) DO NOTHING;