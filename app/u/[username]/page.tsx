"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Avoid Radix Avatar to prevent vendor-chunk resolution issues; use native img
import { Upload, Check } from "lucide-react"
import { PixelHeart } from "@/components/pixel-heart"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import CardHeartsOverlay from "@/components/card-hearts-overlay"
import CardHeartsInteractive from "@/components/card-hearts-interactive"
import dynamic from "next/dynamic"
// Load floating nav client-side only to avoid server vendor-chunk for Radix
const ProfileFloatingNav = dynamic(() => import("@/components/profile-floating-nav"), { ssr: false })
// Bottom-floating dock with Edit/Profile Content actions
const ProfileFloatingDock = dynamic(() => import("@/components/profile-floating-dock"), { ssr: false })
// Replace Radix DropdownMenu with native details/summary to avoid vendor chunk

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
  const [myTier, setMyTier] = useState<{ slug: string; name: string; rank: number } | null>(null)
  // Favorites gallery state
  const [favItems, setFavItems] = useState<Array<{ asset_id: string; post_id: string; media_type: 'image' | 'video'; media_url: string }>>([])
  const [favPage, setFavPage] = useState(1)
  const [favHasMore, setFavHasMore] = useState(true)
  const [favLoading, setFavLoading] = useState(false)
  const favLoadMoreRef = useRef<HTMLDivElement | null>(null)
  const isOwnPage = useMemo(() => {
    const sname = session?.user?.name
    return typeof sname === 'string' && sname.toLowerCase() === usernameParam.toLowerCase()
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

  // Load membership tier for own profile display
  useEffect(() => {
    if (!isOwnPage) return
    const loadTier = async () => {
      try {
        const res = await fetch('/api/membership/me')
        const data = await res.json()
        if (res.ok && data?.tier) setMyTier(data.tier)
      } catch (e) {
        console.warn('Tier load failed:', e)
      }
    }
    loadTier()
  }, [isOwnPage])

  // Reset favorites when profile user changes
  useEffect(() => {
    setFavItems([])
    setFavPage(1)
    setFavHasMore(true)
  }, [userInfo?.id])

  // Prefill favorites from localStorage for instant display
  useEffect(() => {
    const uname = userInfo?.username
    if (!uname) return
    try {
      const key = `gallery:${uname.toLowerCase()}`
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr) && arr.length > 0) {
        setFavItems(arr)
      }
    } catch {}
  }, [userInfo?.username])

  // Load favorites for gallery
  useEffect(() => {
    const uid = userInfo?.id
    if (!uid || !favHasMore || favLoading) return
    const idEncoded = encodeURIComponent(uid)
    const usernameEncoded = encodeURIComponent(userInfo!.username)
    let cancelled = false
    async function loadPage() {
      setFavLoading(true)
      try {
        const res = await fetch(`/api/users/${idEncoded}/favorites?page=${favPage}&limit=9&username=${usernameEncoded}`)
        const data = await res.json()
        if (!cancelled) {
          const nextItems = Array.isArray(data?.items) ? data.items : []
          setFavItems((prev) => [...prev, ...nextItems])
          const hasMore = Boolean(data?.hasMore)
          setFavHasMore(hasMore)
        }
      } catch (e) {
        console.warn('Favorites fetch failed:', e)
      } finally {
        if (!cancelled) setFavLoading(false)
      }
    }
    loadPage()
    return () => { cancelled = true }
  }, [userInfo?.id, favPage, favHasMore, favLoading])

  // (Removed Gallery state and infinite scroll; Favorites is the single gallery)

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = favLoadMoreRef.current
    if (!el) return
    if (!favHasMore) return
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // Advance page to trigger load
          setFavPage((p) => p + 1)
        }
      }
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [favHasMore, favLoadMoreRef])

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
    <div className="container mx-auto max-w-6xl px-4 py-8 font-bubble">
      {/* Header spacing under global nav */}
      <div className="mb-6" />

      {/* Floating left mini nav (transparent pink) */}
      <ProfileFloatingNav avatarUrl={imageUrl ?? undefined} />
      {/* Bottom-floating dock for Edit/Profile Content actions */}
      <ProfileFloatingDock
        isOwnPage={isOwnPage}
        onEditProfile={startEditing}
        onOpenContent={() => router.push('/content?type=all')}
        onOpenLeaderboard={() => router.push('/leaderboard')}
      />

      <Card className="bg-transparent border-pink-200 relative overflow-hidden">
        {/* Underlay: pink frosted layer with floating hearts, confined to this card */}
        <div className="absolute inset-0 -z-10 rounded-lg bg-pink-50/80 backdrop-blur-[2px]">
          <CardHeartsOverlay density="high" count={18} minSize={18} maxSize={34} opacity={0.4} />
        </div>
        {/* Interactive hearts overlay: click to pop (separate from background hearts) */}
        <CardHeartsInteractive count={6} minSize={18} maxSize={28} opacity={0.6} className="z-10" />
        {/* Top-right status label (single line, transparent, no sparkle) */}
        <div className="absolute top-3 right-3 z-20 flex items-baseline gap-1">
          <span className="text-pink-700 text-xs">
            ID:
          </span>
          <span className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-pink-500 via-pink-400 to-pink-600 bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(236,72,153,0.45)] animate-pulse">
            Bimbolicious
          </span>
        </div>
        {/* Removed old top text buttons; actions moved to bottom-floating dock */}
        <CardContent className="py-10">
          {loading ? (
            <div className="text-center text-pink-500">Loading profile…</div>
          ) : !userInfo ? (
            <div className="text-center text-red-600">User not found.</div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Center avatar, Instagram-like circle (native img to avoid Radix) */}
              <div className="relative">
                <div className="p-1 rounded-full bg-pink-200">
                  <div className="rounded-full bg-white p-1">
                    <div className="size-32 rounded-full overflow-hidden flex items-center justify-center bg-pink-50">
                      {imageUrl ? (
                        <img src={imageUrl} alt={`${userInfo.username} avatar`} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-pink-500 text-2xl">
                          {userInfo.username.substring(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
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

              {/* Username and membership under avatar */}
              <h1 className="text-3xl font-bold text-pink-500">@{userInfo.username}</h1>
              {isOwnPage && myTier && (
                <div className="mt-1 text-pink-600 text-sm">Membership: <span className="font-semibold">{myTier.name}</span></div>
              )}

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

              {/* Single Gallery: Favorites only */}

              {/* Favorites Gallery */}
              {userInfo && (
                <div className="w-full mt-8">
                  <div className="flex items-center justify-between mb-2">
                    <h2 id="gallery" className="text-lg font-semibold text-pink-600">Favorites</h2>
                    <Link href="/content?type=all" className="text-pink-600/80 text-sm hover:text-pink-700">Add from Feed</Link>
                  </div>
                  {(favItems.length === 0 || favItems.length <= 3) ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[0,1,2].map((i) => {
                        const it = favItems[i]
                        if (it) {
                          return (
                            <div key={it.asset_id} className="aspect-[4/3] rounded-md overflow-hidden bg-pink-100">
                              {it.media_type === 'image' ? (
                                <img src={it.media_url} alt="Favorite image" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <video
                                  src={it.media_url}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                  onMouseEnter={(e) => {
                                    const v = e.currentTarget
                                    v.play().catch(() => {})
                                  }}
                                  onMouseLeave={(e) => {
                                    const v = e.currentTarget
                                    v.pause()
                                    try { v.currentTime = 0 } catch {}
                                  }}
                                />
                              )}
                            </div>
                          )
                        }
                        return (
                          <Link key={`ph-${i}`} href="/content?type=all" aria-label="Browse feed to add Favorites" className="group block">
                            <div className="aspect-[4/3] rounded-md overflow-hidden bg-pink-100 flex items-center justify-center ring-1 ring-pink-200/50 group-hover:bg-pink-200 transition-colors">
                              <PixelHeart size={72} />
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {favItems.map((it) => (
                        <div key={it.asset_id} className="aspect-[4/3] rounded-md overflow-hidden bg-pink-100">
                          {it.media_type === 'image' ? (
                            <img src={it.media_url} alt="Favorite image" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <video
                              src={it.media_url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              onMouseEnter={(e) => {
                                const v = e.currentTarget
                                v.play().catch(() => {})
                              }}
                              onMouseLeave={(e) => {
                                const v = e.currentTarget
                                v.pause()
                                try { v.currentTime = 0 } catch {}
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Sentinel for infinite scroll */}
                  <div ref={favLoadMoreRef} className="h-8" />
                  {/* Removed bottom loading indicator per request */}
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