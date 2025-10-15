"use client"

import React, { useState } from "react"
import { PixelHeart } from "@/components/pixel-heart"
import { cn } from "@/lib/utils"

type Props = {
  size?: number
  label?: string
  labelClassName?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  selected?: boolean
  palette?: {
    border?: string
    fill?: string
    shade?: string
    highlight?: string
  }
  shadow?: boolean
  hoverPalette?: {
    border?: string
    fill?: string
    shade?: string
    highlight?: string
  }
  activePalette?: {
    border?: string
    fill?: string
    shade?: string
    highlight?: string
  }
}

export function PixelHeartButton({
  size = 120,
  label = "",
  labelClassName,
  type = "button",
  disabled = false,
  className,
  onClick,
  selected = false,
  palette,
  shadow = true,
  hoverPalette,
  activePalette,
}: Props) {
  const [currentPalette, setCurrentPalette] = useState(palette)
  // Keep the palette in sync when selected state or palettes change
  React.useEffect(() => {
    if (selected) {
      setCurrentPalette(activePalette || hoverPalette || palette)
    } else {
      setCurrentPalette(palette)
    }
  }, [selected, palette, hoverPalette, activePalette])
  const handleEnter = () => {
    if (selected) return
    if (hoverPalette) setCurrentPalette(hoverPalette)
  }
  const handleLeave = () => {
    if (selected) return
    setCurrentPalette(palette)
  }
  const handleDown = () => {
    if (selected) return
    if (activePalette) setCurrentPalette(activePalette)
  }
  const handleUp = () => {
    if (selected) return
    if (hoverPalette) setCurrentPalette(hoverPalette)
    else setCurrentPalette(palette)
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-block select-none",
        "transition-transform duration-200",
        disabled ? "opacity-85" : "hover:scale-[1.03] active:scale-[0.98]",
        className
      )}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      aria-label={label || "heart button"}
    >
      <div className={shadow ? "drop-shadow-[0_8px_20px_rgba(236,72,153,0.35)]" : undefined}>
        <PixelHeart size={size} palette={currentPalette} />
      </div>
      {label && (
        <span
          className={cn("absolute inset-0 flex items-center justify-center text-white font-bubble font-bold", labelClassName)}
          style={{ pointerEvents: "none" }}
        >
          {label}
        </span>
      )}
    </button>
  )}