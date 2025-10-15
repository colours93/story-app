import { NextResponse } from "next/server"

// Mocked membership counts to unblock UI without Supabase
export async function GET() {
  const counts = {
    free: 128,
    silver: 42,
    gold: 9,
  }
  return NextResponse.json({ counts })
}