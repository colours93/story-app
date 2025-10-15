import React from "react"
import { PixelGirl } from "./pixel-girl"

export default function PixelGirlsBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* A few bimbo sprites drifting softly across the scene */}
      <div className="absolute bottom-[14%] left-[12%] sprite-float-diagonal sprite-bob opacity-95">
        <PixelGirl size={60} />
      </div>
      <div className="absolute bottom-[22%] left-[36%] sprite-float-diagonal opacity-95">
        <PixelGirl size={72} />
      </div>
      <div className="absolute bottom-[26%] left-[58%] sprite-float-diagonal sprite-bob opacity-95">
        <PixelGirl size={56} />
      </div>
      <div className="absolute bottom-[18%] left-[78%] sprite-float-diagonal opacity-95">
        <PixelGirl size={68} />
      </div>
    </div>
  )
}