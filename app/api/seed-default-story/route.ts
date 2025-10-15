import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { getAllChapters } from '@/lib/story-parser'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Seed the default story for a user
export async function POST(request: NextRequest) {
  try {
    // For testing purposes, allow requests without authentication
    const session = await getServerSession(authOptions)
    
    // Use a default user ID if no session exists (for testing)
    const userId = session?.user?.id || 'test-user-id'

    // Check if user already has stories
    const { data: existingStories, error: checkError } = await supabase
      .from('stories')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (checkError) {
      console.error('Check error:', checkError)
      return NextResponse.json({ error: 'Failed to check existing stories' }, { status: 500 })
    }

    if (existingStories && existingStories.length > 0) {
      return NextResponse.json({ message: 'User already has stories' }, { status: 200 })
    }

    // Get all chapters 1-10 from story.md file
    const storyFilePath = path.join(process.cwd(), 'story.md')
    const defaultStoryChapters = getAllChapters(storyFilePath)

    if (defaultStoryChapters.length === 0) {
      return NextResponse.json({ error: 'No chapters found in story file' }, { status: 500 })
    }

    // Create the default story with slug
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        title: "Dawn's Molten Journey - Complete Story",
        slug: "dawns-molten-journey-complete",
        description: "A captivating story of passion and discovery in Szeged - Complete story with all 10 chapters",
        user_id: userId,
        is_published: false
      })
      .select()
      .single()

    if (storyError) {
      console.error('Story creation error:', storyError)
      return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
    }

    // Create chapters from the story data
    const chaptersToInsert = defaultStoryChapters.map((chapter, index) => ({
      story_id: story.id,
      chapter_number: chapter.id,
      title: chapter.title,
      content: chapter.content,
      user_id: userId
    }))

    const { error: chaptersError } = await supabase
      .from('chapters')
      .insert(chaptersToInsert)

    if (chaptersError) {
      console.error('Chapters creation error:', chaptersError)
      return NextResponse.json({ error: 'Failed to create chapters' }, { status: 500 })
    }

    return NextResponse.json({ 
      story, 
      chaptersCount: chaptersToInsert.length,
      success: true 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}