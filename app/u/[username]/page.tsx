"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Upload, Check } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const usernameParam = (params?.username as string) || ""
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  const [userInfo, setUserInfo] = useState<{ id: string; username: string } | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [bio, setBio] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [bioSaving, setBioSaving] = useState(false)
  const [bioDraft, setBioDraft] = useState<string>('')
  const [assignedStory, setAssignedStory] = useState<any | null>(null)
  const [assignedImageUrl, setAssignedImageUrl] = useState<string | null>(null)
  const isOwnPage = useMemo(() => {
    return session?.user?.name && session.user.name.toLowerCase() === usernameParam.toLowerCase()
  }, [session, usernameParam])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)

      // 1) Fetch user by username to resolve ID
      const res = await fetch(`/api/users/by-username?username=${encodeURIComponent(usernameParam)}`)
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = await res.json()
      const user = data?.user
      if (!user || cancelled) {
        setLoading(false)
        return
      }
      setUserInfo({ id: user.id, username: user.username })

      // 2) If viewing own page, fetch current profile image via session-based API
      // Otherwise, try to compute a public URL using a convention (folder per user)
      if (isOwnPage) {
        const imgRes = await fetch('/api/profile/image')
        const imgData = await imgRes.json()
        setImageUrl(imgData?.imageUrl || null)
      } else {
        // Public lookup of another user's avatar via API
        const imgRes = await fetch(`/api/profile/image?userId=${encodeURIComponent(user.id)}`)
        const imgData = await imgRes.json()
        setImageUrl(imgData?.imageUrl || null)
      }

      // 3) Fetch bio text
      try {
        const bioRes = await fetch(isOwnPage ? '/api/profile/bio' : `/api/profile/bio?userId=${encodeURIComponent(user.id)}`)
        const bioData = await bioRes.json()
        setBio(typeof bioData?.bio === 'string' ? bioData.bio : null)
      } catch (e) {
        console.warn('Bio fetch failed:', e)
        setBio(null)
      }

      // 4) Fetch assigned story preview (owner's view only)
      if (isOwnPage) {
        try {
          const assignedRes = await fetch('/api/stories/assigned')
          if (assignedRes.ok) {
            const assignedData = await assignedRes.json()
            const stories = assignedData?.stories ?? assignedData
            if (Array.isArray(stories) && stories.length > 0) {
              const story = stories[0]
              setAssignedStory(story)
              // Prefer first chapter image from storage when available
              try {
                const imagesRes = await fetch(`/api/chapter-images?storyId=${encodeURIComponent(String(story.id))}`)
                if (imagesRes.ok) {
                  const imagesData = await imagesRes.json()
                  let firstImageUrl: string | null = null

                  // New API shape: { imagesByChapter: { [chapterId]: string[] } }
                  if (imagesData && typeof imagesData === 'object' && imagesData.imagesByChapter) {
                    const byChapter = imagesData.imagesByChapter as Record<string, string[]>
                    const sortedChapterIds = Object.keys(byChapter)
                      .map((k) => Number(k))
                      .sort((a, b) => a - b)

                    for (const chId of sortedChapterIds) {
                      const arr = byChapter[chId] || []
                      const candidate = (arr || []).find((u) => typeof u === 'string' && u.length > 0)
                      if (candidate) {
                        firstImageUrl = candidate
                        break
                      }
                    }
                  } else if (Array.isArray(imagesData) && imagesData.length > 0) {
                    // Backward compatibility if API ever returns an array
                    const maybeObj = imagesData[0]
                    firstImageUrl = (maybeObj && (maybeObj.url || maybeObj.image_url)) || null
                  }

                  setAssignedImageUrl(firstImageUrl || story?.cover_image_url || null)
                } else {
                  setAssignedImageUrl(story?.cover_image_url || null)
                }
              } catch (imgErr) {
                console.warn('Chapter images fetch failed:', imgErr)
                setAssignedImageUrl(story?.cover_image_url || null)
              }
            }
          }
        } catch (e) {
          console.warn('Assigned story fetch failed:', e)
        }
      }

      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [usernameParam, isOwnPage])

  // Auto-open bio editor when visiting own profile with ?edit=bio
  useEffect(() => {
    if (!isOwnPage) return
    const edit = searchParams?.get('edit')
    if (edit === 'bio' && !editing) {
      startEditing()
      // Clean the URL so the editor isn't re-triggered during navigation
      try {
        router.replace(`/u/${usernameParam}`)
      } catch {}
    }
  }, [isOwnPage, searchParams, editing, router, usernameParam])

  async function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/image', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok && data?.imageUrl) {
        // cache-bust in case of CDN delay
        const bustUrl = data.imageUrl.includes('?') ? `${data.imageUrl}&t=${Date.now()}` : `${data.imageUrl}?t=${Date.now()}`
        setImageUrl(bustUrl)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      // reset input value to allow re-uploading same file
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function startEditing() {
    setBioDraft((bio ?? '').slice(0, 250))
    setEditing(true)
  }

  function cancelEditing() {
    // Do not apply changes; return to view mode
    setBioDraft((bio ?? '').slice(0, 250))
    setEditing(false)
  }

  async function saveBio() {
    if (!editing) return
    const next = (bioDraft ?? '').slice(0, 250)
    setBioSaving(true)
    try {
      const res = await fetch('/api/profile/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: next })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Bio save failed:', data)
        if (res.status === 401) {
          toast({
            title: 'Sign in required',
            description: 'Please sign in to update your bio.',
            variant: 'destructive',
          })
        } else if (res.status === 409) {
          toast({
            title: 'Profile not ready',
            description: 'Bio column missing. Admin needs to add it.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Save failed',
            description: (data?.error as string) || 'Could not update your bio.',
            variant: 'destructive',
          })
        }
        return
      }
      // Update local state and exit edit mode to view profile
      setBio(next)
      setEditing(false)
      toast({
        title: 'Bio updated',
        description: 'Your profile bio has been saved.',
      })
    } catch (e) {
      console.error('Bio save error:', e)
      toast({
        title: 'Save error',
        description: 'Network error while saving your bio.',
        variant: 'destructive',
      })
    } finally {
      setBioSaving(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 font-bubble">
      {/* Header spacing under global nav */}
      <div className="mb-6" />

      <Card className="bg-pink-50 border-pink-200 relative">
        <CardContent className="py-10">
          {loading ? (
            <div className="text-center text-pink-500">Loading profile…</div>
          ) : !userInfo ? (
            <div className="text-center text-red-600">User not found.</div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Center avatar, Instagram-like circle */}
              <div className="relative">
                <div className="p-1 rounded-full bg-pink-200">
                  <div className="rounded-full bg-white p-1">
                    <Avatar className="size-32 rounded-full overflow-hidden">
                      {imageUrl ? (
                        <AvatarImage src={imageUrl} alt={`${userInfo.username} avatar`} className="object-cover" />
                      ) : (
                        <AvatarFallback className="text-pink-500 text-2xl">
                          {userInfo.username.substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                </div>
                {isOwnPage && (
                  <div className="absolute -top-1 -right-1">
                    <button
                      type="button"
                      aria-label="Change Photo"
                      className="w-8 h-8 rounded-full bg-pink-300 text-pink-700 flex items-center justify-center shadow hover:bg-pink-400 transition-colors ring-2 ring-white"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Upload className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Username under avatar */}
              <h1 className="text-3xl font-bold text-pink-500">@{userInfo.username}</h1>

              {/* Bio section */}
              {editing ? (
                <div className="w-full max-w-xl">
                  <Textarea
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value.slice(0, 250))}
                    placeholder="Write your bio (max 250 characters)"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-pink-500">{(bioDraft ?? '').length}/250</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={cancelEditing} disabled={bioSaving}>Cancel</Button>
                      <Button onClick={saveBio} disabled={bioSaving}>Save</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-xl text-center">
                  {bio ? (
                    <p className="text-pink-700">{bio}</p>
                  ) : (
                    <p className="text-pink-400">{isOwnPage ? 'Add a cute bio to your page ✨' : 'No bio yet.'}</p>
                  )}
                </div>
              )}

              {/* Spacer for layout aesthetics */}
              <div className="h-8" />

              {/* Assigned Story Preview */}
              {isOwnPage && assignedStory && (
                <div className="w-full max-w-xl">
                  <Link
                    href={`/story?id=${assignedStory.id}`}
                    aria-label={assignedStory.title ? `View story: ${assignedStory.title}` : 'View assigned story'}
                    className="block rounded-xl overflow-hidden border border-pink-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-pink-100">
                      <img
                        src={assignedImageUrl || "/chapter-1.jpg"}
                        alt={assignedStory.title ? `Cover image for ${assignedStory.title}` : "Assigned story cover"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-pink-600">Assigned Story</h2>
                          <p className="text-sm text-pink-800">{assignedStory.title || 'Untitled story'}</p>
                        </div>
                        <span className="inline-flex items-center justify-center rounded-full bg-pink-300 text-pink-700 px-4 py-2 hover:bg-pink-400 transition-colors ring-2 ring-white">
                          View Story
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Edit menu moved to top-right */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}