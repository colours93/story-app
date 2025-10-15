import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Update chapters to have proper user_id
export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Update all chapters with null user_id to have the provided user_id
    const { data, error } = await supabase
      .from('chapters')
      .update({ user_id })
      .is('user_id', null)
      .select()
      
    console.log('Update result:', { data, error, user_id })

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update chapters' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Chapters updated successfully',
      updated_count: data?.length || 0,
      chapters: data
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}