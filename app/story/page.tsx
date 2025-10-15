"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { ChapterSection } from "@/components/chapter-section"
// ImageUploadPanel removed; admin image management lives in Admin > Manage Chapters
import { BookOpen, Lock, Upload, Image as ImageIcon, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChapterManagementPanel } from "@/components/chapter-management-panel"
import Image from "next/image"
import { PixelHeart } from "@/components/pixel-heart"

export default function StoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  
  // Story state for authenticated users
  const [chapters, setChapters] = useState<any[]>([])
  const [story, setStory] = useState<any>(null)
  const [visibleChapters, setVisibleChapters] = useState<number[]>([1])
  const [activeChapterId, setActiveChapterId] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const bottomUploadInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingContent, setEditingContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [footerVideoUrl, setFooterVideoUrl] = useState<string | null>(null)

  // Ensure component is mounted on client before showing session-dependent content
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load stories and chapters; prefer assigned when authenticated, but fall back to user stories
  useEffect(() => {
    if (mounted) {
      const loadStories = async () => {
        setLoading(true)
        try {
          // If an explicit story id is provided and user is authenticated, load that story
          const storyIdParam = searchParams.get('id') || searchParams.get('storyId')
          if (storyIdParam && status === 'authenticated') {
            // First, try to load a user-owned story by id
            const specificResponse = await fetch(`/api/stories/${storyIdParam}`)
            if (specificResponse.ok) {
              const { story: specificStory } = await specificResponse.json()
              if (specificStory) {
                setStory(specificStory)
                if (specificStory.chapters && specificStory.chapters.length > 0) {
                  const transformedChapters = specificStory.chapters
                    .sort((a: any, b: any) => a.chapter_number - b.chapter_number)
                    .map((chapter: any) => ({
                      id: chapter.chapter_number,
                      dbId: chapter.id,
                      title: chapter.title,
                      content: chapter.content,
                      images: []
                    }))
                  setChapters(transformedChapters)
                  return
                }
              }
            }

            // If not found or not owned, fall back to assigned stories and match by id
            const assignedFallback = await fetch('/api/stories/assigned')
            if (assignedFallback.ok) {
              const assignedData = await assignedFallback.json()
              const assignedStories = assignedData?.stories ?? assignedData
              if (Array.isArray(assignedStories) && assignedStories.length > 0) {
                const matched = assignedStories.find((s: any) => String(s?.id) === String(storyIdParam))
                const storyData = matched || assignedStories[0]
                if (storyData) {
                  setStory(storyData)
                  if (storyData.chapters && storyData.chapters.length > 0) {
                    const transformedChapters = storyData.chapters
                      .sort((a: any, b: any) => a.chapter_number - b.chapter_number)
                      .map((chapter: any) => ({
                        id: chapter.chapter_number,
                        dbId: chapter.id,
                        title: chapter.title,
                        content: chapter.content,
                        images: []
                      }))
                    setChapters(transformedChapters)
                  }
                  return
                }
              }
            }
          }

          // First, try to load stories assigned to this user
          const assignedResponse = await fetch('/api/stories/assigned')
          if (assignedResponse.ok) {
            const assignedData = await assignedResponse.json()
            const assignedStories = assignedData?.stories ?? assignedData
            if (Array.isArray(assignedStories) && assignedStories.length > 0) {
              const storyData = assignedStories[0]
              setStory(storyData)
              if (storyData.chapters && storyData.chapters.length > 0) {
                const transformedChapters = storyData.chapters
                  .sort((a: any, b: any) => a.chapter_number - b.chapter_number)
                  .map((chapter: any) => ({
                    id: chapter.chapter_number,
                    dbId: chapter.id,
                    title: chapter.title,
                    content: chapter.content,
                    images: []
                  }))
                setChapters(transformedChapters)
              }
              return
            }
          }

          // Fallback: load stories the user owns directly
          const response = await fetch('/api/stories')
          if (response.ok) {
            const { stories } = await response.json()
            if (stories && stories.length > 0) {
              const storyData = stories[0]
              setStory(storyData)
              if (storyData.chapters && storyData.chapters.length > 0) {
                const transformedChapters = storyData.chapters
                  .sort((a: any, b: any) => a.chapter_number - b.chapter_number)
                  .map((chapter: any) => ({
                    id: chapter.chapter_number,
                    dbId: chapter.id,
                    title: chapter.title,
                    content: chapter.content,
                    images: []
                  }))
                setChapters(transformedChapters)
              }
            } else {
              // No stories exist, seed the default story for this user
              const seedResponse = await fetch('/api/seed-default-story', { method: 'POST' })
              if (seedResponse.ok) {
                const reloadResponse = await fetch('/api/stories')
                if (reloadResponse.ok) {
                  const { stories: newStories } = await reloadResponse.json()
                  if (newStories && newStories.length > 0) {
                    const storyData = newStories[0]
                    setStory(storyData)
                    if (storyData.chapters && storyData.chapters.length > 0) {
                      const transformedChapters = storyData.chapters
                        .sort((a: any, b: any) => a.chapter_number - b.chapter_number)
                        .map((chapter: any) => ({
                          id: chapter.chapter_number,
                          dbId: chapter.id,
                          title: chapter.title,
                          content: chapter.content,
                          images: []
                        }))
                      setChapters(transformedChapters)
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to load stories:', error)
        } finally {
          setLoading(false)
        }
      }

      loadStories()
    }
  }, [mounted, status, searchParams])

  // Removed unauthenticated redirect to allow previewing default/fallback content

  // Load images from database only when user is authenticated
  useEffect(() => {
    if (mounted && status === 'authenticated' && chapters.length > 0) {
      const loadImages = async () => {
        try {
          const url = story?.id ? `/api/chapter-images?storyId=${story.id}` : '/api/chapter-images'
          const response = await fetch(url)
          if (response.ok) {
            const { imagesByChapter } = await response.json()
            
            // Update chapters with loaded images; fall back to static /public chapter images when none exist in DB
            setChapters(prev => prev.map(chapter => {
              const dbImages = imagesByChapter[Number(chapter.dbId)] || []
              const fallbackImage = `/chapter-${chapter.id}.jpg`
              const images = dbImages.length > 0 ? dbImages : [fallbackImage]
              return {
                ...chapter,
                images
              }
            }))
          }
        } catch (error) {
          console.error('Failed to load images:', error)
          // Even if API fails, ensure user sees the static /public images
          setChapters(prev => prev.map(chapter => ({
            ...chapter,
            images: [`/chapter-${chapter.id}.jpg`]
          })))
        }
      }

      loadImages()
    }
  }, [mounted, status, chapters.length, story?.id])

  // Detect a single footer video placed in /public as /story-footer.mp4
  useEffect(() => {
    const detectFooterVideo = async () => {
      if (!mounted) return
      try {
        // Try primary filename
        const res = await fetch('/story-footer.mp4', { method: 'HEAD' })
        if (res.ok) {
          setFooterVideoUrl('/story-footer.mp4')
          return
        }
        // Fallback filename
        const resAlt = await fetch('/story.mp4', { method: 'HEAD' })
        if (resAlt.ok) {
          setFooterVideoUrl('/story.mp4')
          return
        }
        setFooterVideoUrl(null)
      } catch (_) {
        setFooterVideoUrl(null)
      }
    }

    detectFooterVideo()
  }, [mounted])

  // Use shared PixelHeart component for consistent visuals with landing page

  // Chapter-level MP4 auto-detection removed to avoid missing-file network errors

  // Debounced target chapter for smoother background switching
  const [bgTargetId, setBgTargetId] = useState<number>(1)
  useEffect(() => {
    const t = setTimeout(() => setBgTargetId(activeChapterId), 150)
    return () => clearTimeout(t)
  }, [activeChapterId])

  // Compute background URL based on debounced target
  const backgroundUrl = useMemo(() => {
    const targetNumber = bgTargetId || chapters[0]?.id
    const targetChapter = chapters.find(ch => ch.id === targetNumber)
    return targetChapter?.images?.[0] || "/placeholder.svg?height=1080&width=1920"
  }, [bgTargetId, chapters])

  // Crossfade state for dual background layers
  const [bgA, setBgA] = useState<string>("/placeholder.svg?height=1080&width=1920")
  const [bgB, setBgB] = useState<string>("/placeholder.svg?height=1080&width=1920")
  const [useA, setUseA] = useState(true)

  // Update crossfade layers when backgroundUrl changes
  useEffect(() => {
    const current = useA ? bgA : bgB
    if (!backgroundUrl || backgroundUrl === current) return
    const setNext = useA ? setBgB : setBgA
    setNext(backgroundUrl)
    const t = setTimeout(() => setUseA((prev) => !prev), 50)
    return () => clearTimeout(t)
  }, [backgroundUrl, useA, bgA, bgB])

  useEffect(() => {
    if (mounted) {
      // Initialize intersection observer with center-band detection to reduce flicker
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries.filter((e) => e.isIntersecting)
          if (visibleEntries.length > 0) {
            const topEntry = visibleEntries.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b))
            const chapterId = Number.parseInt(topEntry.target.getAttribute("data-chapter-id") || "0")
            setActiveChapterId(chapterId)
            setVisibleChapters((prev) => [...new Set([...prev, chapterId])])
          }
        },
        { threshold: 0, rootMargin: "-45% 0px -45% 0px" },
      )

      return () => {
        observerRef.current?.disconnect()
      }
    }
  }, [mounted])

  // Update chapter text content in database
  const handleTextUpdate = async (chapterId: number, newContent: string) => {
    try {
      // Find the chapter in the current story
      const response = await fetch('/api/stories')
      if (response.ok) {
        const { stories } = await response.json()
        if (stories && stories.length > 0) {
          const story = stories[0]
          const chapter = story.chapters.find((ch: any) => ch.chapter_number === chapterId)
          
          if (chapter) {
            // Update the chapter content
            const updateResponse = await fetch(`/api/chapters/${chapter.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: chapter.title,
                content: newContent
              })
            })
            
            if (updateResponse.ok) {
              // Update local state
              setChapters(prev => prev.map(ch => 
                ch.id === chapterId 
                  ? { ...ch, content: newContent }
                  : ch
              ))
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to update chapter text:', error)
    }
  }

  // Update chapter images
  // Legacy admin image update logic removed

  const handleBottomUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    const targetNumber = (visibleChapters[visibleChapters.length - 1]) || chapters[0]?.id
    const targetChapter = chapters.find(ch => ch.id === targetNumber)
    const targetDbId = targetChapter?.dbId
    if (!targetDbId) return

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const uploadForm = new FormData()
        uploadForm.append('file', file)
        uploadForm.append('chapterId', String(targetDbId))

        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: uploadForm
        })

        if (!uploadRes.ok) {
          const errText = await uploadRes.text()
          throw new Error(`Failed storage upload: ${errText}`)
        }

        const { url, path } = await uploadRes.json()

        const saveRes = await fetch('/api/chapter-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterId: targetDbId,
            imageUrl: url,
            imagePath: path
          })
        })

        if (!saveRes.ok) {
          const errText = await saveRes.text()
          throw new Error(`Failed to save image record: ${errText}`)
        }

        uploadedUrls.push(url)
      }

      // Update chapters state
      setChapters(prev => prev.map(chapter => (
        chapter.id === targetNumber
          ? { ...chapter, images: [...(chapter.images || []), ...uploadedUrls] }
          : chapter
      )))
    } catch (error) {
      console.error('Bottom upload failed:', error)
    } finally {
      setUploading(false)
      if (bottomUploadInputRef.current) bottomUploadInputRef.current.value = ''
    }
  }

  const getCurrentChapterId = () => {
    return (visibleChapters[visibleChapters.length - 1]) || chapters[0]?.id
  }

  const openEditorForCurrentChapter = () => {
    // Open full chapter/story management dialog per request
    setManageDialogOpen(true)
  }

  const saveCurrentChapterEdits = async () => {
    const targetChapterId = getCurrentChapterId()
    if (!targetChapterId) return
    setSaving(true)
    try {
      const response = await fetch('/api/stories')
      if (response.ok) {
        const { stories } = await response.json()
        if (stories && stories.length > 0) {
          const story = stories[0]
          const dbChapter = story.chapters.find((ch: any) => ch.chapter_number === targetChapterId)
          if (dbChapter) {
            const updateResponse = await fetch(`/api/chapters/${dbChapter.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: editingTitle, content: editingContent })
            })
            if (!updateResponse.ok) {
              const err = await updateResponse.text()
              throw new Error(err || 'Failed to update chapter')
            }
            // Update local state
            setChapters(prev => prev.map(ch => (
              ch.id === targetChapterId ? { ...ch, title: editingTitle, content: editingContent } : ch
            )))
          }
        }
      }
      setEditorOpen(false)
    } catch (error) {
      console.error('Failed to save chapter edits:', error)
    } finally {
      setSaving(false)
    }
  }

  // Show loading state during hydration and while session is loading
  if (!mounted || status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Loading your story...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Show chapters if we have them, regardless of authentication status (for testing)
  if (mounted && chapters.length > 0) {
    return (
      <main className="min-h-screen relative">
        {/* Full-page blurred background with crossfade */}
        <div className="absolute inset-0 -z-10">
          <div className={`absolute inset-0 transition-opacity duration-700`}>
            <Image
              src={bgA}
              alt="Story background A"
              fill
              sizes="100vw"
              className={`object-cover blur-3xl ${useA ? 'opacity-50' : 'opacity-0'}`}
            />
          </div>
          <div className={`absolute inset-0 transition-opacity duration-700`}>
            <Image
              src={bgB}
              alt="Story background B"
              fill
              sizes="100vw"
              className={`object-cover blur-3xl ${useA ? 'opacity-0' : 'opacity-50'}`}
            />
          </div>
          {/* Subtle tint to keep text legible */}
          <div className="absolute inset-0 bg-white/10" />
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Story Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-8 mb-2">
                <PixelHeart size={96} palette={{ border: "#000000", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }} />
                <PixelHeart size={160} palette={{ border: "#000000", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }} />
                <PixelHeart size={96} palette={{ border: "#000000", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }} />
              </div>
              <h1 className="text-4xl md:text-6xl font-bubble font-bold mb-2">
                <span className="text-pink-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]" style={{ WebkitTextStroke: "0.35px #be185d" }}>
                  Bambiland
                </span>
              </h1>
              <div className="mt-0.5 text-base sm:text-lg font-bubble text-black">XoXo</div>
            </div>

            <div className="space-y-6">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="space-y-8">
                  <ChapterSection
                    chapter={chapter}
                    isVisible={visibleChapters.includes(chapter.id)}
                    observerRef={observerRef}
                    isFirst={index === 0}
                  />
                  
                  {/* Removed between-chapter transition per request; preview lives inside ChapterSection */}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Optional single footer video under the entire story */}
        {footerVideoUrl && (
          <div className="container mx-auto px-4 pb-24">
            <div className="max-w-4xl mx-auto">
              <div className="mt-12 flex justify-center">
                <video
                  src={footerVideoUrl}
                  controls
                  playsInline
                  className="rounded-2xl shadow-2xl w-full max-w-[900px]"
                  poster={chapters[0]?.images?.[0]}
                />
              </div>
            </div>
          </div>
        )}
        {session?.user?.role === 'admin' && (
          <div className="fixed bottom-4 left-0 right-0 z-50 pointer-events-none">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex justify-end">
                <div className="pointer-events-auto flex flex-col items-end gap-3">
                  {/* Hidden input for uploads */}
                  <input
                    ref={bottomUploadInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleBottomUpload(e.target.files)}
                  />
                  {/* Edit button */}
                  <Button
                    onClick={openEditorForCurrentChapter}
                    variant="secondary"
                    className="h-12 w-12 rounded-full p-0 flex items-center justify-center bg-white/90 hover:bg-white shadow-lg border border-pink-200"
                    aria-label="Edit current chapter"
                  >
                    <Pencil className="w-5 h-5 text-pink-700" />
                  </Button>
                  {/* Upload button - icon only */}
                  <Button
                    onClick={() => bottomUploadInputRef.current?.click()}
                    disabled={uploading}
                    className="h-12 w-12 rounded-full p-0 flex items-center justify-center bg-pink-600 hover:bg-pink-700 text-white shadow-lg"
                    aria-label="Upload images to current chapter"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Full chapter/story management dialog for admins */}
        <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[1200px] h-[90vh] p-0 overflow-auto">
            <DialogHeader className="px-6 pt-4">
              <DialogTitle>Manage Chapters</DialogTitle>
              <DialogDescription>
                Edit all chapters, add new ones, and manage images.
              </DialogDescription>
            </DialogHeader>
            <div className="h-full">
              <ChapterManagementPanel onBack={() => setManageDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
        {/* Admin image upload panel removed to avoid duplicate dropdown UI. */}
      </main>
    )
  }

  if (session) {
    // User is logged in but no chapters loaded yet
    if (chapters.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
          <div className="text-center">
            <h2 className="text-2xl font-serif text-gray-900 mb-4">No stories found</h2>
            <p className="text-gray-600">Your stories will appear here once they're loaded.</p>
          </div>
        </div>
      )
    }
  }

  // User is not logged in, show access required message
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-200 rounded-full blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-br from-pink-200 to-rose-300 p-4 rounded-full">
                <Lock className="w-12 h-12 text-gray-700" />
              </div>
            </div>
          </div>
          <CardTitle className="text-4xl font-serif font-bold text-gray-900 mb-2">
            Story Access Required
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Sign in to unlock the magical world of Bambiland
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-700 text-lg leading-relaxed">
            The enchanting tales of Bambiland await you! Create your account or sign in 
            to access exclusive stories filled with wonder, adventure, and heartwarming moments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full sm:w-auto border-2 border-pink-300 text-pink-700 hover:bg-pink-50 px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300">
                Sign In
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
            <h3 className="font-serif font-semibold text-gray-900 mb-3 text-xl">What awaits you:</h3>
            <ul className="text-left text-gray-700 space-y-2 max-w-md mx-auto">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Access to the complete Bambiland story
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Interactive chapters with beautiful transitions
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Immersive reading experience
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Regular updates with new content
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}