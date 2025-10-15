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
    return NextResponse.json({ ok: true, tier_id })
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}