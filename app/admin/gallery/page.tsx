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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        <Card className="relative rounded-none border-2 border-black bg-pink-50">
          {/* pixel corner squares */}
          <span className="absolute -top-1 -left-1 w-2 h-2 bg-black"></span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-black"></span>
          <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-black"></span>
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-black"></span>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <ImageIcon className="h-5 w-5 text-black" />
              Site Gallery
            </CardTitle>
            <CardDescription className="text-black/70">Images used by Login and Signup background.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">{siteImages.length} images</div>
              <div className="flex gap-2 items-center">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-none border-2 border-black bg-pink-200 text-black hover:bg-pink-300 shadow-[4px_4px_0_0_#000]"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-none h-4 w-4 border-b-2 border-black mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2 text-black" />
                  )}
                  {uploading ? 'Uploading...' : 'Add Images'}
                </Button>
              </div>
            </div>

            {siteImages.length === 0 ? (
              <div className="relative border-2 border-black rounded-none p-8 text-center bg-pink-50">
                {/* corner squares */}
                <span className="absolute -top-1 -left-1 w-2 h-2 bg-black"></span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-black"></span>
                <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-black"></span>
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-black"></span>
                <ImageIcon className="w-12 h-12 text-black mx-auto mb-3" />
                <p className="text-sm text-black mb-3">No site images yet. Click "Add Images" to upload.</p>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-none border-2 border-black bg-pink-200 text-black hover:bg-pink-300 shadow-[4px_4px_0_0_#000]"
                >
                  <Upload className="w-4 h-4 mr-1 text-black" />
                  Upload First Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {siteImages.map((url, i) => (
                  <div key={i} className="relative group">
                    <div className="relative aspect-square rounded-none overflow-hidden bg-pink-50 border-2 border-black">
                      {/* corner squares */}
                      <span className="absolute -top-1 -left-1 w-2 h-2 bg-black"></span>
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-black"></span>
                      <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-black"></span>
                      <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-black"></span>
                      <Image src={url} alt={`Site image ${i + 1}`} width={300} height={300} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        onClick={() => removeImage(url)}
                        className="h-8 w-8 p-0 rounded-none border-2 border-black bg-pink-200 text-black hover:bg-pink-300 shadow-[3px_3px_0_0_#000]"
                      >
                        <X className="w-4 h-4 text-black" />
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