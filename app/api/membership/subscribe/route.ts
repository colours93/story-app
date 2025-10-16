import { NextResponse } from "next/server"

// Mocked subscribe endpoint to simulate tier selection without Supabase
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const tier_id = body?.tier_id
    if (!tier_id || typeof tier_id !== "string") {
      return NextResponse.json({ error: "Missing or invalid tier_id" }, { status: 400 })
    }
    // Simulate some processing time
    await new Promise((r) => setTimeout(r, 400))
    // Dev: set a cookie to reflect the chosen tier for downstream UI
    // We map known mocked ids to slugs expected by the feed and UI
    let devTierSlug = 'free'
    if (tier_id.includes('silver')) devTierSlug = 'silver'
    else if (tier_id.includes('gold')) devTierSlug = 'gold'

    const res = NextResponse.json({ ok: true, tier_id, devTierSlug })
    // Cookie lives for ~30 days in development
    res.cookies.set('devTierId', devTierSlug, { path: '/', maxAge: 60 * 60 * 24 * 30 })
    return res
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}