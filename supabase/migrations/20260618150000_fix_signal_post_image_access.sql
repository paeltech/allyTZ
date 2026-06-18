-- Fix signal post image access: allow authenticated signed URLs and HEIC uploads from iOS.

UPDATE storage.buckets
SET
  public = true,
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]
WHERE id = 'signal-post-attachments';

DROP POLICY IF EXISTS "Authenticated read signal post images" ON storage.objects;
CREATE POLICY "Authenticated read signal post images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'signal-post-attachments');
