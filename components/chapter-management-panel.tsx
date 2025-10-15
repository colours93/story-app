"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  Plus,
  Save,
  Trash2,
  ArrowLeft
} from "lucide-react"
import Image from "next/image"

interface Chapter {
  id: number
  dbId: string | null
  storyId: string | null
  title: string
  content: string
  images: string[]
}

interface ChapterManagementPanelProps {
  onBack: () => void
}

export function ChapterManagementPanel({ onBack }: ChapterManagementPanelProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  const [editingTitles, setEditingTitles] = useState<{ [key: number]: string }>({})
  const [editingContents, setEditingContents] = useState<{ [key: number]: string }>({})
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set())
  const [addingChapter, setAddingChapter] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [newChapterContent, setNewChapterContent] = useState('')
  const [savingNewChapter, setSavingNewChapter] = useState(false)
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  // Load chapters on mount
  useEffect(() => {
    loadChapters()
  }, [])

  // Initialize editing states when chapters load
  useEffect(() => {
    const titles: { [key: number]: string } = {}
    const contents: { [key: number]: string } = {}
    
    chapters.forEach(chapter => {
      titles[chapter.id] = chapter.title
      contents[chapter.id] = chapter.content
    })
    
    setEditingTitles(titles)
    setEditingContents(contents)
  }, [chapters])

  const loadChapters = async () => {
    setLoading(true)
    try {
      console.log('🔄 Loading chapters...')
      
      // First, try to load existing stories and chapters
      const response = await fetch('/api/admin/chapters')
      console.log('📡 Chapters API response status:', response.status)

      if (response.status === 401) {
        console.error('❌ Unauthorized while loading chapters')
        setChapters([])
        return
      }

      if (!response.ok) {
        console.error('❌ Failed to load chapters, status:', response.status)
        setChapters([])
        return
      }

      const { chapters: loadedChapters } = await response.json()
      console.log('📚 Loaded chapters from API:', loadedChapters?.length || 0)

      // If no chapters found, try to seed the default story
      if (!loadedChapters || loadedChapters.length === 0) {
        console.log('🌱 No chapters found, attempting to seed default story...')
        
        try {
          const seedResponse = await fetch('/api/seed-default-story', {
            method: 'POST'
          })
          
          if (seedResponse.ok) {
            console.log('✅ Default story seeded successfully, reloading...')
            // Reload chapters after seeding
            setTimeout(() => loadChapters(), 1000)
            return
          } else {
            console.error('❌ Failed to seed default story:', seedResponse.status)
          }
        } catch (seedError) {
          console.error('❌ Error seeding default story:', seedError)
        }
        
        setChapters([])
        return
      }

      // Transform the loaded chapters
      const transformedChapters: Chapter[] = loadedChapters
        .sort((a: any, b: any) => a.chapter_number - b.chapter_number)
        .map((chapter: any) => ({
          id: chapter.chapter_number,
          dbId: chapter.id ?? null,
          storyId: chapter.story_id ?? null,
          title: chapter.title,
          content: chapter.content,
          images: []
        }))

      console.log('🔄 Transformed chapters:', transformedChapters.length)

      // Load images for each chapter
      console.log('🖼️ Loading chapter images...')
      const imageResponse = await fetch('/api/chapter-images')
      console.log('📡 Images API response status:', imageResponse.status)

      if (imageResponse.ok) {
        const { imagesByChapter } = await imageResponse.json()
        console.log('🖼️ Loaded images by chapter:', Object.keys(imagesByChapter || {}).length)
        
        transformedChapters.forEach((chapter) => {
          // Prefer DB id when available; fall back to chapter number
          const key = chapter.dbId ? Number(chapter.dbId) : chapter.id
          chapter.images = imagesByChapter[key] || []
          console.log(`📸 Chapter ${chapter.id} has ${chapter.images.length} images`)
        })
      } else {
        console.warn('⚠️ Failed to load chapter images, status:', imageResponse.status)
      }

      console.log('✅ Final chapters loaded:', transformedChapters.length)
      setChapters(transformedChapters)
      
    } catch (error) {
      console.error('❌ Failed to load chapters:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveChapter = async (chapterId: number) => {
    try {
      const targetChapter = chapters.find((chapter) => chapter.id === chapterId)
      if (!targetChapter) return

      const title = editingTitles[chapterId] || targetChapter.title
      const content = editingContents[chapterId] || targetChapter.content

      if (targetChapter.dbId) {
        const updateResponse = await fetch(`/api/chapters/${targetChapter.dbId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: title,
            content: content
          })
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update chapter')
        }

        // Update local state
        setChapters(prev => prev.map(chapter => 
          chapter.id === chapterId 
            ? { ...chapter, title: title, content: content }
            : chapter
        ))

        console.log(`✅ Chapter ${chapterId} updated successfully`)
      }
    } catch (error) {
      console.error('❌ Failed to save chapter:', error)
    }
  }

  const handleImageUpload = async (chapterId: number, files: FileList) => {
    if (files.length === 0) return

    setUploadingImages(prev => new Set([...prev, chapterId]))

    try {
      const uploadedUrls: string[] = []

      // Resolve the correct DB chapter id to use for API calls
      const targetChapter = chapters.find((ch) => ch.id === chapterId)
      const dbIdNum = targetChapter?.dbId ? Number(targetChapter.dbId) : chapterId

      // Upload each file to storage, then persist metadata via /api/chapter-images
      for (const file of Array.from(files)) {
        // 1) Upload raw file to storage
        const uploadForm = new FormData()
        uploadForm.append('file', file)
        // Use DB id for storage naming (string form)
        uploadForm.append('chapterId', String(dbIdNum))

        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: uploadForm
        })

        if (!uploadRes.ok) {
          const errText = await uploadRes.text()
          throw new Error(`Failed storage upload: ${errText}`)
        }

        const { url, path } = await uploadRes.json()

        // 2) Persist image record to database
        const saveRes = await fetch('/api/chapter-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Use DB id number so it matches chapter_images.chapter_id
            chapterId: dbIdNum,
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

      // Update chapter images
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { ...chapter, images: [...chapter.images, ...uploadedUrls] }
          : chapter
      ))

      console.log(`✅ Uploaded ${uploadedUrls.length} images for chapter ${chapterId}`)
    } catch (error) {
      console.error('❌ Failed to upload images:', error)
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(chapterId)
        return newSet
      })
    }
  }

  const removeImage = async (chapterId: number, imageUrl: string) => {
    try {
      const response = await fetch(`/api/chapter-images?imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove image')
      }

      // Update local state
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId 
          ? { ...chapter, images: chapter.images.filter(img => img !== imageUrl) }
          : chapter
      ))

      console.log(`✅ Removed image from chapter ${chapterId}`)
    } catch (error) {
      console.error('❌ Failed to remove image:', error)
    }
  }

  const getChapterMainTitle = (title: string) => {
    if (!title) return `Chapter ${chapters.length}`
    
    // Extract main title from formats like "Chapter 1: Title" or "1. Title"
    const match = title.match(/^(?:Chapter\s+\d+:\s*|^\d+\.\s*)(.+)$/)
    return match ? match[1] : title
  }

  const addChapter = async () => {
    try {
      if (savingNewChapter) return
      const storyId = chapters[0]?.storyId
      if (!storyId) {
        console.error('❌ Cannot add chapter: missing storyId')
        return
      }
      const nextNumber = chapters.length > 0
        ? Math.max(...chapters.map(ch => ch.id)) + 1
        : 1

      setSavingNewChapter(true)

      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          chapterNumber: nextNumber,
          title: newChapterTitle || `Chapter ${nextNumber}`,
          content: newChapterContent || ''
        })
      })

      if (!res.ok) {
        const t = await res.text()
        throw new Error(`Failed to create chapter: ${t}`)
      }

      const created = await res.json()
      const dbId = created?.chapter?.id ?? created?.id ?? null

      const newChapter: Chapter = {
        id: nextNumber,
        dbId,
        storyId,
        title: newChapterTitle || `Chapter ${nextNumber}`,
        content: newChapterContent || '',
        images: []
      }

      setChapters(prev => {
        const updated = [...prev, newChapter].sort((a, b) => a.id - b.id)
        return updated
      })
      setEditingTitles(prev => ({ ...prev, [nextNumber]: newChapter.title }))
      setEditingContents(prev => ({ ...prev, [nextNumber]: newChapter.content }))

      setAddingChapter(false)
      setNewChapterTitle('')
      setNewChapterContent('')
      console.log(`✅ Added Chapter ${nextNumber}`)
    } catch (e) {
      console.error('❌ Error adding chapter:', e)
    } finally {
      setSavingNewChapter(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-pink-700 hover:text-pink-800 hover:bg-pink-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-serif font-bold text-pink-800">Chapter Management</h1>
                <p className="text-sm text-gray-600">Edit chapter content and manage images for your story</p>
              </div>
            </div>
            {!loading && chapters.length > 0 && (
              <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                {chapters.length} Chapters
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable Container */}
      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            <span className="ml-4 text-lg text-gray-600">Loading chapters...</span>
          </div>
        ) : (
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* Add new chapter section */}
            <Card className="border-2 border-pink-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-rose-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-serif text-gray-800">Add New Chapter</CardTitle>
                  <div className="flex gap-2">
                    {!addingChapter ? (
                      <Button onClick={() => setAddingChapter(true)} className="bg-pink-600 hover:bg-pink-700 text-white">
                        <Plus className="w-4 h-4 mr-1" />
                        New Chapter
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => { setAddingChapter(false); setNewChapterTitle(''); setNewChapterContent('') }}>
                          Cancel
                        </Button>
                        <Button onClick={addChapter} disabled={savingNewChapter} className="bg-green-600 hover:bg-green-700 text-white">
                          {savingNewChapter ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Save New Chapter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              {addingChapter && (
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Title</label>
                    <Input
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="Enter new chapter title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Content</label>
                    <Textarea
                      value={newChapterContent}
                      onChange={(e) => setNewChapterContent(e.target.value)}
                      className="min-h-[150px]"
                      placeholder="Enter new chapter content"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
            {chapters.length === 0 ? (
              <Card className="border-2 border-dashed border-pink-200">
                <CardContent className="py-24">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                    <p className="text-lg text-gray-500">No chapters available.</p>
                    <p className="text-sm text-gray-400 mt-2">Chapters will appear here once they are created.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Display ALL chapters simultaneously - NO dropdown/selection
              chapters.map((chapter) => (
                <Card key={chapter.id} className="border-2 border-pink-100 hover:border-pink-200 transition-colors shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-pink-50 to-rose-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-300 font-semibold">
                          Chapter {chapter.id}
                        </Badge>
                        <CardTitle className="text-xl font-serif text-gray-800">
                          {getChapterMainTitle(chapter.title)}
                        </CardTitle>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveChapter(chapter.id)}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save Chapter
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 p-6">
                    {/* Chapter Title and Content - Always Visible and Editable */}
                    <div className="space-y-4">
                      <div className="flex items-center mb-3">
                        <h4 className="font-semibold text-gray-900 flex items-center text-lg">
                          <FileText className="w-5 h-5 mr-2 text-pink-500" />
                          Chapter Content
                        </h4>
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Chapter Title</label>
                          <Input
                            value={editingTitles[chapter.id] || ''}
                            onChange={(e) => setEditingTitles(prev => ({
                              ...prev,
                              [chapter.id]: e.target.value
                            }))}
                            className="w-full text-lg font-medium border-2 border-gray-200 focus:border-pink-400 focus:ring-pink-200"
                            placeholder="Enter chapter title..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Chapter Content</label>
                          <Textarea
                            value={editingContents[chapter.id] || ''}
                            onChange={(e) => setEditingContents(prev => ({
                              ...prev,
                              [chapter.id]: e.target.value
                            }))}
                            className="w-full min-h-[250px] resize-y border-2 border-gray-200 focus:border-pink-400 focus:ring-pink-200"
                            placeholder="Enter chapter content..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Chapter Images Section - Always Visible */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center text-lg">
                          <ImageIcon className="w-5 h-5 mr-2 text-pink-500" />
                          Chapter Images ({chapter.images.length})
                        </h4>
                        <div className="flex space-x-2">
                          <input
                            ref={(el) => { fileInputRefs.current[chapter.id] = el }}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleImageUpload(chapter.id, e.target.files)}
                          />
                          <Button
                            size="sm"
                            onClick={() => fileInputRefs.current[chapter.id]?.click()}
                            disabled={uploadingImages.has(chapter.id)}
                            className="bg-pink-600 hover:bg-pink-700 text-white shadow-md"
                          >
                            {uploadingImages.has(chapter.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                            ) : (
                              <Plus className="w-4 h-4 mr-1" />
                            )}
                            Add Images
                          </Button>
                        </div>
                      </div>

                      {chapter.images.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 mb-3">📷 No images yet. Click "Add Images" below to upload.</p>
                          <Button
                            size="sm"
                            onClick={() => fileInputRefs.current[chapter.id]?.click()}
                            disabled={uploadingImages.has(chapter.id)}
                            className="bg-pink-600 hover:bg-pink-700 text-white"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload First Image
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {chapter.images.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                                <Image
                                  src={imageUrl}
                                  alt={`Chapter ${chapter.id} image ${index + 1}`}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeImage(chapter.id, imageUrl)}
                                  className="h-8 w-8 p-0 shadow-lg"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}