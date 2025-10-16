"use client"

import { useEffect, useRef } from "react"

interface KawaiiMatrixRainProps {
  /**
   * Speed multiplier (default: 1)
   * Higher = faster falling
   */
  speed?: number
  /**
   * Character size in pixels (default: 16)
   */
  fontSize?: number
  /**
   * Opacity (default: 0.8)
   */
  opacity?: number
  /**
   * z-index (default: -1)
   */
  zIndex?: number
  /**
   * Whether to use rainbow colors (default: true)
   * If false, uses pink gradient
   */
  rainbow?: boolean
}

export function KawaiiMatrixRain({
  speed = 1,
  fontSize = 16,
  opacity = 0.8,
  zIndex = -1,
  rainbow = true,
}: KawaiiMatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Kawaii characters: hiragana, katakana, cute kanji, hearts, stars
    const kawaiiChars = 
      "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん" +
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
      "♡♥★☆✨💕💖💗💘💙💚💛💜🌸🌺🌻🌼🌷🎀🦋✿❀🧚🪄💫⭐️" +
      "可愛夢恋桜姫花虹星月雲空風水火光影" +
      "0123456789"

    const chars = kawaiiChars.split("")

    // Resize canvas to window
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = []

    // Initialize drops at random heights
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100
    }

    // Rainbow hue cycle
    let hueOffset = 0

    const draw = () => {
      // Semi-transparent black for trail effect
      ctx.fillStyle = `rgba(0, 0, 0, 0.05)`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        // Color logic
        if (rainbow) {
          // Rainbow cycling colors
          const hue = (hueOffset + (i * 10)) % 360
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${opacity})`
        } else {
          // Pink gradient
          const pinkVariant = Math.floor(Math.random() * 5)
          const pinks = [
            `rgba(255, 182, 193, ${opacity})`, // light pink
            `rgba(255, 105, 180, ${opacity})`, // hot pink
            `rgba(255, 20, 147, ${opacity})`,  // deep pink
            `rgba(255, 192, 203, ${opacity})`, // pink
            `rgba(255, 228, 225, ${opacity})`, // misty rose
          ]
          ctx.fillStyle = pinks[pinkVariant]
        }

        ctx.fillText(char, x, y)

        // Reset drop to top if it goes beyond screen
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        // Move drop down
        drops[i] += speed * 0.5
      }

      // Increment hue for rainbow effect
      hueOffset = (hueOffset + 1) % 360
    }

    const interval = setInterval(draw, 33) // ~30 FPS

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resize)
    }
  }, [speed, fontSize, opacity, rainbow])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex,
        opacity,
      }}
      aria-hidden="true"
    />
  )
}
