import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for frontend (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for backend operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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