import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import fs from 'fs/promises'
import path from 'path'

const DEV_DIR = path.join(process.cwd(), 'supabase', '.temp')
const DEV_LIKES_FILE = path.join(DEV_DIR, 'dev_post_likes.json')

async function ensureDevDir() {
  try { await fs.mkdir(DEV_DIR, { recursive: true }) } catch {}
}

async function readLikes(): Promise<Record<string, Array<{ user_id: string; username: string }>>> {
  try {
    const buf = await fs.readFile(DEV_LIKES_FILE, 'utf-8')
    const json = JSON.parse(buf)
    return json && typeof json === 'object' ? json : {}
  } catch {
    return {}
  }
}

async function writeLikes(map: Record<string, Array<{ user_id: string; username: string }>>) {
  await ensureDevDir()
  await fs.writeFile(DEV_LIKES_FILE, JSON.stringify(map, null, 2), 'utf-8')
}

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const postId = params.postId
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id || 'test-user-id'
  const username = (session?.user as any)?.name || 'devuser'

  const likes = await readLikes()
  const arr = likes[postId] || []
  const likedByUser = arr.some((e) => e.user_id === userId)
  const count = arr.length
  return NextResponse.json({ postId, count, likedByUser, users: arr })
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const postId = params.postId
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id || 'test-user-id'
    const username = (session?.user as any)?.name || 'devuser'

    const likes = await readLikes()
    const arr = likes[postId] || []
    const idx = arr.findIndex((e) => e.user_id === userId)
    if (idx >= 0) {
      arr.splice(idx, 1) // unlike
    } else {
      arr.push({ user_id: userId, username })
    }
    likes[postId] = arr
    await writeLikes(likes)
    return NextResponse.json({ postId, count: arr.length, likedByUser: idx < 0 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}