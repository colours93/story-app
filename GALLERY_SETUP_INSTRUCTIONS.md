# Site Gallery Upload Fix Instructions

## Problem Found ✓
The `site_gallery_images` table doesn't exist in your Supabase database, which is why uploads are failing.

## Solution: Create the Table

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://app.supabase.com/project/pttgtnvtdvcdomretmph/editor

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste this SQL**:

```sql
-- Create site_gallery_images table
CREATE TABLE IF NOT EXISTS public.site_gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  order_index INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_gallery_images_order 
ON public.site_gallery_images(order_index);

CREATE INDEX IF NOT EXISTS idx_site_gallery_images_uploaded_by 
ON public.site_gallery_images(uploaded_by);

-- Enable Row Level Security
ALTER TABLE public.site_gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
DROP POLICY IF EXISTS "Allow public read access" ON public.site_gallery_images;
CREATE POLICY "Allow public read access" ON public.site_gallery_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to insert" ON public.site_gallery_images
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to update" ON public.site_gallery_images
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to delete" ON public.site_gallery_images
  FOR DELETE USING (true);
```

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Verify**: You should see "Success. No rows returned" or similar

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
cd /Users/bobyjokebby/development/bambiland/story-app
supabase db push
```

This will run all pending migrations including the gallery table setup.

## After Setup

1. **Refresh your admin gallery page**: http://localhost:3001/admin/gallery
2. **Try uploading an image** - it should work now!

## Verification

Run this to verify the table was created:

```bash
curl -s http://localhost:3001/api/check-storage | python3 -m json.tool
```

Look for `"table": { "exists": true }`

## Current Status

✅ **Storage bucket exists**: `story-images` bucket is set up and public  
✅ **Upload functionality works**: Files can be uploaded to storage  
❌ **Database table missing**: `site_gallery_images` table needs to be created  

Once you create the table, everything will work!
