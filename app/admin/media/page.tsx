"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

type Tier = { id: string; name: string; rank: number; monthly_price_cents: number }

type MediaItem = { url: string; type: 'image' | 'video'; thumb_url?: string }

export default function AdminMediaPage() {
  const { toast } = useToast()
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [requiredTierId, setRequiredTierId] = useState<string | undefined>(undefined)
  const [priceCents, setPriceCents] = useState<string>("")
  const [isPublished, setIsPublished] = useState(true)
  const [isSpecialCard, setIsSpecialCard] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([{ url: "", type: "image" }])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/membership/tiers')
        const data = await res.json()
        setTiers(data?.tiers || [])
      } catch (e) {
        console.error('Failed to load tiers', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function addMediaRow() {
    setMedia((prev) => [...prev, { url: "", type: "image" }])
  }

  function updateMedia(i: number, next: Partial<MediaItem>) {
    setMedia((prev) => prev.map((m, idx) => idx === i ? { ...m, ...next } : m))
  }

  function removeMedia(i: number) {
    setMedia((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function uploadLocalFiles(files: FileList) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const newItems: MediaItem[] = []
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        // Reuse the existing endpoint; group uploads under 'admin-media'
        form.append('chapterId', 'admin-media')
        const up = await fetch('/api/upload-image', { method: 'POST', body: form, credentials: 'include' })
        if (!up.ok) {
          let msg = 'Failed to upload file'
          try { const j = await up.json(); msg = j?.error || msg } catch {}
          console.error('Upload error:', msg)
          toast({ title: 'Upload failed', description: msg, variant: 'destructive' })
          continue
        }
        const { url } = await up.json()
        const type: 'image' | 'video' = file.type?.startsWith('video') ? 'video' : 'image'
        newItems.push({ url, type })
      }
      if (newItems.length > 0) {
        setMedia(prev => [...newItems, ...prev])
        toast({ title: 'Upload complete', description: `${newItems.length} file(s) added to post` })
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/media-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          required_tier_id: requiredTierId,
          price_cents: priceCents ? parseInt(priceCents, 10) : undefined,
          is_published: isPublished,
          is_special_card: isSpecialCard,
          media: media.filter(m => m.url && m.url.length > 0)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create post')
      toast({ title: 'Post created', description: 'Your media post has been saved.' })
      // reset form
      setTitle("")
      setBody("")
      setRequiredTierId(undefined)
      setPriceCents("")
      setIsPublished(true)
      setIsSpecialCard(false)
      setMedia([{ url: "", type: "image" }])
    } catch (e:any) {
      toast({ title: 'Create failed', description: e.message || 'Could not create media post', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 font-bubble">
      <div className="mb-6" />
      <Card className="relative border-2 border-black rounded-none bg-[repeating-linear-gradient(0deg,#fff,#fff_6px,#ffe4ef_6px,#ffe4ef_12px)]">
        <span aria-hidden className="absolute top-1 left-1 w-2 h-2 bg-black" />
        <span aria-hidden className="absolute top-1 right-1 w-2 h-2 bg-black" />
        <span aria-hidden className="absolute bottom-1 left-1 w-2 h-2 bg-black" />
        <span aria-hidden className="absolute bottom-1 right-1 w-2 h-2 bg-black" />
        <CardContent className="py-8">
          <h1 className="text-3xl font-bold text-black mb-6">Admin: Create Media Post</h1>
          {loading ? (
            <div className="text-pink-500">Loading tiers…</div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-pink-800 mb-1">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" className="rounded-none border-2 border-black bg-white text-black" />
              </div>
              <div>
                <label className="block text-pink-800 mb-1">Description</label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe the content" className="rounded-none border-2 border-black bg-white text-black" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-pink-800 mb-1">Required Tier</label>
                  <Select value={requiredTierId} onValueChange={(val) => setRequiredTierId(val)}>
                    <SelectTrigger className="bg-white rounded-none border-2 border-black text-black">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name} (rank {t.rank})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-pink-800 mb-1">Price (cents)</label>
                  <Input value={priceCents} onChange={(e) => setPriceCents(e.target.value)} placeholder="e.g. 499" className="rounded-none border-2 border-black bg-white text-black" />
                </div>
                <div>
                  <label className="block text-pink-800 mb-1">Publish</label>
                  <div className="flex items-center gap-2">
                    <Button variant={isPublished ? 'default' : 'outline'} onClick={() => setIsPublished(!isPublished)} className={isPublished ? 'rounded-none border-2 border-black bg-pink-300 text-black hover:bg-pink-400' : 'rounded-none border-2 border-black bg-white text-black hover:bg-pink-50'}>
                      {isPublished ? 'Published' : 'Draft'}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-pink-800 mb-1">Special Card Styling</label>
                <div className="flex items-center gap-3">
                  <Switch checked={isSpecialCard} onCheckedChange={(v) => setIsSpecialCard(Boolean(v))} />
                  <span className="text-sm text-pink-700">Apply special membership-style card to this post</span>
                </div>
              </div>

              <div>
                <label className="block text-pink-800 mb-2">Media Items</label>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && uploadLocalFiles(e.target.files)}
                  />
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-none border-2 border-black bg-pink-300 text-black hover:bg-pink-400">
                    {uploading ? 'Uploading…' : 'Upload from device'}
                  </Button>
                  <span className="text-xs text-pink-800">Adds uploaded files as media entries</span>
                </div>
                <div className="space-y-3">
                  {media.map((m, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                      <div className="md:col-span-2">
                        <label className="text-sm text-pink-800">Type</label>
                        <Select value={m.type} onValueChange={(val: 'image' | 'video') => updateMedia(i, { type: val })}>
                          <SelectTrigger className="bg-white rounded-none border-2 border-black text-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-sm text-pink-800">URL</label>
                        <Input value={m.url} onChange={(e) => updateMedia(i, { url: e.target.value })} placeholder="https://…" className="rounded-none border-2 border-black bg-white text-black" />
                      </div>
                      <div className="md:col-span-1 flex gap-2">
                        <Button variant="outline" onClick={() => removeMedia(i)} className="rounded-none border-2 border-black bg-white text-black hover:bg-pink-50">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <Button variant="secondary" onClick={addMediaRow} className="rounded-none border-2 border-black bg-pink-300 text-black hover:bg-pink-400">Add Media</Button>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={submit} disabled={submitting} className="rounded-none border-2 border-black bg-pink-300 text-black hover:bg-pink-400">Save Post</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}