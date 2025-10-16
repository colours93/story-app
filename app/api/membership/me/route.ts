import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { supabaseAdmin } from "@/lib/supabase"

// Returns the current user's membership tier information.
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(req.url)
    const cookieTier = (url.searchParams.get('cookieTier') || '').toLowerCase()
    const devCookie = cookies().get('devTierId')?.value || null

    const userId = (session?.user as any)?.id || null

    let tierSlug: 'free' | 'silver' | 'gold' | null = null
    let tierRank = 0
    let tierName = 'Free'

    // Try database subscription first
    if (userId) {
      const { data: sub } = await supabaseAdmin
        .from('user_subscriptions')
        .select('tier_id, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)

      const tierId = sub && sub.length > 0 ? (sub[0].tier_id as string | null) : null
      if (tierId) {
        const { data: tier } = await supabaseAdmin
          .from('membership_tiers')
          .select('id, name, rank, slug')
          .eq('id', tierId)
          .limit(1)

        const t = tier && tier.length > 0 ? tier[0] : null
        if (t) {
          tierSlug = ((t.slug as string) || (t.name as string)?.toLowerCase()) as any
          tierRank = (t.rank as number) ?? 0
          tierName = (t.name as string) || tierName
        }
      }
    }

    // Dev cookie fallback
    if (!tierSlug) {
      const fallback = (cookieTier || devCookie || '').toLowerCase()
      if (fallback === 'silver') { tierSlug = 'silver'; tierRank = 1; tierName = 'Silver' }
      else if (fallback === 'gold') { tierSlug = 'gold'; tierRank = 2; tierName = 'Gold' }
      else { tierSlug = 'free'; tierRank = 0; tierName = 'Free' }
    }

    return NextResponse.json({
      tier: {
        slug: tierSlug,
        name: tierName,
        rank: tierRank,
      }
    })
  } catch (e) {
    return NextResponse.json({ tier: { slug: 'free', name: 'Free', rank: 0 } })
  }
}