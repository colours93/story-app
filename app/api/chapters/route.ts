import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Create a new chapter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storyId, chapterNumber, title, content } = await request.json()

    if (!storyId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the story belongs to the user
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', storyId)
      .eq('user_id', session.user.id)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const { data: chapter, error } = await supabase
      .from('chapters')
      .insert({
        story_id: storyId,
        chapter_number: chapterNumber,
        title,
        content,
        user_id: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 })
    }

    return NextResponse.json({ chapter, success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}