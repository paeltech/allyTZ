-- Direct admin ↔ user messaging with optional image attachments.

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
  ON user_direct_messages FOR SELECT
  TO authenticated
  USING (thread_user_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users send direct messages" ON user_direct_messages;
CREATE POLICY "Users send direct messages"
  ON user_direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (thread_user_id = auth.uid() AND NOT is_admin(auth.uid()))
      OR (is_admin(auth.uid()) AND thread_user_id <> auth.uid())
    )
  );

COMMENT ON TABLE user_direct_messages IS 'One thread per trader (thread_user_id): admin and user exchange messages with optional images.';

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'direct-message-attachments',
  'direct-message-attachments',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload direct message images" ON storage.objects;
CREATE POLICY "Users upload direct message images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'direct-message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Public read direct message images" ON storage.objects;
CREATE POLICY "Public read direct message images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'direct-message-attachments');

-- Notifications on new direct messages
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

  meta := jsonb_build_object(
    'direct_message_id', NEW.id,
    'thread_user_id', NEW.thread_user_id,
    'author_id', NEW.author_id,
    'has_attachment', NEW.attachment_path IS NOT NULL
  );

  IF is_admin(NEW.author_id) THEN
    title_text := 'Message from AllyTZ';
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    VALUES (NEW.thread_user_id, 'system', title_text, message_text, '/messages', meta);
  ELSE
    title_text := 'User message: ' || author_name;
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    SELECT ur.user_id, 'system', title_text, message_text, '/admin/messages', meta
    FROM user_roles ur
    WHERE ur.role = 'admin'
      AND ur.user_id <> NEW.author_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'direct_message notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_direct_message_created_notify ON user_direct_messages;

CREATE TRIGGER on_direct_message_created_notify
  AFTER INSERT ON user_direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_direct_message_created();
