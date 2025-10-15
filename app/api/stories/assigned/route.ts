import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

// Return assigned stories for the current user, including chapters, with a uniform shape
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin: return all stories with chapters
    if ((session.user as any)?.role === 'admin') {
      const { data: stories, error } = await supabaseAdmin
        .from('stories')
        .select(`
          id,
          title,
          description,
          cover_image_url,
          is_published,
          created_at,
          updated_at,
          chapters (
            id,
            chapter_number,
            title,
            content,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all stories:', error)
        return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
      }

      return NextResponse.json({ stories: stories || [] })
    }

    // Regular users: return only stories assigned to them, with chapters
    const { data: assignedStories, error } = await supabaseAdmin
      .from('story_assignments')
      .select(`
        story_id,
        stories (
          id,
          title,
          description,
          cover_image_url,
          is_published,
          created_at,
          updated_at,
          chapters (
            id,
            chapter_number,
            title,
            content,
            created_at,
            updated_at
          )
        )
      `)
      .eq('user_id', (session.user as any)?.id)

    if (error) {
      console.error('Error fetching assigned stories:', error)
      return NextResponse.json({ error: 'Failed to fetch assigned stories' }, { status: 500 })
    }

    const stories = (assignedStories || [])
      .map((assignment: any) => assignment.stories)
      .filter(Boolean)

    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Error in GET /api/stories/assigned:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}