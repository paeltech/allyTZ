-- Broader admin + user notification coverage: DMs, signal feedback, check-ins, enquiries, replies.

-- ---------------------------------------------------------------------------
-- Direct messages: deep-link admins to the user thread
-- ---------------------------------------------------------------------------
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
    SELECT
      ur.user_id,
      'system',
      title_text,
      message_text,
      '/admin/messages/' || NEW.thread_user_id::text,
      meta
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

-- ---------------------------------------------------------------------------
-- Signal posts: notify admins on public user feedback; notify parent on reply
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_signal_post_created()
RETURNS TRIGGER AS $$
DECLARE
  trading_pair TEXT;
  author_name TEXT;
  title_text TEXT;
  message_text TEXT;
  meta JSONB;
  parent_author_id UUID;
  is_author_admin BOOLEAN;
BEGIN
  SELECT s.trading_pair INTO trading_pair FROM signals s WHERE s.id = NEW.signal_id;
  IF trading_pair IS NULL THEN trading_pair := 'Signal'; END IF;

  author_name := COALESCE(NULLIF(TRIM(NEW.author_display_name), ''), 'Someone');
  is_author_admin := is_admin(NEW.author_id);

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
    'author_id', NEW.author_id,
    'has_attachment', NEW.attachment_path IS NOT NULL
  );

  -- Public broadcast to subscribers
  IF NEW.audience = 'all_users' THEN
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    SELECT np.user_id, 'signal', title_text, message_text, '/signals/' || NEW.signal_id::text, meta
    FROM notification_preferences np
    WHERE np.push_signals = true AND np.user_id <> NEW.author_id;

    -- Also alert admins when a trader posts publicly (feedback / question / query)
    IF NOT is_author_admin AND NEW.post_type IN ('feedback', 'question', 'query') THEN
      INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
      SELECT ur.user_id, 'system', 'Trader ' || title_text, message_text,
        '/admin/signals/discussion/' || NEW.signal_id::text, meta
      FROM user_roles ur
      WHERE ur.role = 'admin' AND ur.user_id <> NEW.author_id;
    END IF;
  ELSIF NEW.audience = 'specific_user' AND NEW.recipient_user_id IS NOT NULL THEN
    IF NEW.recipient_user_id <> NEW.author_id THEN
      INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
      VALUES (
        NEW.recipient_user_id, 'signal', title_text, message_text,
        '/signals/' || NEW.signal_id::text, meta
      );
    END IF;
  ELSIF NEW.audience = 'admin_only' THEN
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    SELECT ur.user_id, 'system', title_text, message_text,
      '/admin/signals/discussion/' || NEW.signal_id::text, meta
    FROM user_roles ur
    WHERE ur.role = 'admin' AND ur.user_id <> NEW.author_id;
  END IF;

  -- Notify parent post author on threaded reply (if not already targeted above)
  IF NEW.parent_post_id IS NOT NULL THEN
    SELECT sp.author_id INTO parent_author_id FROM signal_posts sp WHERE sp.id = NEW.parent_post_id;
    IF parent_author_id IS NOT NULL
      AND parent_author_id <> NEW.author_id
      AND (NEW.audience <> 'specific_user' OR NEW.recipient_user_id IS DISTINCT FROM parent_author_id)
    THEN
      INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
      VALUES (
        parent_author_id,
        CASE WHEN is_admin(parent_author_id) THEN 'system' ELSE 'signal' END,
        title_text,
        message_text,
        CASE WHEN is_admin(parent_author_id)
          THEN '/admin/signals/discussion/' || NEW.signal_id::text
          ELSE '/signals/' || NEW.signal_id::text
        END,
        meta
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'signal_post notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Check-ins: notify admins when a trader needs assistance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_check_in_assistance()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  title_text TEXT;
  message_text TEXT;
  meta JSONB;
BEGIN
  IF NOT NEW.needs_assistance THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(OLD.needs_assistance, false) = true THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(TRIM(up.full_name), ''), NULLIF(TRIM(up.email), ''), 'Trader')
  INTO user_name
  FROM user_profiles up
  WHERE up.id = NEW.user_id;

  title_text := 'Assistance needed: ' || user_name;
  message_text := user_name || ' checked in and needs help'
    || CASE WHEN NEW.assistance_note IS NOT NULL AND TRIM(NEW.assistance_note) <> ''
      THEN '. Note: ' || LEFT(NEW.assistance_note, 120) ELSE '' END;

  meta := jsonb_build_object(
    'check_in_id', NEW.id,
    'user_id', NEW.user_id,
    'check_in_date', NEW.check_in_date,
    'assistance_note', NEW.assistance_note
  );

  INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
  SELECT ur.user_id, 'system', title_text, message_text, '/admin/check-ins', meta
  FROM user_roles ur
  WHERE ur.role = 'admin';

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'check_in assistance notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_check_in_assistance_notify ON daily_check_ins;
CREATE TRIGGER on_check_in_assistance_notify
  AFTER INSERT OR UPDATE OF needs_assistance, assistance_note ON daily_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_check_in_assistance();

