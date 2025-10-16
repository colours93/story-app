"use client"

import Link from "next/link"
import { PixelHeart } from "@/components/pixel-heart"
import { PixelHeartButton } from "@/components/pixel-heart-button"
import { KawaiiMatrixRain } from "@/components/kawaii-matrix-rain"

export default function HomePage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      {/* Kawaii Matrix Rain Background */}
      <KawaiiMatrixRain rainbow={true} speed={0.8} fontSize={16} opacity={0.5} zIndex={-2} />
      {/* Soft pink blurred background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-pink-100 via-pink-200 to-pink-300" />
      <div className="absolute inset-0 -z-10 backdrop-blur-[4px]" />

      {/* Center content */}
      <div className="text-center select-none">
        {/* Hearts row: small hearts are labeled buttons */}
        <div className="flex items-center justify-center gap-8 mb-2">
          <Link href="/login" aria-label="Sign In" className="block">
            <PixelHeartButton
              size={96}
              label="Sign In"
              labelClassName="text-xs sm:text-sm"
              shadow={false}
              palette={{ border: "#000000", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }}
              hoverPalette={{ border: "#000000", fill: "#db2777", shade: "#be185d", highlight: "#f9a8d4" }}
              activePalette={{ border: "#000000", fill: "#be185d", shade: "#9d174d", highlight: "#db2777" }}
            />
          </Link>
          <PixelHeart size={160} />
          <Link href="/signup" aria-label="Sign Up" className="block">
            <PixelHeartButton
              size={96}
              label="Sign Up"
              labelClassName="text-xs sm:text-sm"
              shadow={false}
              palette={{ border: "#000000", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }}
              hoverPalette={{ border: "#000000", fill: "#db2777", shade: "#be185d", highlight: "#f9a8d4" }}
              activePalette={{ border: "#000000", fill: "#be185d", shade: "#9d174d", highlight: "#db2777" }}
            />
          </Link>
        </div>

        {/* Title and tagline */}
        <div className="mb-1">
          <div className="text-6xl sm:text-7xl font-bubble font-bold">
            <span className="text-pink-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.65)]">
              Bambiland
            </span>
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-bubble text-black">XoXo</div>
        </div>
      </div>
    </div>
  )
}