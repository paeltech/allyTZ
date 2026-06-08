# Event Cover Images Storage Setup

This document explains how to set up Supabase Storage for event cover images.

## Storage Bucket Setup

1. **Create the Storage Bucket**:
   - Go to your Supabase Dashboard
   - Navigate to **Storage** in the left sidebar
   - Click **New bucket**
   - Name: `event-covers`
   - Make it **Public** (so images can be accessed via public URLs)
   - Click **Create bucket**

2. **Set Up Storage Policies**:

   Run the following SQL in your Supabase SQL Editor to set up RLS policies for the `event-covers` bucket:

   ```sql
   -- Allow authenticated users to upload images
   CREATE POLICY "Authenticated users can upload event covers"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'event-covers' AND auth.role() = 'authenticated');

   -- Allow authenticated users to update their own uploads
   CREATE POLICY "Authenticated users can update event covers"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (bucket_id = 'event-covers' AND auth.role() = 'authenticated')
   WITH CHECK (bucket_id = 'event-covers' AND auth.role() = 'authenticated');

   -- Allow authenticated users to delete their own uploads
   CREATE POLICY "Authenticated users can delete event covers"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'event-covers' AND auth.role() = 'authenticated');

   -- Allow public read access (since bucket is public)
   CREATE POLICY "Public can read event covers"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'event-covers');

   -- Admins can manage all event covers
   CREATE POLICY "Admins can manage all event covers"
   ON storage.objects FOR ALL
   TO authenticated
   USING (
     bucket_id = 'event-covers' AND
     is_admin(auth.uid())
   )
   WITH CHECK (
     bucket_id = 'event-covers' AND
     is_admin(auth.uid())
   );
   ```

3. **File Size Limits**:
   - The application enforces a 5MB limit for uploaded images
   - Supabase Storage has a default limit of 50MB per file
   - You can adjust these limits in your Supabase project settings if needed

4. **Supported Image Formats**:
   - PNG
   - JPG/JPEG
   - GIF
   - WebP

## Testing

After setting up the storage bucket and policies:

1. Go to `/admin/events`
2. Click "Create Event"
3. Try uploading a cover image
4. Verify the image appears in the preview
5. Save the event and verify the image displays correctly

## Troubleshooting

- **"Bucket not found" error**: Make sure the bucket name is exactly `event-covers` and it's marked as public
- **"Permission denied" error**: Check that the storage policies are correctly applied
- **Image not displaying**: Verify the bucket is public and the image URL is accessible
