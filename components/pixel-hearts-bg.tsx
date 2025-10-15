import React from "react"
import { PixelHeart } from "./pixel-heart"

export default function PixelHeartsBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Diagonal scatter from top-left to bottom-right */}
      <div className="absolute top-[8%] left-[6%] heart-float-diagonal heart-float-slow opacity-90">
        <PixelHeart size={80} />
      </div>
      <div className="absolute top-[28%] left-[26%] heart-float-diagonal opacity-90">
        <PixelHeart size={112} />
      </div>
      <div className="absolute top-[52%] left-[48%] heart-float-diagonal heart-float-fast opacity-90">
        <PixelHeart size={72} />
      </div>
      <div className="absolute top-[74%] left-[68%] heart-float-diagonal opacity-90">
        <PixelHeart size={96} />
      </div>
      <div className="absolute top-[16%] left-[78%] heart-float-diagonal heart-float-slow opacity-90">
        <PixelHeart size={64} />
      </div>
    </div>
  )
}