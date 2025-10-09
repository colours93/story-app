import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin can see all stories
    if (session.user.role === 'admin') {
      const { data: stories, error } = await supabaseAdmin
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all stories:', error)
        return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
      }

      return NextResponse.json(stories)
    }

    // Regular users can only see assigned stories
    const { data: assignedStories, error } = await supabaseAdmin
      .from('story_assignments')
      .select(`
        story_id,
        stories (
          id,
          title,
          content,
          image_url,
          created_at
        )
      `)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error fetching assigned stories:', error)
      return NextResponse.json({ error: 'Failed to fetch assigned stories' }, { status: 500 })
    }

    // Extract stories from the join result
    const stories = assignedStories.map(assignment => assignment.stories).filter(Boolean)

    return NextResponse.json(stories)
  } catch (error) {
    console.error('Error in GET /api/stories/assigned:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}