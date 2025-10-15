import { createClient } from '@supabase/supabase-js'

// Lazily create clients to avoid import-time crashes when envs are missing.
// This prevents unrelated routes (like NextAuth session/csrf) from failing with HTML errors.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

function createMissingEnvProxy(name: string) {
  // Lightweight proxy that throws a clear error only when actually used
  return new Proxy({}, {
    get() {
      throw new Error(
        `Supabase client "${name}" is not configured. Missing environment variables.`
      )
    }
  }) as any
}

// Frontend client (anon key)
export const supabase = (url && anon)
  ? createClient(url, anon)
  : createMissingEnvProxy('anon')

// Admin client for backend operations (service role key)
export const supabaseAdmin = (url && service)
  ? createClient(url, service, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createMissingEnvProxy('admin')

// Database types
export interface User {
  id: string
  username: string
  password_hash: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  title: string
  slug: string
  description: string | null
  content: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoryAssignment {
  id: string
  user_id: string
  story_id: string
  assigned_at: string
}