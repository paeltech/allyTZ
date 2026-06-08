# Supabase Storage Setup for Trade Analysis Charts

## Setup Instructions

To enable chart image uploads, you need to create a Supabase Storage bucket:

### Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name: `trade-analysis-charts`
5. Make it **Public** (so images can be accessed via URL)
6. Click **Create bucket**

### Step 2: Set Up Storage Policies

Run this SQL in the Supabase SQL Editor to set up proper access policies:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload charts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trade-analysis-charts');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update charts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'trade-analysis-charts');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete charts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'trade-analysis-charts');

-- Allow public read access (so images can be displayed)
CREATE POLICY "Public can view charts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'trade-analysis-charts');
```

### Step 3: Verify Setup

After creating the bucket and policies:
- The admin form should now allow image uploads
- Images will be stored in the `trade-analysis-charts` bucket
- Chart images will be displayed on both admin and user dashboards

## File Size Limits

- Maximum file size: 5MB
- Supported formats: PNG, JPG, JPEG, GIF, WebP
- Images are automatically optimized and stored with unique filenames
