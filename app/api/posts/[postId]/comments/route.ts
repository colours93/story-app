import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import fs from 'fs/promises'
import path from 'path'

const DEV_DIR = path.join(process.cwd(), 'supabase', '.temp')
const DEV_COMMENTS_FILE = path.join(DEV_DIR, 'dev_post_comments.json')

async function ensureDevDir() {
  try { await fs.mkdir(DEV_DIR, { recursive: true }) } catch {}
}

type Comment = { id: string; user_id: string; username: string; text: string; created_at: string }

async function readComments(): Promise<Record<string, Comment[]>> {
  try {
    const buf = await fs.readFile(DEV_COMMENTS_FILE, 'utf-8')
    const json = JSON.parse(buf)
    return json && typeof json === 'object' ? json : {}
  } catch {
    return {}
  }
}

async function writeComments(map: Record<string, Comment[]>) {
  await ensureDevDir()
  await fs.writeFile(DEV_COMMENTS_FILE, JSON.stringify(map, null, 2), 'utf-8')
}

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const postId = params.postId
  const comments = await readComments()
  const arr = (comments[postId] || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return NextResponse.json({ postId, comments: arr })
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const postId = params.postId
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id || 'test-user-id'
    const username = (session?.user as any)?.name || 'devuser'
    const body = await request.json()
    const text = (body?.text || '').toString().trim()
    if (!text) return NextResponse.json({ error: 'Missing comment text' }, { status: 400 })

    const comments = await readComments()
    const arr: Comment[] = comments[postId] || []
    const newComment: Comment = {
      id: `${postId}-${Date.now()}`,
      user_id: userId,
      username,
      text,
      created_at: new Date().toISOString(),
    }
    arr.push(newComment)
    comments[postId] = arr
    await writeComments(comments)
    return NextResponse.json({ ok: true, comment: newComment })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}