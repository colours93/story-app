import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Publicly fetch site-wide gallery images (uses admin client server-side)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_gallery_images')
      .select('image_url')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching site gallery images:', error)
      return NextResponse.json({ images: [] })
    }

    const images = (data || []).map((row: any) => row.image_url)
    return NextResponse.json({ images })
  } catch (e) {
    console.error('Error in GET /api/site-gallery:', e)
    return NextResponse.json({ images: [] })
  }
}

// POST - Admin-only: add a site gallery image record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl, imagePath, orderIndex } = await request.json()
    if (!imageUrl || !imagePath) {
      return NextResponse.json({ error: 'imageUrl and imagePath are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('site_gallery_images')
      .insert({
        image_url: imageUrl,
        image_path: imagePath,
        uploaded_by: session.user.id,
        order_index: typeof orderIndex === 'number' ? orderIndex : null,
      })
      .select('id, image_url')

    if (error) {
      console.error('Error inserting site gallery image:', error)
      const err = error as any
      return NextResponse.json({
        error: 'Failed to save image',
        details: err?.message || err?.hint || err?.details || String(error),
        code: err?.code
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('Error in POST /api/site-gallery:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Admin-only: remove a site gallery image record
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('imageUrl')

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    // Look up the storage path so we can remove the file from storage
    const { data: record, error: fetchError } = await supabaseAdmin
      .from('site_gallery_images')
      .select('id, image_path')
      .eq('image_url', imageUrl)
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching site gallery image record:', fetchError)
    }

    // Attempt to remove storage object if we have the path
    if (record?.image_path) {
      const { error: removeError } = await supabaseAdmin.storage
        .from('story-images')
        .remove([record.image_path])

      if (removeError) {
        // Log but do not block DB deletion; storage can be cleaned up later if needed
        console.error('Error removing storage object:', removeError)
      }
    }

    // Delete DB record(s)
    const { error: deleteError } = await supabaseAdmin
      .from('site_gallery_images')
      .delete()
      .eq('image_url', imageUrl)

    if (deleteError) {
      console.error('Error deleting site gallery image:', deleteError)
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error in DELETE /api/site-gallery:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}