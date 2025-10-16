import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import fs from 'fs/promises'
import path from 'path'

const DEV_DIR = path.join(process.cwd(), 'supabase', '.temp')
const DEV_PURCHASES_FILE = path.join(DEV_DIR, 'dev_post_purchases.json')

async function ensureDevDir() {
  try { await fs.mkdir(DEV_DIR, { recursive: true }) } catch {}
}

async function readPurchases(): Promise<Record<string, string[]>> {
  try {
    const buf = await fs.readFile(DEV_PURCHASES_FILE, 'utf-8')
    const json = JSON.parse(buf)
    return json && typeof json === 'object' ? json : {}
  } catch {
    return {}
  }
}

async function writePurchases(map: Record<string, string[]>) {
  await ensureDevDir()
  await fs.writeFile(DEV_PURCHASES_FILE, JSON.stringify(map, null, 2), 'utf-8')
}

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const postId = params.postId
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id || 'test-user-id'
  const purchases = await readPurchases()
  const arr = purchases[postId] || []
  const purchased = arr.includes(userId)
  return NextResponse.json({ postId, purchased })
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const postId = params.postId
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id || 'test-user-id'

    const purchases = await readPurchases()
    const arr = purchases[postId] || []
    if (!arr.includes(userId)) arr.push(userId)
    purchases[postId] = arr
    await writePurchases(purchases)
    return NextResponse.json({ postId, purchased: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 })
  }
}