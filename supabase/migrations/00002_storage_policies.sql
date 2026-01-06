-- Storage Bucket and Policies for Praise Photos
-- Run this after creating the bucket in Supabase Dashboard

-- Create the storage bucket (public bucket with unguessable paths)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'praise-photos',
    'praise-photos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'praise-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'praise-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'praise-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view photos (public bucket)
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'praise-photos');
