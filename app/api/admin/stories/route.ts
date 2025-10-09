import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: stories, error } = await supabaseAdmin
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching stories:', error)
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
    }

    return NextResponse.json(stories)
  } catch (error) {
    console.error('Error in GET /api/admin/stories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content, image_url } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data: newStory, error } = await supabaseAdmin
      .from('stories')
      .insert({
        title,
        content,
        image_url: image_url || null
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating story:', error)
      return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
    }

    return NextResponse.json(newStory, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/stories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}