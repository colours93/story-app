import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists (by username or email)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, username, email')
      .or(`username.eq.${username},email.eq.${email}`)
      .single()

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        )
      }
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        )
      }
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user in Supabase
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          username,
          email,
          password_hash: hashedPassword,
          role: 'user', // Default role for new users
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Return success (don't include sensitive data)
    return NextResponse.json(
      {
        message: 'User account created successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}