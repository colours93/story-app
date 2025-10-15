import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'

// GET: return current user's (or specific user's via query) latest profile image URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')

    // If userId is provided, allow public access (avatars are stored in a public bucket)
    // Otherwise, require session and default to the current user
    let userId = requestedUserId
    if (!userId) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = session.user.id
    }

    const folder = `profile-images/${userId}`

    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('story-images')
      .list(folder)

    if (listError) {
      console.error('Error listing profile image:', listError)
      return NextResponse.json({ imageUrl: null })
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ imageUrl: null })
    }

    // Pick the latest by updated_at (fallback to created_at)
    const latest = [...files]
      .filter(f => f.name.startsWith('avatar'))
      .sort((a, b) => {
        const au = new Date(a.updated_at ?? a.created_at ?? 0).getTime()
        const bu = new Date(b.updated_at ?? b.created_at ?? 0).getTime()
        return bu - au
      })[0]

    if (!latest) {
      return NextResponse.json({ imageUrl: null })
    }

    const path = `${folder}/${latest.name}`
    const { data: publicUrlData } = await supabaseAdmin.storage
      .from('story-images')
      .getPublicUrl(path)

    return NextResponse.json({ imageUrl: publicUrlData.publicUrl || null })
  } catch (e) {
    console.error('Error in GET /api/profile/image:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: upload a new profile image for the current user (versioned filename)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const userId = session.user.id
    const folder = `profile-images/${userId}`

    // Use a unique, versioned filename to avoid CDN cache and allow multiple changes
    const ext = (file.type?.split('/')[1] || 'png').toLowerCase()
    const stamp = Date.now()
    const fileName = `avatar-${stamp}.${ext}`
    const path = `${folder}/${fileName}`
    const arrayBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('story-images')
      .upload(path, fileBytes, {
        contentType: file.type || 'image/png',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { data: publicUrlData } = await supabaseAdmin.storage
      .from('story-images')
      .getPublicUrl(path)

    return NextResponse.json({ imageUrl: publicUrlData.publicUrl })
  } catch (e) {
    console.error('Error in POST /api/profile/image:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}