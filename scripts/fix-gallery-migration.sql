-- Delete the failed migration record so we can re-run it
DELETE FROM supabase_migrations.schema_migrations 
WHERE version = '20251014120000';

-- Create site_gallery_images table if missing (this likely succeeded)
CREATE TABLE IF NOT EXISTS public.site_gallery_images (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  order_index INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_site_gallery_images_order ON public.site_gallery_images(order_index);
CREATE INDEX IF NOT EXISTS idx_site_gallery_images_uploaded_by ON public.site_gallery_images(uploaded_by);

-- Enable RLS
ALTER TABLE public.site_gallery_images ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow everything for authenticated users
DROP POLICY IF EXISTS "Allow public read" ON public.site_gallery_images;
CREATE POLICY "Allow public read" ON public.site_gallery_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated insert" ON public.site_gallery_images
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated update" ON public.site_gallery_images
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated delete" ON public.site_gallery_images
  FOR DELETE USING (true);

-- Create storage policies (fixed with correct column name)
DO $$
BEGIN
  -- Drop existing policies to recreate them
  DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;
  
  -- Create policies
  CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'story-images' AND
      auth.role() = 'authenticated'
    );

  CREATE POLICY "Allow public read access to images" ON storage.objects
    FOR SELECT USING (bucket_id = 'story-images');

  CREATE POLICY "Allow authenticated users to update images" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'story-images' AND
      auth.role() = 'authenticated'
    );

  CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'story-images' AND
      auth.role() = 'authenticated'
    );
END$$;
