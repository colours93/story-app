import { NextResponse } from "next/server"

// Mocked membership tiers to allow UI development without Supabase
export async function GET() {
  const tiers = [
    {
      id: "tier_free",
      name: "Free",
      rank: 1,
      monthly_price_cents: 0,
      description: "Basic access to selected content and updates.",
    },
    {
      id: "tier_silver",
      name: "Silver",
      rank: 2,
      monthly_price_cents: 499,
      description: "More posts, behind-the-scenes, and early previews.",
    },
    {
      id: "tier_gold",
      name: "Gold",
      rank: 3,
      monthly_price_cents: 1299,
      description: "All-access, premium drops, and special surprises.",
    },
  ]

  return NextResponse.json({ tiers })
}