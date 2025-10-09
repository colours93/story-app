"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Plus, Trash2, Edit2, Check } from "lucide-react"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface ImageUploadPanelProps {
  chapters: Array<{ id: number; title: string; content: string; images: string[] }>
  onImageUpdate: (chapterId: number, imageUrls: string[]) => void
  onTextUpdate: (chapterId: number, title: string, content: string) => void
}

export function ImageUploadPanel({ chapters, onImageUpdate, onTextUpdate }: ImageUploadPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  const handleFileChange = (chapterId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const chapter = chapters.find((c) => c.id === chapterId)
      if (!chapter) return

      const readers = Array.from(files).map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(file)
        })
      })

      Promise.all(readers).then((results) => {
        const newImages = [...chapter.images, ...results]
        onImageUpdate(chapterId, newImages)
      })
    }
  }

  const handleRemoveImage = (chapterId: number, imageIndex: number) => {
    const chapter = chapters.find((c) => c.id === chapterId)
    if (!chapter) return

    const newImages = chapter.images.filter((_, index) => index !== imageIndex)
    onImageUpdate(chapterId, newImages)
  }

  const startEditing = (chapter: { id: number; title: string; content: string }) => {
    setEditingChapter(chapter.id)
    setEditTitle(chapter.title)
    setEditContent(chapter.content)
  }

  const saveEditing = () => {
    if (editingChapter) {
      onTextUpdate(editingChapter, editTitle, editContent)
      setEditingChapter(null)
    }
  }

  const cancelEditing = () => {
    setEditingChapter(null)
    setEditTitle("")
    setEditContent("")
  }

  return (
    <>
      {/* Floating Upload Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-[9999] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all border-2 border-white"
        aria-label="Upload chapter images"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
      </button>

      {/* Upload Panel - Modal Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-serif text-gray-900 dark:text-white">Manage Chapters ({chapters.length})</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
                {editingChapter === chapter.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="font-semibold"
                      placeholder="Chapter title"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[200px] text-sm"
                      placeholder="Chapter content"
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveEditing} size="sm" className="flex-1">
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={cancelEditing} size="sm" variant="outline" className="flex-1 bg-transparent">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white flex-1">{chapter.title}</h4>
                      <Button onClick={() => startEditing(chapter)} size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto pr-2 scrollbar-thin">
                      <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">{chapter.content}</p>
                    </div>
                  </div>
                )}

                {chapter.images && chapter.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {chapter.images.map((image, imageIndex) => (
                      <div key={imageIndex} className="relative group">
                        <div className="relative w-full h-24 rounded overflow-hidden bg-muted">
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`Chapter ${chapter.id} - Image ${imageIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveImage(chapter.id, imageIndex)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic p-3 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                    📷 No images yet. Click "Add Images" below to upload.
                  </div>
                )}

                <label htmlFor={`upload-${chapter.id}`}>
                  <Button variant="outline" size="sm" className="w-full cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-blue-500" asChild>
                    <span>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Images
                    </span>
                  </Button>
                  <input
                    id={`upload-${chapter.id}`}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileChange(chapter.id, e)}
                  />
                </label>
              </div>
            ))}
          </div>
          </div>
        </>
      )}
    </>
  )
}
