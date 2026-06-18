-- Per-user targeting and threaded replies on signal posts.

ALTER TABLE signal_posts
  ADD COLUMN IF NOT EXISTS parent_post_id UUID REFERENCES signal_posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_signal_posts_parent ON signal_posts(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_signal_posts_recipient ON signal_posts(recipient_user_id);

ALTER TABLE signal_posts DROP CONSTRAINT IF EXISTS signal_posts_audience_check;
ALTER TABLE signal_posts ADD CONSTRAINT signal_posts_audience_check
  CHECK (audience IN ('all_users', 'admin_only', 'specific_user'));

ALTER TABLE signal_posts DROP CONSTRAINT IF EXISTS signal_posts_recipient_required;
ALTER TABLE signal_posts ADD CONSTRAINT signal_posts_recipient_required
  CHECK (
    (audience = 'specific_user' AND recipient_user_id IS NOT NULL)
    OR (audience <> 'specific_user' AND recipient_user_id IS NULL)
  );

-- Read posts visible to a specific user (DM-style on signal thread)
DROP POLICY IF EXISTS "Read specific_user signal posts" ON signal_posts;
CREATE POLICY "Read specific_user signal posts"
  ON signal_posts FOR SELECT
  TO authenticated
  USING (
    audience = 'specific_user'
    AND (
      recipient_user_id = auth.uid()
      OR author_id = auth.uid()
      OR is_admin(auth.uid())
    )
  );

-- Admins: allow specific_user inserts with recipient
DROP POLICY IF EXISTS "Admins can insert signal posts" ON signal_posts;
CREATE POLICY "Admins can insert signal posts"
  ON signal_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    AND author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM signals s WHERE s.id = signal_posts.signal_id)
    AND (
      (audience = 'specific_user' AND recipient_user_id IS NOT NULL)
      OR (audience IN ('all_users', 'admin_only') AND recipient_user_id IS NULL)
    )
  );

CREATE OR REPLACE FUNCTION notify_on_signal_post_created()
RETURNS TRIGGER AS $$
DECLARE
  trading_pair TEXT;
  author_name TEXT;
  title_text TEXT;
  message_text TEXT;
  meta JSONB;
BEGIN
  SELECT s.trading_pair INTO trading_pair
  FROM signals s
  WHERE s.id = NEW.signal_id;

  IF trading_pair IS NULL THEN
    trading_pair := 'Signal';
  END IF;

  author_name := COALESCE(NULLIF(TRIM(NEW.author_display_name), ''), 'Someone');

  title_text := CASE NEW.post_type
    WHEN 'feedback' THEN 'New feedback: ' || trading_pair
    WHEN 'update' THEN 'Signal update: ' || trading_pair
    WHEN 'question' THEN 'New question: ' || trading_pair
    WHEN 'query' THEN 'New query: ' || trading_pair
    ELSE 'New post: ' || trading_pair
  END;

  IF NEW.parent_post_id IS NOT NULL THEN
    title_text := 'Reply on ' || trading_pair;
  END IF;

  message_text := author_name || ': ' || LEFT(NEW.summary, 160);

  meta := jsonb_build_object(
    'signal_id', NEW.signal_id,
    'signal_post_id', NEW.id,
    'parent_post_id', NEW.parent_post_id,
    'post_type', NEW.post_type,
    'audience', NEW.audience,
    'recipient_user_id', NEW.recipient_user_id,
    'trading_pair', trading_pair,
    'author_display_name', author_name,
    'has_attachment', NEW.attachment_path IS NOT NULL
  );

  IF NEW.audience = 'all_users' THEN
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    SELECT
      np.user_id,
      'signal',
      title_text,
      message_text,
      '/signals/' || NEW.signal_id::text,
      meta
    FROM notification_preferences np
    WHERE np.push_signals = true
      AND np.user_id <> NEW.author_id;
  ELSIF NEW.audience = 'specific_user' AND NEW.recipient_user_id IS NOT NULL THEN
    IF NEW.recipient_user_id <> NEW.author_id THEN
      INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
      VALUES (
        NEW.recipient_user_id,
        'signal',
        title_text,
        message_text,
        '/signals/' || NEW.signal_id::text,
        meta
      );
    END IF;
  ELSIF NEW.audience = 'admin_only' THEN
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    SELECT
      ur.user_id,
      'signal',
      title_text,
      message_text,
      '/admin/signals/discussion/' || NEW.signal_id::text,
      meta
    FROM user_roles ur
    WHERE ur.role = 'admin'
      AND ur.user_id <> NEW.author_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'signal_post notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
