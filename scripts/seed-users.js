const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Initialize Supabase client
const supabaseUrl = 'https://pttgtnvtdvcdomretmph.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dGd0bnZ0ZHZjZG9tcmV0bXBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxOTA5MywiZXhwIjoyMDY4Nzk1MDkzfQ.Lt89rK3Cy3W3h0h4L0ufQjWDB_QidLLe421_fEiyVPk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedUsers() {
  try {
    console.log('Starting user seeding...')

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 12)
    const userPasswordHash = await bcrypt.hash('password123', 12)

    // Check if users already exist
    const { data: existingUsers } = await supabase
      .from('users')
      .select('username')
      .in('username', ['admin', 'testuser'])

    if (existingUsers && existingUsers.length > 0) {
      console.log('Users already exist, deleting them first...')
      await supabase
        .from('users')
        .delete()
        .in('username', ['admin', 'testuser'])
    }

    // Insert test users
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: 'admin',
          password_hash: adminPasswordHash,
          role: 'admin'
        },
        {
          username: 'testuser',
          password_hash: userPasswordHash,
          role: 'user'
        }
      ])
      .select()

    if (error) {
      console.error('Error inserting users:', error)
      return
    }

    console.log('Users seeded successfully:', data)
    
    // Verify users were created
    const { data: verifyUsers } = await supabase
      .from('users')
      .select('username, role')
      .in('username', ['admin', 'testuser'])

    console.log('Verification - Users in database:', verifyUsers)

  } catch (error) {
    console.error('Error seeding users:', error)
  }
}

seedUsers()