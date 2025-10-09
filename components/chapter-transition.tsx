"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { X } from "lucide-react"

interface Chapter {
  id: number
  title: string
  content: string
  images: string[]
}

interface ChapterTransitionProps {
  chapter: Chapter
  isVisible: boolean
}

export function ChapterTransition({ chapter, isVisible }: ChapterTransitionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [sectionVisible, setSectionVisible] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (chapter?.id) {
      setCurrentImageIndex(0)
      setImageLoaded(false)
    }
  }, [chapter?.id])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setSectionVisible(entry.isIntersecting)
        })
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

  const goToNext = () => {
    if (currentImageIndex < chapter.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
      setImageLoaded(false)
    }
  }

  const goToPrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
      setImageLoaded(false)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const imageWidth = rect.width
    
    // Define edge zones (20% on each side)
    const edgeZone = imageWidth * 0.2
    
    if (clickX < edgeZone && currentImageIndex > 0) {
      // Clicked on left edge - go to previous
      goToPrevious()
    } else if (clickX > imageWidth - edgeZone && currentImageIndex < chapter.images.length - 1) {
      // Clicked on right edge - go to next
      goToNext()
    } else {
      // Clicked in center - open fullscreen
      setIsFullscreen(true)
    }
  }

  const handleFullscreenImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const imageWidth = rect.width
    
    // Define edge zones (30% on each side for fullscreen)
    const edgeZone = imageWidth * 0.3
    
    if (clickX < edgeZone && currentImageIndex > 0) {
      goToPrevious()
    } else if (clickX > imageWidth - edgeZone && currentImageIndex < chapter.images.length - 1) {
      goToNext()
    }
  }

  if (!chapter || !chapter.images || chapter.images.length === 0) {
    return null
  }

  return (
    <>
      <section 
        ref={sectionRef}
        className="relative min-h-screen flex items-center justify-center py-32 px-8 overflow-hidden"
      >
        {/* Frozen blurred background within section */}
        <div className="absolute inset-0 z-0">
          <Image
            src={chapter.images[currentImageIndex]}
            alt={`${chapter.title} background`}
            fill
            className="object-cover blur-3xl opacity-30"
          />
          {/* Dark overlay for better contrast */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Main image with scroll-triggered animation and gaps */}
        <div className={`relative z-10 max-w-3xl max-h-[70vh] mx-auto transition-all duration-1000 ${
          sectionVisible 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-12 scale-95"
        }`}>
          <div className="relative cursor-pointer" onClick={handleImageClick}>
            <Image
              src={chapter.images[currentImageIndex]}
              alt={`${chapter.title} - Image ${currentImageIndex + 1}`}
              width={800}
              height={600}
              className={`object-contain rounded-lg shadow-2xl transition-all duration-700 hover:scale-105 ${
                imageLoaded 
                  ? "scale-100 opacity-100" 
                  : "scale-90 opacity-0"
              }`}
              onLoad={handleImageLoad}
              priority
            />
          </div>

          {/* Image counter - smaller and transparent */}
          {chapter.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
              {currentImageIndex + 1} / {chapter.images.length}
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Dark blurred overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsFullscreen(false)} />
          
          {/* Fullscreen image container */}
          <div className="relative z-10 max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            <div className="relative cursor-pointer" onClick={handleFullscreenImageClick}>
              <Image
                src={chapter.images[currentImageIndex]}
                alt={`${chapter.title} - Image ${currentImageIndex + 1}`}
                width={1200}
                height={900}
                className="object-contain max-w-[95vw] max-h-[95vh] rounded-lg shadow-2xl"
                priority
              />
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-8 right-8 p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Fullscreen image counter - smaller and transparent */}
            {chapter.images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {currentImageIndex + 1} / {chapter.images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
