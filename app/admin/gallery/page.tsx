"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Upload, Image as ImageIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SiteGalleryAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [siteImages, setSiteImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }
    if (session.user.role !== 'admin') { router.push('/'); return }
    fetchSiteGallery()
  }, [session, status, router])

  const fetchSiteGallery = async () => {
    try {
      const res = await fetch('/api/site-gallery')
      if (!res.ok) return
      const { images } = await res.json()
      setSiteImages(images || [])
    } catch {}
  }

  const uploadFiles = async (files: FileList) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        form.append('chapterId', 'site-gallery')
        const up = await fetch('/api/upload-image', { method: 'POST', body: form, credentials: 'include' })
        if (!up.ok) {
          let msg = 'Failed to upload image'
          try { const j = await up.json(); msg = j?.error || msg } catch {}
          console.error('Upload error:', msg)
          toast({ title: 'Upload failed', description: msg, variant: 'destructive' })
          continue
        }
        const { url, path } = await up.json()
        const sv = await fetch('/api/site-gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url, imagePath: path }),
          credentials: 'include'
        })
        if (!sv.ok) {
          let msg = 'Failed to save image'
          try {
            const j = await sv.json()
            // Prefer server-provided details for quicker debugging
            msg = j?.details || j?.error || msg
          } catch {}
          console.error('Save error:', msg)
          toast({ title: 'Save failed', description: msg, variant: 'destructive' })
          continue
        }
        uploaded.push(url)
      }
      setSiteImages(prev => [...uploaded, ...prev])
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (imageUrl: string) => {
    const res = await fetch(`/api/site-gallery?imageUrl=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' })
    if (res.ok) setSiteImages(prev => prev.filter(u => u !== imageUrl))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-6 py-8">
        <Card className="border-2 border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-pink-600" />
              Site Gallery
            </CardTitle>
            <CardDescription>Images used by Login and Signup background.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">{siteImages.length} images</div>
              <div className="flex gap-2 items-center">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-pink-600 hover:bg-pink-700 text-white">
                  {uploading ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />) : (<Upload className="h-4 w-4 mr-2" />)}
                  {uploading ? 'Uploading...' : 'Add Images'}
                </Button>
              </div>
            </div>

            {siteImages.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">No site images yet. Click "Add Images" to upload.</p>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-pink-600 hover:bg-pink-700 text-white">
                  <Upload className="w-4 h-4 mr-1" />
                  Upload First Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {siteImages.map((url, i) => (
                  <div key={i} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                      <Image src={url} alt={`Site image ${i + 1}`} width={300} height={300} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="destructive" onClick={() => removeImage(url)} className="h-8 w-8 p-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}