/*
  # Product Documentation Storage

  1. New Tables
    - `product_documentation`
      - `id` (uuid, primary key) - Unique identifier for each documentation entry
      - `title` (text) - Title of the documentation
      - `url` (text) - Original URL of the documentation
      - `content` (text) - Full text content of the documentation
      - `year` (integer) - Year of the documentation (e.g., 2023, 2024, 2025)
      - `category` (text) - Category of the documentation (e.g., 'version_support')
      - `created_at` (timestamptz) - When the documentation was added
      - `updated_at` (timestamptz) - When the documentation was last updated

  2. Security
    - Enable RLS on `product_documentation` table
    - Add policy for all authenticated users to read documentation (public read access)
    - Add policy for authenticated users to insert/update documentation

  3. Indexes
    - Add index on year for fast filtering by version year
    - Add index on category for fast filtering by documentation type
*/

CREATE TABLE IF NOT EXISTS product_documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  content text NOT NULL,
  year integer,
  category text DEFAULT 'version_support',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product documentation"
  ON product_documentation
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert documentation"
  ON product_documentation
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documentation"
  ON product_documentation
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_product_documentation_year ON product_documentation(year);
CREATE INDEX IF NOT EXISTS idx_product_documentation_category ON product_documentation(category);