-- ---------------------------------------------------------------------------
-- Enquiries: notify admins on new help requests
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_enquiry_created()
RETURNS TRIGGER AS $$
DECLARE
  title_text TEXT;
  message_text TEXT;
  meta JSONB;
BEGIN
  title_text := 'New enquiry: ' || LEFT(NEW.subject, 80);
  message_text := NEW.name || ' (' || NEW.enquiry_type || '): ' || LEFT(NEW.message, 140);

  meta := jsonb_build_object(
    'enquiry_id', NEW.id,
    'user_id', NEW.user_id,
    'enquiry_type', NEW.enquiry_type,
    'subject', NEW.subject
  );

  INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
  SELECT ur.user_id, 'system', title_text, message_text, '/admin', meta
  FROM user_roles ur
  WHERE ur.role = 'admin';

  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
    VALUES (
      NEW.user_id, 'system', 'Enquiry received',
      'We received your enquiry: ' || LEFT(NEW.subject, 100),
      '/home', meta
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'enquiry notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_enquiry_created_notify ON enquiries;
CREATE TRIGGER on_enquiry_created_notify
  AFTER INSERT ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_enquiry_created();

-- ---------------------------------------------------------------------------
-- Signal field updates: include action_url for mobile deep links
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_signal_updated_store_and_notify()
RETURNS TRIGGER AS $$
DECLARE
  ch JSONB;
  is_first BOOLEAN;
  msg_text TEXT;
  title_text TEXT;
BEGIN
  ch := build_signal_changes(OLD, NEW);
  IF ch = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  SELECT NOT EXISTS (SELECT 1 FROM signal_updates WHERE signal_id = OLD.id LIMIT 1) INTO is_first;

  IF is_first THEN
    INSERT INTO signal_updates (signal_id, revision_type, snapshot, created_at)
    VALUES (OLD.id, 'initial', signal_row_to_snapshot(OLD), OLD.updated_at);
  END IF;

  INSERT INTO signal_updates (signal_id, revision_type, changes, created_at)
  VALUES (NEW.id, 'update', ch, TIMEZONE('utc'::text, NOW()));

  title_text := '📝 Signal updated: ' || NEW.trading_pair;
  msg_text := 'SL/TP or details updated. Tap to view changes.';
  IF ch ? 'stop_loss' OR ch ? 'take_profit_1' OR ch ? 'take_profit_2' OR ch ? 'take_profit_3' THEN
    msg_text := 'Stop loss or take profit levels updated. Tap to view.';
  ELSIF ch ? 'entry_price' THEN
    msg_text := 'Entry price updated. Tap to view.';
  ELSIF ch ? 'status' THEN
    msg_text := 'Status: ' || (ch->'status'->>'old') || ' → ' || (ch->'status'->>'new');
  END IF;

  INSERT INTO notifications (user_id, notification_type, title, message, action_url, metadata)
  SELECT
    np.user_id,
    'signal',
    title_text,
    msg_text,
    '/signals/' || NEW.id::text,
    jsonb_build_object(
      'signal_id', NEW.id,
      'trading_pair', NEW.trading_pair,
      'signal_type', NEW.signal_type,
      'updated', true,
      'changes', ch
    )
  FROM notification_preferences np
  WHERE np.push_signals = true;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'signal_updates trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
