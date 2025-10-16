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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50)
    const adminViewTier = (searchParams.get('viewTier') || '').toLowerCase()
    const typeFilter = (searchParams.get('type') || 'all').toLowerCase() as 'all' | 'image' | 'video'
    const q = (searchParams.get('q') || '').toLowerCase().trim()
    const isAdmin = session?.user?.role === 'admin'

    // For testing, allow a default user id
    const userId = (session?.user as any)?.id || 'test-user-id'

    // Determine the user's subscription tier rank
    let userTierRank = 0
    let userTierId: string | null = null
    // Dev cookie fallback for chosen tier
    const devTierCookie = request.cookies.get('devTierId')?.value || null
    const { data: sub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('tier_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)

    if (sub && sub.length > 0 && sub[0].tier_id) {
      userTierId = sub[0].tier_id as string
      const { data: tier } = await supabaseAdmin
        .from('membership_tiers')
        .select('rank')
        .eq('id', userTierId)
        .limit(1)
      if (tier && tier.length > 0 && typeof tier[0].rank === 'number') {
        userTierRank = tier[0].rank as number
      }
    } else if (devTierCookie) {
      // Fallback: map known tiers to ranks
      const fallbackRanks: Record<string, number> = { free: 0, silver: 1, gold: 2 }
      userTierId = devTierCookie
      userTierRank = fallbackRanks[devTierCookie] ?? 0
    }

    // Admin override: explicitly view a tier feed (ignores follows)
    if (isAdmin && (adminViewTier === 'free' || adminViewTier === 'silver' || adminViewTier === 'gold')) {
      userTierId = adminViewTier
      const fallbackRanks: Record<string, number> = { free: 0, silver: 1, gold: 2 }
      userTierRank = fallbackRanks[adminViewTier]
    }

    // Who does the user follow? Skip in admin tier view
    let followedIds: string[] = []
    if (!isAdmin || !adminViewTier) {
      const { data: follows } = await supabaseAdmin
        .from('user_follows')
        .select('followed_id')
        .eq('follower_id', userId)
      followedIds = (follows || []).map((f: any) => f.followed_id)
    }

    // Fetch candidate posts (published), newest first
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('media_posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(200) // fetch a chunk to filter client-side

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      // Dev fallback: use locally persisted admin media posts if any
      const devPosts = await readDevPosts()
      if (devPosts.length > 0) {
        // Map ranks for gating
        const rankByTierId: Record<string, number> = { free: 0, silver: 1, gold: 2 }
        let filtered = devPosts
          .filter((p: any) => Boolean(p.is_published))

        // Text search filter
        if (q) {
          filtered = filtered.filter((p: any) => {
            const t = (p.title || '').toLowerCase()
            const b = (p.body || '').toLowerCase()
            return t.includes(q) || b.includes(q)
          })
        }

        // Media type filter
        if (typeFilter === 'image' || typeFilter === 'video') {
          filtered = filtered.filter((p: any) => Array.isArray(p.assets) && p.assets.some((a: any) => a.media_type === typeFilter))
        }

        // Add can_view flag per post
        const combined = filtered.map((p: any) => {
          const requiredRank = p.required_tier_id ? (rankByTierId[p.required_tier_id] ?? 0) : 0
          const canView = requiredRank <= userTierRank
          return { ...p, can_view: canView }
        })

        const start = (page - 1) * limit
        const end = start + limit
        const pagePosts = combined.slice(start, end)
        const hasMore = end < combined.length

        return NextResponse.json({
          page,
          limit,
          hasMore,
          nextPage: hasMore ? page + 1 : null,
          posts: pagePosts,
          devFallback: true,
          userTierId,
        })
      }

      // If no dev posts, return sample
      const sample = [
        {
          id: 'sample-1', user_id: 'creator-1', title: 'Sunset Run', body: 'New set from today', price_cents: 499, created_at: new Date().toISOString(),
          required_tier_id: null,
          assets: [
            { id: 'asset-1', post_id: 'sample-1', media_url: '/chapter-1.jpg', media_type: 'image' }
          ]
        },
        {
          id: 'sample-2', user_id: 'creator-2', title: 'Behind the scenes', body: 'Short clip', price_cents: 999, created_at: new Date().toISOString(),
          required_tier_id: null,
          assets: [
            { id: 'asset-2', post_id: 'sample-2', media_url: 'https://www.w3schools.com/html/mov_bbb.mp4', media_type: 'video' }
          ]
        }
      ]
      return NextResponse.json({ page, limit, hasMore: false, nextPage: null, posts: sample, devFallback: true, userTierId })
    }

    // Fetch all tiers to map ranks
    const { data: tiers } = await supabaseAdmin
      .from('membership_tiers')
      .select('id, rank')

    const rankByTierId: Record<string, number> = {}
    for (const t of (tiers || [])) {
      if (t.id) rankByTierId[t.id as string] = (t.rank as number) ?? 0
    }

    // Filter posts to followed creators only; include all tiers but mark can_view
    const filtered = (posts || []).filter((p: any) => {
      const okFollow = (isAdmin && !!adminViewTier) ? true : (followedIds.length === 0 ? true : followedIds.includes(p.user_id))
      return okFollow
    })

    // Load media for filtered posts before pagination to support type/search filters
    const start = (page - 1) * limit
    const end = start + limit
    const postIds = filtered.map((p: any) => p.id)
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

    // Combine assets
    let combined = filtered.map((p: any) => {
      const requiredRank = p.required_tier_id ? (rankByTierId[p.required_tier_id] ?? 0) : 0
      const canView = requiredRank <= userTierRank
      return { ...p, assets: assetsByPost[p.id] || [], can_view: canView }
    })

    // Apply text search
    if (q) {
      combined = combined.filter((p: any) => {
        const t = (p.title || '').toLowerCase()
        const b = (p.body || '').toLowerCase()
        return t.includes(q) || b.includes(q)
      })
    }

    // Apply media type filter
    if (typeFilter === 'image' || typeFilter === 'video') {
      combined = combined.filter((p: any) => (p.assets || []).some((a: any) => a.media_type === typeFilter))
    }

    // Pagination on filtered+combined results
    const pagePosts = combined.slice(start, end)

    const hasMore = end < combined.length
    return NextResponse.json({
      page,
      limit,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      posts: pagePosts,
      userTierId,
    })
  } catch (e) {
    console.error('GET /api/feed error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}