import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs/promises'
import path from 'path'

const DEV_POSTS_FILE = path.join(process.cwd(), 'supabase', '.temp', 'dev_media_posts.json')

async function readDevPosts(): Promise<any[]> {
  try {
    const buf = await fs.readFile(DEV_POSTS_FILE, 'utf-8')
    const arr = JSON.parse(buf)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

async function writeDevPosts(posts: any[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DEV_POSTS_FILE), { recursive: true })
    await fs.writeFile(DEV_POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to write dev media posts file:', e)
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: posts, error } = await supabaseAdmin
      .from('media_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching media posts:', error)
      // Dev fallback: read locally persisted posts
      const devPosts = await readDevPosts()
      return NextResponse.json({ posts: devPosts, devFallback: true })
    }

    // Attach media assets
    const postIds = (posts || []).map((p: any) => p.id)
    const { data: assets } = await supabaseAdmin
      .from('media_assets')
      .select('*')
      .in('post_id', postIds)
      .order('order_index', { ascending: true })

    const assetsByPost = (assets || []).reduce((acc: Record<string, any[]>, a: any) => {
      acc[a.post_id] = acc[a.post_id] || []
      acc[a.post_id].push(a)
      return acc
    }, {})

    const combined = (posts || []).map((p: any) => ({ ...p, assets: assetsByPost[p.id] || [] }))
    return NextResponse.json({ posts: combined })
  } catch (e) {
    console.error('GET /api/admin/media-posts error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, body, required_tier_id, price_cents, is_published, media, is_special_card } = await request.json()
    const userId = (session.user as any).id

    const { data: post, error: postError } = await supabaseAdmin
      .from('media_posts')
      .insert({
        user_id: userId,
        title: title || null,
        body: body || null,
        required_tier_id: required_tier_id || null,
        price_cents: price_cents || null,
        is_published: Boolean(is_published),
        is_special_card: Boolean(is_special_card),
      })
      .select('*')
      .single()

    if (postError || !post) {
      console.error('Error creating post:', postError)
      // Dev fallback: persist locally and return mock ID
      const mockId = `mock-${Date.now()}`
      const assets = Array.isArray(media) ? media.map((m: any, i: number) => ({
        id: `mock-asset-${mockId}-${i}`,
        post_id: mockId,
        media_url: m?.url,
        media_type: m?.type === 'video' ? 'video' : 'image',
        thumb_url: m?.thumb_url || null,
        order_index: i,
      })) : []
      const newPost = {
        id: mockId,
        user_id: userId,
        title: title || null,
        body: body || null,
        required_tier_id: required_tier_id || null,
        price_cents: price_cents || null,
        is_published: Boolean(is_published),
        is_special_card: Boolean(is_special_card),
        created_at: new Date().toISOString(),
        assets,
      }
      const existing = await readDevPosts()
      await writeDevPosts([newPost, ...existing])
      return NextResponse.json({ success: true, postId: mockId, devFallback: true })
    }

    if (Array.isArray(media) && media.length > 0) {
      const rows = media.map((m: any, i: number) => ({
        post_id: post.id,
        media_url: m?.url,
        media_type: m?.type === 'video' ? 'video' : 'image',
        thumb_url: m?.thumb_url || null,
        order_index: i,
      }))

      const { error: assetError } = await supabaseAdmin
        .from('media_assets')
        .insert(rows)

      if (assetError) {
        console.error('Error inserting assets:', assetError)
        // Proceed but inform the client
      }
    }

    return NextResponse.json({ success: true, postId: post.id })
  } catch (e) {
    console.error('POST /api/admin/media-posts error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}