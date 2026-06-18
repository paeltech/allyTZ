-- Enforce unique user email constraint
-- Supabase Auth already enforces email uniqueness, but this adds an extra layer of protection

-- Note: Supabase's auth.users table already has email uniqueness enforced at the database level.
-- This migration adds additional safeguards and ensures the constraint is explicit.

-- Create a function to check for duplicate emails (case-insensitive)
CREATE OR REPLACE FUNCTION check_unique_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email already exists (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(NEW.email)
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email % already exists', NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce email uniqueness on insert
-- Note: This may not work if Supabase has restrictions on auth.users triggers
-- If this fails, Supabase Auth already enforces uniqueness, so it's safe to skip
DO $$
BEGIN
  -- Try to create trigger, but don't fail if it already exists or can't be created
  BEGIN
    DROP TRIGGER IF EXISTS enforce_unique_email_trigger ON auth.users;
    CREATE TRIGGER enforce_unique_email_trigger
      BEFORE INSERT OR UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION check_unique_email();
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create trigger on auth.users - Supabase Auth already enforces email uniqueness';
    WHEN OTHERS THEN
      RAISE NOTICE 'Trigger creation skipped: %', SQLERRM;
  END;
END $$;

-- Add a unique index on email (case-insensitive) if it doesn't exist
-- Note: Supabase may already have this, so we use IF NOT EXISTS pattern
DO $$
BEGIN
  -- Try to create unique index, but don't fail if it already exists
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_email_unique 
    ON auth.users (LOWER(email));
  EXCEPTION
    WHEN duplicate_table THEN
      RAISE NOTICE 'Unique index on email already exists';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create index on auth.users - Supabase manages this automatically';
    WHEN OTHERS THEN
      RAISE NOTICE 'Index creation skipped: %', SQLERRM;
  END;
END $$;

-- Verify email uniqueness constraint
-- This query will show if there are any duplicate emails (should return 0 rows)
SELECT LOWER(email) AS email, COUNT(*) AS count
FROM auth.users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- If the above query returns any rows, you have duplicate emails that need to be resolved manually
