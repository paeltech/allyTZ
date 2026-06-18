-- Notify users when new signal feedback/posts are created.

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

  message_text := author_name || ': ' || LEFT(NEW.summary, 160);

  meta := jsonb_build_object(
    'signal_id', NEW.signal_id,
    'signal_post_id', NEW.id,
    'post_type', NEW.post_type,
    'audience', NEW.audience,
    'trading_pair', trading_pair,
    'author_display_name', author_name,
    'has_attachment', NEW.attachment_path IS NOT NULL
  );

  IF NEW.audience = 'all_users' THEN
    INSERT INTO notifications (user_id, notification_type, title, message, metadata)
    SELECT
      np.user_id,
      'signal',
      title_text,
      message_text,
      meta
    FROM notification_preferences np
    WHERE np.push_signals = true
      AND np.user_id <> NEW.author_id;
  ELSE
    INSERT INTO notifications (user_id, notification_type, title, message, metadata)
    SELECT
      ur.user_id,
      'signal',
      title_text,
      message_text,
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

DROP TRIGGER IF EXISTS on_signal_post_created_notify ON signal_posts;

CREATE TRIGGER on_signal_post_created_notify
  AFTER INSERT ON signal_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_signal_post_created();

COMMENT ON FUNCTION notify_on_signal_post_created() IS 'Creates in-app (and push) notifications when signal feedback/posts are added.';
