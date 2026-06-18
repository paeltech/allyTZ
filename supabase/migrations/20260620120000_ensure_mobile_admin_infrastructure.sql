-- Ensures mobile admin features work: direct messages, signal post targeting, storage buckets.

-- ---------------------------------------------------------------------------
-- user_direct_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  attachment_path TEXT,
  author_display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_direct_messages_thread
  ON user_direct_messages(thread_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_direct_messages_author
  ON user_direct_messages(author_id);

ALTER TABLE user_direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own direct messages" ON user_direct_messages;
CREATE POLICY "Users read own direct messages"
  ON user_direct_messages FOR SELECT TO authenticated
  USING (thread_user_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users send direct messages" ON user_direct_messages;
CREATE POLICY "Users send direct messages"
  ON user_direct_messages FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (thread_user_id = auth.uid() AND NOT is_admin(auth.uid()))
      OR (is_admin(auth.uid()) AND thread_user_id <> auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- signal_posts: replies + per-user audience
-- ---------------------------------------------------------------------------
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

DROP POLICY IF EXISTS "Read specific_user signal posts" ON signal_posts;
CREATE POLICY "Read specific_user signal posts"
  ON signal_posts FOR SELECT TO authenticated
  USING (
    audience = 'specific_user'
    AND (recipient_user_id = auth.uid() OR author_id = auth.uid() OR is_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can insert signal posts" ON signal_posts;
CREATE POLICY "Admins can insert signal posts"
  ON signal_posts FOR INSERT TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    AND author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM signals s WHERE s.id = signal_posts.signal_id)
    AND (
      (audience = 'specific_user' AND recipient_user_id IS NOT NULL)
      OR (audience IN ('all_users', 'admin_only') AND recipient_user_id IS NULL)
    )
  );

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'direct-message-attachments', 'direct-message-attachments', true, 5242880,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signal-post-attachments', 'signal-post-attachments', true, 5242880,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-analysis-charts', 'trade-analysis-charts', true, 10485760,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers', 'event-covers', true, 10485760,
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- direct-message-attachments policies
DROP POLICY IF EXISTS "Users upload direct message images" ON storage.objects;
CREATE POLICY "Users upload direct message images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'direct-message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Public read direct message images" ON storage.objects;
CREATE POLICY "Public read direct message images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'direct-message-attachments');

DROP POLICY IF EXISTS "Authenticated read direct message images" ON storage.objects;
CREATE POLICY "Authenticated read direct message images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'direct-message-attachments');

-- trade-analysis-charts policies
DROP POLICY IF EXISTS "Admins upload trade analysis charts" ON storage.objects;
CREATE POLICY "Admins upload trade analysis charts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trade-analysis-charts' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read trade analysis charts" ON storage.objects;
CREATE POLICY "Public read trade analysis charts"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'trade-analysis-charts');

DROP POLICY IF EXISTS "Admins manage trade analysis charts" ON storage.objects;
CREATE POLICY "Admins manage trade analysis charts"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'trade-analysis-charts' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'trade-analysis-charts' AND is_admin(auth.uid()));

-- event-covers policies
DROP POLICY IF EXISTS "Admins upload event covers" ON storage.objects;
CREATE POLICY "Admins upload event covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-covers' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read event covers" ON storage.objects;
CREATE POLICY "Public read event covers"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "Admins manage event covers" ON storage.objects;
CREATE POLICY "Admins manage event covers"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'event-covers' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'event-covers' AND is_admin(auth.uid()));

-- signal-post-attachments (ensure upload policy exists)
DROP POLICY IF EXISTS "Users upload signal post images" ON storage.objects;
CREATE POLICY "Users upload signal post images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signal-post-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Public read signal post images" ON storage.objects;
CREATE POLICY "Public read signal post images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'signal-post-attachments');

-- Notifications for direct messages
CREATE OR REPLACE FUNCTION notify_on_direct_message_created()
RETURNS TRIGGER AS $$
DECLARE
  author_name TEXT;
  title_text TEXT;
  message_text TEXT;
  meta JSONB;
BEGIN
  author_name := COALESCE(NULLIF(TRIM(NEW.author_display_name), ''), 'Someone');
  message_text := author_name || ': ' || LEFT(NEW.body, 160);
  meta := jsonb_build_object('direct_message_id', NEW.id, 'thread_user_id', NEW.thread_user_id, 'author_id', NEW.author_id, 'has_attachment', NEW.attachment_path IS NOT NULL);

  IF is_admin(NEW.author_id) THEN
    title_text := 'Message from AllyTZ';
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    VALUES (NEW.thread_user_id, 'system', title_text, message_text, '/messages', meta);
  ELSE
    title_text := 'User message: ' || author_name;
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    SELECT ur.user_id, 'system', title_text, message_text, '/admin/messages', meta
    FROM user_roles ur WHERE ur.role = 'admin' AND ur.user_id <> NEW.author_id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'direct_message notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_direct_message_created_notify ON user_direct_messages;
CREATE TRIGGER on_direct_message_created_notify
  AFTER INSERT ON user_direct_messages FOR EACH ROW
  EXECUTE FUNCTION notify_on_direct_message_created();

-- Updated signal post notifications
CREATE OR REPLACE FUNCTION notify_on_signal_post_created()
RETURNS TRIGGER AS $$
DECLARE
  trading_pair TEXT;
  author_name TEXT;
  title_text TEXT;
  message_text TEXT;
  meta JSONB;
BEGIN
  SELECT s.trading_pair INTO trading_pair FROM signals s WHERE s.id = NEW.signal_id;
  IF trading_pair IS NULL THEN trading_pair := 'Signal'; END IF;
  author_name := COALESCE(NULLIF(TRIM(NEW.author_display_name), ''), 'Someone');
  title_text := CASE NEW.post_type
    WHEN 'feedback' THEN 'New feedback: ' || trading_pair
    WHEN 'update' THEN 'Signal update: ' || trading_pair
    WHEN 'question' THEN 'New question: ' || trading_pair
    WHEN 'query' THEN 'New query: ' || trading_pair
    ELSE 'New post: ' || trading_pair END;
  IF NEW.parent_post_id IS NOT NULL THEN title_text := 'Reply on ' || trading_pair; END IF;
  message_text := author_name || ': ' || LEFT(NEW.summary, 160);
  meta := jsonb_build_object('signal_id', NEW.signal_id, 'signal_post_id', NEW.id, 'parent_post_id', NEW.parent_post_id, 'post_type', NEW.post_type, 'audience', NEW.audience, 'recipient_user_id', NEW.recipient_user_id, 'trading_pair', trading_pair, 'author_display_name', author_name, 'has_attachment', NEW.attachment_path IS NOT NULL);

  IF NEW.audience = 'all_users' THEN
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    SELECT np.user_id, 'signal', title_text, message_text, '/signals/' || NEW.signal_id::text, meta
    FROM notification_preferences np WHERE np.push_signals = true AND np.user_id <> NEW.author_id;
  ELSIF NEW.audience = 'specific_user' AND NEW.recipient_user_id IS NOT NULL THEN
    IF NEW.recipient_user_id <> NEW.author_id THEN
      INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
      VALUES (NEW.recipient_user_id, 'signal', title_text, message_text, '/signals/' || NEW.signal_id::text, meta);
    END IF;
  ELSIF NEW.audience = 'admin_only' THEN
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    SELECT ur.user_id, 'signal', title_text, message_text, '/admin/signals/discussion/' || NEW.signal_id::text, meta
    FROM user_roles ur WHERE ur.role = 'admin' AND ur.user_id <> NEW.author_id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'signal_post notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
