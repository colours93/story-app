import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkStorageSetup() {
  console.log('🔍 Checking Supabase Storage Setup...\n')

  // Check if bucket exists
  console.log('1. Checking if "story-images" bucket exists...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError)
    return
  }

  const storyImagesBucket = buckets?.find(b => b.id === 'story-images')
  if (storyImagesBucket) {
    console.log('✅ Bucket "story-images" exists!')
    console.log('   Public:', storyImagesBucket.public)
    console.log('   Created:', storyImagesBucket.created_at)
  } else {
    console.log('❌ Bucket "story-images" does NOT exist!')
    console.log('   Available buckets:', buckets?.map(b => b.id).join(', ') || 'none')
    console.log('\n📝 To create the bucket, run this SQL in Supabase SQL Editor:')
    console.log(`
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-images', 'story-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
    `)
  }

  // Check table existence
  console.log('\n2. Checking if "site_gallery_images" table exists...')
  const { data: tableData, error: tableError } = await supabase
    .from('site_gallery_images')
    .select('count')
    .limit(1)

  if (tableError) {
    console.error('❌ Table "site_gallery_images" error:', tableError.message)
    if (tableError.message.includes('does not exist')) {
      console.log('\n📝 To create the table, run the migration file:')
      console.log('   supabase/migrations/20251014120000_setup_gallery_storage.sql')
    }
  } else {
    console.log('✅ Table "site_gallery_images" exists!')
  }

  // Test upload permission
  console.log('\n3. Testing upload capability...')
  const testFileName = `test-${Date.now()}.txt`
  const testContent = 'test content'
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('story-images')
    .upload(testFileName, testContent, {
      contentType: 'text/plain',
      upsert: false
    })

  if (uploadError) {
    console.error('❌ Upload test failed:', uploadError)
    console.log('\n💡 Possible issues:')
    console.log('   - Bucket might not exist')
    console.log('   - Storage policies might not be set up')
    console.log('   - Service role key might be invalid')
  } else {
    console.log('✅ Upload test successful!')
    console.log('   Path:', uploadData.path)
    
    // Clean up test file
    await supabase.storage.from('story-images').remove([testFileName])
    console.log('   (Test file cleaned up)')
  }

  console.log('\n✨ Check complete!')
}

checkStorageSetup().catch(console.error)
