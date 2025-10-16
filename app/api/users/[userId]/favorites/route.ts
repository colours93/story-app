import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import fs from 'fs/promises'
import path from 'path'

const DEV_DIR = path.join(process.cwd(), 'supabase', '.temp')
const DEV_LIKES_FILE = path.join(DEV_DIR, 'dev_post_likes.json')
const DEV_POSTS_FILE = path.join(DEV_DIR, 'dev_media_posts.json')
const DEV_GALLERY_FILE = path.join(DEV_DIR, 'dev_user_gallery.json')

async function ensureDevDir() {
  try { await fs.mkdir(DEV_DIR, { recursive: true }) } catch {}
}

async function readDevLikes(): Promise<Record<string, Array<{ user_id: string; username: string }>>> {
  try {
    const buf = await fs.readFile(DEV_LIKES_FILE, 'utf-8')
    const json = JSON.parse(buf)
    return json && typeof json === 'object' ? json : {}
  } catch {
    return {}
  }
}

async function readDevPosts(): Promise<any[]> {
  try {
    const buf = await fs.readFile(DEV_POSTS_FILE, 'utf-8')
    const arr = JSON.parse(buf)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

type GalleryItem = {
  asset_id: string
  post_id: string
  media_type: 'image' | 'video'
  media_url: string
  created_at?: string
  user_id?: string
  username?: string
}

async function readDevGallery(): Promise<Record<string, GalleryItem[]>> {
  try {
    const buf = await fs.readFile(DEV_GALLERY_FILE, 'utf-8')
    const json = JSON.parse(buf)
    return json && typeof json === 'object' ? json : {}
  } catch {
    return {}
  }
}

async function writeDevGallery(map: Record<string, GalleryItem[]>) {
  await ensureDevDir()
  await fs.writeFile(DEV_GALLERY_FILE, JSON.stringify(map, null, 2), 'utf-8')
}

// Dev-only helper: provide sample posts when no local dev posts exist
function devSamplePosts(): any[] {
  return [
    {
      id: 'sample-1',
      user_id: 'creator-1',
      title: 'Sunset Run',
      body: 'New set from today',
      price_cents: 499,
      created_at: new Date().toISOString(),
      required_tier_id: null,
      assets: [
        { id: 'asset-1', post_id: 'sample-1', media_url: '/chapter-1.jpg', media_type: 'image' }
      ]
    },
    {
      id: 'sample-2',
      user_id: 'creator-2',
      title: 'Behind the scenes',
      body: 'Short clip',
      price_cents: 999,
      created_at: new Date().toISOString(),
      required_tier_id: null,
      assets: [
        { id: 'asset-2', post_id: 'sample-2', media_url: 'https://www.w3schools.com/html/mov_bbb.mp4', media_type: 'video' }
      ]
    }
  ]
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    const { searchParams } = new URL(request.url)
    const usernameParam = (searchParams.get('username') || '').toLowerCase()
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '9', 10), 1), 50)

    // Try curated favorites/gallery from Supabase first, but fall back to dev file when empty
    let items: GalleryItem[] = []
    // Initialize as a non-null array to avoid nullability diagnostics
    let supabaseRows: any[] = []
    try {
      const { data: rows, error } = await supabaseAdmin
        .from('user_gallery')
        .select('asset_id, post_id, media_url, media_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      supabaseRows = rows || []
      if (supabaseRows.length > 0) {
        items = supabaseRows.map((r: any) => ({
          asset_id: r.asset_id,
          post_id: r.post_id,
          media_url: r.media_url,
          media_type: r.media_type,
          created_at: r.created_at,
        }))
      }
    } catch (e) {
      // Ignore and fall through to dev fallback
    }

    // Dev fallback: if Supabase query errored or returned no items, read local gallery file
    if (!items || items.length === 0) {
      const devGallery = await readDevGallery()
      const byId = devGallery[userId] || []
      if (byId.length > 0) {
        items = byId
      } else if (usernameParam) {
        const lower = usernameParam.toLowerCase()
        for (const key of Object.keys(devGallery)) {
          const arr = devGallery[key] || []
          for (const it of arr) {
            if (typeof it.username === 'string' && it.username.toLowerCase() === lower) {
              items.push(it)
            }
          }
        }
        items.sort((a, b) => {
          const ta = a.created_at ? Date.parse(a.created_at) : 0
          const tb = b.created_at ? Date.parse(b.created_at) : 0
          return tb - ta
        })
      }
    }

    const start = (page - 1) * limit
    const end = start + limit
    const pageItems = items.slice(start, end)
    const hasMore = end < items.length
    return NextResponse.json({ page, limit, hasMore, nextPage: hasMore ? page + 1 : null, items: pageItems })
  } catch (e) {
    console.error('GET /api/users/[userId]/favorites error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = params.userId
    const username = (session.user as any)?.name || null
    const body = await request.json().catch(() => ({}))
    const postId: string = body?.postId
    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 })
    }

    // Try Supabase table first; if no assets or insert fails, fall back to dev file
    try {
      const { data: assets, error: assetsErr } = await supabaseAdmin
        .from('media_assets')
        .select('id, post_id, media_url, media_type, created_at, order_index')
        .eq('post_id', postId)

      if (assetsErr) throw assetsErr
      const hasAssets = Array.isArray(assets) && assets.length > 0
      if (hasAssets) {
        const rows = assets.map((a: any) => ({
          user_id: userId,
          asset_id: a.id,
          post_id: a.post_id,
          media_url: a.media_url,
          media_type: a.media_type,
        }))

        const { error: insertErr } = await supabaseAdmin
          .from('user_gallery')
          .insert(rows)

        if (insertErr) throw insertErr
        return NextResponse.json({ success: true, inserted: rows.length })
      }
      // If Supabase returned 0 assets, continue to dev fallback below
    } catch (e) {
      // Continue to dev fallback
    }

    // Dev fallback: read dev posts to resolve assets, then persist to local file
    {
      // Dev fallback: read dev posts to resolve assets, then persist to local file
      let devPosts = await readDevPosts()
      if (!devPosts || devPosts.length === 0) devPosts = devSamplePosts()
      const post = devPosts.find((p: any) => p.id === postId)
      const assets = Array.isArray(post?.assets) ? post!.assets : []
      const devMap = await readDevGallery()
      const arr = devMap[userId] || []
      const now = new Date().toISOString()
      for (const a of assets) {
        const exists = arr.some((x) => x.asset_id === (a.id || `${postId}-${a.media_url}`))
        if (!exists) {
          arr.push({
            asset_id: a.id || `${postId}-${a.media_url}`,
            post_id: postId,
            media_type: a.media_type,
            media_url: a.media_url,
            created_at: now,
            user_id: userId,
            username: username || undefined,
          })
        }
      }
      devMap[userId] = arr
      await writeDevGallery(devMap)
      return NextResponse.json({ success: true, inserted: assets.length, devFallback: true })
    }
  } catch (e) {
    console.error('POST /api/users/[userId]/favorites error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}