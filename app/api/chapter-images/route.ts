import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch chapter images
// If `storyId` is provided, fetch images for all chapters in that story.
// Otherwise, fetch images scoped to the current user.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get('storyId')

    let data: any[] | null = null
    let error: any = null

    if (storyId) {
      // Fetch all chapters for the story
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id')
        .eq('story_id', storyId)

      if (chaptersError) {
        console.error('Error fetching chapters for storyId:', chaptersError)
        return NextResponse.json({ imagesByChapter: {} })
      }

      const chapterIds = (chapters || []).map((c: any) => c.id)
      if (chapterIds.length === 0) {
        return NextResponse.json({ imagesByChapter: {} })
      }

      const { data: imageRows, error: imagesError } = await supabase
        .from('chapter_images')
        .select('*')
        .in('chapter_id', chapterIds)
        .order('chapter_id', { ascending: true })

      data = imageRows || []
      error = imagesError || null
    } else {
      // For testing purposes, allow requests without authentication
      const userId = session?.user?.id || 'test-user-id'

      const { data: imageRows, error: userImagesError } = await supabase
        .from('chapter_images')
        .select('*')
        .eq('user_id', userId)
        .order('chapter_id', { ascending: true })

      data = imageRows || []
      error = userImagesError || null
    }

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    // Group images by chapter_id
    const imagesByChapter = (data || []).reduce((acc, image) => {
      if (!acc[image.chapter_id]) {
        acc[image.chapter_id] = []
      }
      acc[image.chapter_id].push(image.image_url)
      return acc
    }, {} as Record<number, string[]>)

    return NextResponse.json({ imagesByChapter })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save chapter image to database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chapterId, imageUrl, imagePath } = await request.json()

    if (!chapterId || !imageUrl || !imagePath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('chapter_images')
      .insert({
        chapter_id: chapterId,
        image_url: imageUrl,
        image_path: imagePath,
        user_id: session.user.id
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save image' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove chapter image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('imageUrl')

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('chapter_images')
      .delete()
      .eq('image_url', imageUrl)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}