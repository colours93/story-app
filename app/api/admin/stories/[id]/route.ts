import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storyId = params.id

    // Delete story assignments first
    await supabaseAdmin
      .from('story_assignments')
      .delete()
      .eq('story_id', storyId)

    // Delete story
    const { error } = await supabaseAdmin
      .from('stories')
      .delete()
      .eq('id', storyId)

    if (error) {
      console.error('Error deleting story:', error)
      return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Story deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/stories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}