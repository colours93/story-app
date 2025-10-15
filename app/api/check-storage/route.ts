import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const results: any = {
    bucket: { exists: false, details: null, error: null },
    table: { exists: false, error: null },
    upload: { success: false, error: null },
  }

  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      results.bucket.error = bucketsError.message
    } else {
      const storyImagesBucket = buckets?.find(b => b.id === 'story-images')
      results.bucket.exists = !!storyImagesBucket
      results.bucket.details = storyImagesBucket || null
      results.bucket.allBuckets = buckets?.map(b => b.id) || []
    }

    // Check table existence
    const { error: tableError } = await supabaseAdmin
      .from('site_gallery_images')
      .select('count')
      .limit(1)

    if (tableError) {
      results.table.error = tableError.message
    } else {
      results.table.exists = true
    }

    // Test upload if bucket exists
    if (results.bucket.exists) {
      const testFileName = `test-${Date.now()}.txt`
      const testContent = 'test content'
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('story-images')
        .upload(testFileName, testContent, {
          contentType: 'text/plain',
          upsert: false
        })

      if (uploadError) {
        results.upload.error = uploadError.message
      } else {
        results.upload.success = true
        results.upload.path = uploadData.path
        
        // Clean up test file
        await supabaseAdmin.storage.from('story-images').remove([testFileName])
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({
      error: 'Check failed',
      message: error?.message || String(error),
      results
    }, { status: 500 })
  }
}
