-- Daily trader check-ins and phone contact preferences

CREATE TABLE IF NOT EXISTS daily_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL,
  trading_sessions TEXT[] NOT NULL DEFAULT '{}',
  mental_state TEXT NOT NULL CHECK (mental_state IN (
    'focused', 'neutral', 'distracted', 'stressed', 'tired', 'energized', 'anxious', 'motivated'
  )),
  needs_assistance BOOLEAN NOT NULL DEFAULT false,
  assistance_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date
  ON daily_check_ins(user_id, check_in_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_check_ins_needs_assistance
  ON daily_check_ins(needs_assistance, check_in_date DESC)
  WHERE needs_assistance = true;

ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own check-ins" ON daily_check_ins;
CREATE POLICY "Users can read own check-ins"
  ON daily_check_ins FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own check-ins" ON daily_check_ins;
CREATE POLICY "Users can insert own check-ins"
  ON daily_check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own check-ins" ON daily_check_ins;
CREATE POLICY "Users can update own check-ins"
  ON daily_check_ins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all check-ins" ON daily_check_ins;
CREATE POLICY "Admins can read all check-ins"
  ON daily_check_ins FOR SELECT
  USING (is_admin(auth.uid()));

-- Phone contact preferences on user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_used_for_calls BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_used_for_whatsapp BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS secondary_phone_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS secondary_phone_used_for_calls BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS secondary_phone_used_for_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_contact_setup_completed_at TIMESTAMPTZ;

COMMENT ON TABLE daily_check_ins IS 'Daily trader wellness and availability check-ins (EAT calendar date)';
COMMENT ON COLUMN user_profiles.phone_used_for_calls IS 'Primary phone_number used for voice calls';
COMMENT ON COLUMN user_profiles.phone_used_for_whatsapp IS 'Primary phone_number used for WhatsApp';
COMMENT ON COLUMN user_profiles.secondary_phone_number IS 'Alternate contact number when primary is not used for both';
