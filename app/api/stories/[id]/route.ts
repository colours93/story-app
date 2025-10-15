import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch a specific story with chapters
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: story, error } = await supabase
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
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Sort chapters by chapter_number
    if (story.chapters) {
      story.chapters.sort((a: any, b: any) => a.chapter_number - b.chapter_number)
    }

    return NextResponse.json({ story })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a story
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, coverImageUrl, isPublished } = await request.json()

    const { data: story, error } = await supabase
      .from('stories')
      .update({
        title,
        description,
        cover_image_url: coverImageUrl,
        is_published: isPublished
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update story' }, { status: 500 })
    }

    return NextResponse.json({ story, success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a story
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}