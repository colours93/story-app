import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

// GET: return current user's (or specific user's via query) bio text
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')

    let userId = requestedUserId
    if (!userId) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = session.user.id
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('bio')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // Gracefully handle missing column without breaking UI
      const msg = String(error.message || '').toLowerCase()
      if (msg.includes('column') && msg.includes('bio') && msg.includes('does not exist')) {
        return NextResponse.json({ bio: null })
      }
      console.error('Error fetching bio:', error)
      return NextResponse.json({ error: 'Failed to fetch bio' }, { status: 500 })
    }

    return NextResponse.json({ bio: data?.bio ?? null })
  } catch (e) {
    console.error('Error in GET /api/profile/bio:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: update current user's bio (max 250 chars)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bio } = await request.json()
    const sanitized = typeof bio === 'string' ? bio.trim() : ''
    if (sanitized.length > 250) {
      return NextResponse.json({ error: 'Bio exceeds 250 characters' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ bio: sanitized })
      .eq('id', session.user.id)

    if (error) {
      const msg = String(error.message || '').toLowerCase()
      if (msg.includes('column') && msg.includes('bio') && msg.includes('does not exist')) {
        return NextResponse.json({
          error: 'Bio column missing',
          hint: 'Add column with: ALTER TABLE public.users ADD COLUMN bio TEXT;'
        }, { status: 409 })
      }
      console.error('Error updating bio:', error)
      return NextResponse.json({ error: 'Failed to update bio' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error in POST /api/profile/bio:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}