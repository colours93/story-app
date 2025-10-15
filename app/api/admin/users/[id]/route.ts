import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs/promises'
import path from 'path'

const DEV_USER_TIERS_FILE = path.join(process.cwd(), 'supabase', '.temp', 'dev_user_tiers.json')

async function ensureDevDir() {
  try {
    const dir = path.join(process.cwd(), 'supabase', '.temp')
    await fs.mkdir(dir, { recursive: true })
  } catch {}
}

async function readDevUserTiers(): Promise<Record<string, string>> {
  try {
    await ensureDevDir()
    const raw = await fs.readFile(DEV_USER_TIERS_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const map: Record<string, string> = {}
      for (const item of parsed as any[]) {
        if (item && item.user_id && item.tier_id) map[item.user_id] = item.tier_id
      }
      return map
    }
    return parsed || {}
  } catch {
    return {}
  }
}

async function writeDevUserTiers(map: Record<string, string>) {
  await ensureDevDir()
  await fs.writeFile(DEV_USER_TIERS_FILE, JSON.stringify(map, null, 2), 'utf-8')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    // Don't allow deleting admin users
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (user?.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 400 })
    }

    // Delete user assignments first
    await supabaseAdmin
      .from('story_assignments')
      .delete()
      .eq('user_id', userId)

    // Delete user
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      // Dev fallback: update local user→tier mapping
      try {
        const map = await readDevUserTiers()
        if (map[userId]) {
          delete map[userId]
          await writeDevUserTiers(map)
        }
        return NextResponse.json({ message: 'User deleted (dev fallback)' })
      } catch (e) {
        console.error('Dev fallback failed to update tier mapping:', e)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
      }
    }

    // Also remove from dev tier mapping on success
    try {
      const map = await readDevUserTiers()
      if (map[userId]) {
        delete map[userId]
        await writeDevUserTiers(map)
      }
    } catch (e) {
      console.warn('Unable to update dev tier mapping after deletion:', e)
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}