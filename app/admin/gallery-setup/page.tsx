"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Copy, Database, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function GallerySetupPage() {
  const [status, setStatus] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const { toast } = useToast()

  const checkStatus = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/check-storage')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Check failed:', error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const copySQL = () => {
    const sql = `-- Create site_gallery_images table
CREATE TABLE IF NOT EXISTS public.site_gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  order_index INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_gallery_images_order 
ON public.site_gallery_images(order_index);

CREATE INDEX IF NOT EXISTS idx_site_gallery_images_uploaded_by 
ON public.site_gallery_images(uploaded_by);

-- Enable Row Level Security
ALTER TABLE public.site_gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
DROP POLICY IF EXISTS "Allow public read access" ON public.site_gallery_images;
CREATE POLICY "Allow public read access" ON public.site_gallery_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to insert" ON public.site_gallery_images
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to update" ON public.site_gallery_images
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to delete" ON public.site_gallery_images
  FOR DELETE USING (true);`

    navigator.clipboard.writeText(sql)
    toast({ title: "Copied!", description: "SQL copied to clipboard" })
  }

  const isReady = status?.bucket?.exists && status?.table?.exists && status?.upload?.success

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="border-2 border-pink-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Database className="h-6 w-6 text-pink-600" />
                  Site Gallery Setup
                </CardTitle>
                <CardDescription className="mt-2">
                  Check and fix your gallery storage configuration
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={checkStatus}
                disabled={checking}
              >
                {checking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Overview */}
            {status && (
              <div className="space-y-4">
                <Alert variant={isReady ? "default" : "destructive"}>
                  <AlertDescription className="flex items-center gap-2">
                    {isReady ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Everything is set up! You can now upload images.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        <span className="font-semibold">Setup incomplete. Follow the instructions below.</span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Detailed Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    {status.bucket?.exists ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium">Storage Bucket</div>
                      <div className="text-sm text-muted-foreground">
                        {status.bucket?.exists ? (
                          <>Bucket "story-images" is ready and public</>
                        ) : (
                          <>Bucket "story-images" not found</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    {status.table?.exists ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium">Database Table</div>
                      <div className="text-sm text-muted-foreground">
                        {status.table?.exists ? (
                          <>Table "site_gallery_images" exists</>
                        ) : (
                          <>Table "site_gallery_images" missing - action required</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    {status.upload?.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium">Upload Test</div>
                      <div className="text-sm text-muted-foreground">
                        {status.upload?.success ? (
                          <>File upload is working</>
                        ) : (
                          <>Upload test failed</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Setup Instructions */}
            {status && !status.table?.exists && (
              <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Database className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-amber-900">Action Required: Create Database Table</h3>
                      <p className="text-sm text-amber-800 mt-1">
                        The site_gallery_images table needs to be created in your Supabase database.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium text-amber-900">Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                        <li>Open your <a href="https://app.supabase.com/project/pttgtnvtdvcdomretmph/editor" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a></li>
                        <li>Go to SQL Editor (left sidebar)</li>
                        <li>Click "New Query"</li>
                        <li>Copy the SQL below and paste it</li>
                        <li>Click "Run" (or press Cmd/Ctrl + Enter)</li>
                        <li>Come back here and click "Refresh"</li>
                      </ol>
                    </div>

                    <div className="mt-4">
                      <Button
                        onClick={copySQL}
                        variant="outline"
                        size="sm"
                        className="bg-white"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy SQL to Clipboard
                      </Button>
                    </div>

                    <div className="mt-4 p-3 bg-white border border-amber-300 rounded font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre">{`-- Create site_gallery_images table
CREATE TABLE IF NOT EXISTS public.site_gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  order_index INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_site_gallery_images_order 
ON public.site_gallery_images(order_index);

CREATE INDEX IF NOT EXISTS idx_site_gallery_images_uploaded_by 
ON public.site_gallery_images(uploaded_by);

-- Enable RLS
ALTER TABLE public.site_gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public read access" ON public.site_gallery_images;
CREATE POLICY "Allow public read access" ON public.site_gallery_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to insert" ON public.site_gallery_images
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to update" ON public.site_gallery_images
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.site_gallery_images;
CREATE POLICY "Allow authenticated users to delete" ON public.site_gallery_images
  FOR DELETE USING (true);`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success - Next Steps */}
            {isReady && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Your gallery is ready! You can now upload images.
                  </AlertDescription>
                </Alert>
                <Link href="/admin/gallery">
                  <Button className="w-full bg-pink-600 hover:bg-pink-700">
                    Go to Gallery Manager
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
