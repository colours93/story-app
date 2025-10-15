-- Idempotent setup for gallery storage and metadata

-- Create public storage bucket `story-images`
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-images', 'story-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Allow authenticated users to upload images'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'story-images' AND
      auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Allow public read access to images'
  ) THEN
    CREATE POLICY "Allow public read access to images" ON storage.objects
    FOR SELECT USING (bucket_id = 'story-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Allow authenticated users to update images'
  ) THEN
    CREATE POLICY "Allow authenticated users to update images" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'story-images' AND
      auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Allow authenticated users to delete images'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'story-images' AND
      auth.role() = 'authenticated'
    );
  END IF;
END$$;

-- Create site_gallery_images table if missing
CREATE TABLE IF NOT EXISTS public.site_gallery_images (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  order_index INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_site_gallery_images_order ON public.site_gallery_images(order_index);
CREATE INDEX IF NOT EXISTS idx_site_gallery_images_uploaded_by ON public.site_gallery_images(uploaded_by);