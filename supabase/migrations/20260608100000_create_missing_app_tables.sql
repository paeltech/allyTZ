-- Tables referenced by the app but missing from prior migrations

CREATE TABLE IF NOT EXISTS broker_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  broker_account_id TEXT,
  telegram_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_broker_verifications_user_id ON broker_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_verifications_status ON broker_verifications(status);

ALTER TABLE broker_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own broker verifications" ON broker_verifications;
CREATE POLICY "Users can insert own broker verifications"
  ON broker_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own broker verifications" ON broker_verifications;
CREATE POLICY "Users can read own broker verifications"
  ON broker_verifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage broker verifications" ON broker_verifications;
CREATE POLICY "Admins can manage broker verifications"
  ON broker_verifications FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS user_course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON user_course_enrollments(user_id);

ALTER TABLE user_course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own course enrollments" ON user_course_enrollments;
CREATE POLICY "Users can insert own course enrollments"
  ON user_course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own course enrollments" ON user_course_enrollments;
CREATE POLICY "Users can read own course enrollments"
  ON user_course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all course enrollments" ON user_course_enrollments;
CREATE POLICY "Admins can read all course enrollments"
  ON user_course_enrollments FOR SELECT
  USING (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS user_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page TEXT NOT NULL CHECK (page IN ('courses', 'events')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_filters_user_id ON user_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_filters_page ON user_filters(page);

ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own filters" ON user_filters;
CREATE POLICY "Users can manage own filters"
  ON user_filters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE broker_verifications IS 'Broker partnership verification requests (Trade With AllyTZ flow)';
COMMENT ON TABLE user_course_enrollments IS 'Course enrollment tracking for dashboard academy';
COMMENT ON TABLE user_filters IS 'Saved filter presets for courses and events pages';
