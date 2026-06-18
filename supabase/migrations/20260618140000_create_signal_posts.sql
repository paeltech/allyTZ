-- Signal posts: user/admin feedback, questions, and updates on a signal thread.
-- Separate from signal_updates (automated field-change audit trail).

CREATE TABLE IF NOT EXISTS signal_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('feedback', 'update', 'question', 'query')),
  audience TEXT NOT NULL CHECK (audience IN ('all_users', 'admin_only')),
  summary TEXT NOT NULL CHECK (char_length(trim(summary)) > 0),
  attachment_path TEXT,
  author_display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signal_posts_signal_id ON signal_posts(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_posts_created_at ON signal_posts(signal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_posts_author_id ON signal_posts(author_id);

ALTER TABLE signal_posts ENABLE ROW LEVEL SECURITY;

-- Read posts visible to the current user
DROP POLICY IF EXISTS "Read all_users signal posts" ON signal_posts;
CREATE POLICY "Read all_users signal posts"
  ON signal_posts FOR SELECT
  TO authenticated
  USING (
    audience = 'all_users'
    AND EXISTS (
      SELECT 1 FROM signals s
      WHERE s.id = signal_posts.signal_id
      AND (s.status = 'active' OR auth.uid() IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Read admin_only signal posts" ON signal_posts;
CREATE POLICY "Read admin_only signal posts"
  ON signal_posts FOR SELECT
  TO authenticated
  USING (
    audience = 'admin_only'
    AND (is_admin(auth.uid()) OR author_id = auth.uid())
  );

-- Regular users: feedback, question, query only
DROP POLICY IF EXISTS "Users can insert signal posts" ON signal_posts;
CREATE POLICY "Users can insert signal posts"
  ON signal_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND NOT is_admin(auth.uid())
    AND post_type IN ('feedback', 'question', 'query')
    AND EXISTS (
      SELECT 1 FROM signals s
      WHERE s.id = signal_posts.signal_id
      AND (s.status = 'active' OR auth.uid() IS NOT NULL)
    )
  );

-- Admins: any post type and audience
DROP POLICY IF EXISTS "Admins can insert signal posts" ON signal_posts;
CREATE POLICY "Admins can insert signal posts"
  ON signal_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM signals s WHERE s.id = signal_posts.signal_id
    )
  );

COMMENT ON TABLE signal_posts IS 'User/admin posts on signals: feedback, questions, updates with optional image attachment.';

-- ---------------------------------------------------------------------------
-- Storage: signal-post-attachments (images only, optional per post)
-- Path convention: {author_id}/{signal_id}/{filename}
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signal-post-attachments',
  'signal-post-attachments',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload signal post images" ON storage.objects;
CREATE POLICY "Users upload signal post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'signal-post-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Public read signal post images" ON storage.objects;
CREATE POLICY "Public read signal post images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'signal-post-attachments');

DROP POLICY IF EXISTS "Authors delete signal post images" ON storage.objects;
CREATE POLICY "Authors delete signal post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'signal-post-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
