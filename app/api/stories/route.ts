import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - Fetch all stories for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For testing purposes, allow requests without authentication
    const userId = session?.user?.id || 'test-user-id'
    
    console.log('API: Using user ID:', userId) // Debug log

    // Use RPC function to get stories with chapters
    const { data: storiesData, error } = await supabase
      .rpc('get_user_stories_with_chapters', { p_user_id: userId })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
    }

    console.log('Raw RPC response:', JSON.stringify(storiesData, null, 2))

    // Transform the data to match expected format
    const stories = storiesData?.map((story: any) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      cover_image_url: story.cover_image_url,
      is_published: story.is_published,
      user_id: userId,
      created_at: story.created_at,
      updated_at: story.updated_at,
      chapters: Array.isArray(story.chapters) ? story.chapters : []
    })) || []

    console.log('API: Stories fetched:', stories?.length)
    if (stories && stories.length > 0) {
      console.log('API: First story chapters count:', stories[0].chapters?.length)
    }

    return NextResponse.json({ stories })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new story
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, coverImageUrl, chapters } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        title,
        description: description || '',
        cover_image_url: coverImageUrl,
        user_id: session.user.id,
        is_published: false
      })
      .select()
      .single()

    if (storyError) {
      console.error('Story creation error:', storyError)
      return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
    }

    // Create chapters if provided
    if (chapters && chapters.length > 0) {
      const chaptersToInsert = chapters.map((chapter: any, index: number) => ({
        story_id: story.id,
        chapter_number: index + 1,
        title: chapter.title,
        content: chapter.content,
        user_id: session.user.id
      }))

      const { error: chaptersError } = await supabase
        .from('chapters')
        .insert(chaptersToInsert)

      if (chaptersError) {
        console.error('Chapters creation error:', chaptersError)
        // Don't fail the entire request, just log the error
      }
    }

    return NextResponse.json({ story, success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}