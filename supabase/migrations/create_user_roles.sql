-- Create user_roles table for managing user permissions
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- Helper function to check if user is admin (using SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own role
CREATE POLICY "Users can read their own role"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can read all roles (using the function to avoid recursion)
CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can insert/update/delete roles (using the function to avoid recursion)
CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Helper function to safely create admin policies on tables
CREATE OR REPLACE FUNCTION create_admin_policies()
RETURNS void AS $$
BEGIN
  -- Update RLS policies for enquiries to allow admin access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enquiries') THEN
    DROP POLICY IF EXISTS "Admins can manage all enquiries" ON enquiries;
    CREATE POLICY "Admins can manage all enquiries"
      ON enquiries
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Update RLS policies for collaborations to allow admin access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaborations') THEN
    DROP POLICY IF EXISTS "Admins can manage all collaborations" ON collaborations;
    CREATE POLICY "Admins can manage all collaborations"
      ON collaborations
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Update RLS policies for trade_analyses to allow admin access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_analyses') THEN
    DROP POLICY IF EXISTS "Admins can manage trade analyses" ON trade_analyses;
    CREATE POLICY "Admins can manage trade analyses"
      ON trade_analyses
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Update RLS policies for trade_analysis_purchases to allow admin read access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_analysis_purchases') THEN
    DROP POLICY IF EXISTS "Admins can read all purchases" ON trade_analysis_purchases;
    CREATE POLICY "Admins can read all purchases"
      ON trade_analysis_purchases
      FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;

  -- Update RLS policies for sentiment_votes to allow admin read access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sentiment_votes') THEN
    DROP POLICY IF EXISTS "Admins can read all sentiment votes" ON sentiment_votes;
    CREATE POLICY "Admins can read all sentiment votes"
      ON sentiment_votes
      FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create policies for existing tables
SELECT create_admin_policies();

-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS create_admin_policies();


-- Seed admin roles only when those auth users exist (safe for fresh projects)
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.id IN (
  'b7a990b7-4a53-487c-8627-dd6069741bae'::uuid,
  '9c9c64d9-63c9-4257-bf40-43b75543f715'::uuid
)
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
