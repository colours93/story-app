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

    const { data: assignments, error } = await supabaseAdmin
      .from('story_assignments')
      .select('*')
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error in GET /api/admin/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user_id, story_id } = await request.json()

    if (!user_id || !story_id) {
      return NextResponse.json({ error: 'User ID and Story ID are required' }, { status: 400 })
    }

    // Check if assignment already exists
    const { data: existingAssignment } = await supabaseAdmin
      .from('story_assignments')
      .select('id')
      .eq('user_id', user_id)
      .eq('story_id', story_id)
      .single()

    if (existingAssignment) {
      return NextResponse.json({ error: 'Story already assigned to this user' }, { status: 400 })
    }

    const { data: newAssignment, error } = await supabaseAdmin
      .from('story_assignments')
      .insert({
        user_id,
        story_id
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
    }

    return NextResponse.json(newAssignment, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}