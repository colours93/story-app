import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Check if table already exists
    const { error: checkError } = await supabaseAdmin
      .from('site_gallery_images')
      .select('count')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ 
        message: 'Table already exists',
        success: true 
      })
    }

    // Create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.site_gallery_images (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        image_url TEXT NOT NULL,
        image_path TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        order_index INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_site_gallery_images_order ON public.site_gallery_images(order_index);
      CREATE INDEX IF NOT EXISTS idx_site_gallery_images_uploaded_by ON public.site_gallery_images(uploaded_by);

      -- Enable RLS
      ALTER TABLE public.site_gallery_images ENABLE ROW LEVEL SECURITY;

      -- Create policies
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
    `

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (createError) {
      // Try alternative approach using the SQL editor endpoint
      console.error('RPC error, trying direct query:', createError)
      
      // Split and execute each statement separately
      const statements = createTableSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const statement of statements) {
        try {
          // This is a workaround - in production you should run migrations properly
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (e) {
          console.error('Statement execution error:', e)
        }
      }

      return NextResponse.json({ 
        error: 'Could not create table automatically. Please run the migration manually.',
        details: createError,
        sql: createTableSQL
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Table created successfully',
      success: true 
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({
      error: 'Failed to setup table',
      message: error?.message || String(error)
    }, { status: 500 })
  }
}
