-- Panel documents: admin-uploaded files; users view via view-panel-document Edge Function (no direct storage access).

-- ---------------------------------------------------------------------------
-- panel_documents metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS panel_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_panel_documents_published_sort
  ON panel_documents (published, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_panel_documents_category
  ON panel_documents (category);

ALTER TABLE panel_documents ENABLE ROW LEVEL SECURITY;

-- Authenticated users read published documents only (metadata; file bytes via Edge Function)
CREATE POLICY "Authenticated users can read published documents"
  ON panel_documents FOR SELECT
  TO authenticated
  USING (published = true);

CREATE POLICY "Admins can read all panel documents"
  ON panel_documents FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert panel documents"
  ON panel_documents FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update panel documents"
  ON panel_documents FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete panel documents"
  ON panel_documents FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_panel_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS panel_documents_updated_at ON panel_documents;
CREATE TRIGGER panel_documents_updated_at
  BEFORE UPDATE ON panel_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_panel_documents_updated_at();

COMMENT ON TABLE panel_documents IS 'Admin-managed documents; files in private panel-documents storage bucket';

-- ---------------------------------------------------------------------------
-- Private storage bucket (no public URLs)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'panel-documents',
  'panel-documents',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Admins manage files in panel-documents bucket
CREATE POLICY "Admins can upload panel documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'panel-documents'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can update panel document files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'panel-documents' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'panel-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete panel document files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'panel-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins can read panel document files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'panel-documents' AND is_admin(auth.uid()));

-- Regular users cannot read storage.objects directly; viewing goes through Edge Function.
