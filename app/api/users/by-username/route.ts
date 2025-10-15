import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Public endpoint: look up a user by username and return basic info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role, created_at')
      .eq('username', username)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user by username:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (e) {
    console.error('Error in GET /api/users/by-username:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}