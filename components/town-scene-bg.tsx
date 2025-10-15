"use client"

import React, { useEffect, useRef } from "react"

type RGB = { r: number; g: number; b: number }
type Palette = { border: RGB; hair: RGB; skin: RGB; dress: RGB }
const rgb = ({ r, g, b }: RGB, a = 1) => `rgba(${r},${g},${b},${a})`

// Side-view parallax scene tuned for pink/purple aesthetics
const WORLD_SCALE = 3.2
const TILE_W = 140 * WORLD_SCALE
const GROUND_H = 90 * WORLD_SCALE
// Scale used for tiny background girls (heaps smaller)
const GIRLS_BG_SCALE = 0.18

const PALETTES: Palette[] = [
  { border: { r: 0, g: 0, b: 0 }, hair: { r: 236, g: 72, b: 153 }, skin: { r: 253, g: 226, b: 228 }, dress: { r: 244, g: 114, b: 182 } }, // pink
  { border: { r: 0, g: 0, b: 0 }, hair: { r: 147, g: 51, b: 234 }, skin: { r: 253, g: 226, b: 228 }, dress: { r: 192, g: 132, b: 252 } }, // purple
  { border: { r: 0, g: 0, b: 0 }, hair: { r: 168, g: 85, b: 247 }, skin: { r: 253, g: 226, b: 228 }, dress: { r: 216, g: 180, b: 254 } }, // light purple
  { border: { r: 0, g: 0, b: 0 }, hair: { r: 59, g: 130, b: 246 }, skin: { r: 253, g: 226, b: 228 }, dress: { r: 125, g: 211, b: 252 } }, // blue accent
  { border: { r: 0, g: 0, b: 0 }, hair: { r: 13, g: 148, b: 136 }, skin: { r: 253, g: 226, b: 228 }, dress: { r: 110, g: 231, b: 183 } }, // teal accent
]

type Sprite = { x: number; y: number; vx: number; palette: number; size: number; variant: number }

export default function TownSceneBg() {
  const ref = useRef<HTMLCanvasElement>(null)
  const run = useRef(true)
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    // Keep pixel art crisp when drawing spritesheets
    ctx.imageSmoothingEnabled = false
    const resize = () => {
      const p = c.parentElement; if (!p) return
      const w = p.clientWidth, h = p.clientHeight
      c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr)
      c.style.width = `${w}px`; c.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize(); window.addEventListener("resize", resize)

    // Disable foreground blocky sprites; we'll use the exact provided spritesheet in the background
    const sprites: Sprite[] = []

    // Load girls sprite sheet (expected 3x3 grid frames like the image you shared)
    // Place the file at: story-app/public/girls-sprites.png
    let girlsImg: HTMLImageElement | null = null
    let girlsReady = false
    let girlsCols = 3, girlsRows = 3
    let frameW = 0, frameH = 0
    const girls = new Image()
    girls.crossOrigin = "anonymous"
    girls.src = "/girls-sprites.png" // drop your exact image here
    girls.onload = () => {
      girlsImg = girls
      girlsReady = true
      frameW = Math.floor(girls.width / girlsCols)
      frameH = Math.floor(girls.height / girlsRows)
    }

    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const speed = prefersReduce ? 0.35 : 1

    let offFar = 0, offMid = 0, offNear = 0, offGirls = 0

    const sky = (w: number, h: number, t: number) => {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, "#ffe4e6")
      g.addColorStop(0.5, "#fbcfe8")
      g.addColorStop(1, "#f9a8d4")
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      const cloud = (x: number, y: number, r: number, a: number) => {
        ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + r * 0.8, y + r * 0.1, r * 0.9, 0, Math.PI * 2); ctx.arc(x - r * 0.6, y + r * 0.2, r * 0.7, 0, Math.PI * 2); ctx.fill()
      }
      const baseY = h * 0.18
      const off = offFar % TILE_W
      for (let x = -TILE_W + off; x < w + TILE_W; x += TILE_W) {
        cloud(x + 30, baseY + Math.sin(t * 0.0006 + x * 0.01) * 6, 26, 0.35)
        cloud(x + 90, baseY + 18 + Math.cos(t * 0.0005 + x * 0.01) * 4, 22, 0.3)
      }
    }

    const backBuildings = (w: number, h: number) => {
      const off = offFar % TILE_W
      for (let x = -TILE_W + off; x < w + TILE_W; x += TILE_W) {
        const baseY = h * 0.45
        const bw = 80 * WORLD_SCALE, bh = 70 * WORLD_SCALE
        ctx.fillStyle = "#e9d5ff" // pale purple
        ctx.fillRect(x + 10, baseY - bh, bw, bh)
        ctx.fillStyle = "#d8b4fe"
        ctx.beginPath(); ctx.moveTo(x + 10, baseY - bh); ctx.lineTo(x + 10 + bw / 2, baseY - bh - 30 * WORLD_SCALE); ctx.lineTo(x + 10 + bw, baseY - bh); ctx.closePath(); ctx.fill()
        // windows
        ctx.fillStyle = "rgba(255,255,255,0.9)"
        for (let i = 0; i < 3; i++) ctx.fillRect(x + 20 + i * 18 * WORLD_SCALE, baseY - bh + 18 * WORLD_SCALE, 12 * WORLD_SCALE, 10 * WORLD_SCALE)
      }
    }

    const houseTile = (x: number, y: number, s = 1.8, hue = 300) => {
      const S = s * WORLD_SCALE
      const roof = `hsl(${hue},80%,55%)`, wall = `hsl(${hue},70%,88%)`, door = `hsl(${hue},60%,35%)`
      ctx.fillStyle = wall; ctx.fillRect(x, y, 90 * S, 60 * S)
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 10 * S, y); ctx.lineTo(x + 45 * S, y - 26 * S); ctx.lineTo(x + 100 * S, y); ctx.closePath(); ctx.fill()
      ctx.fillStyle = door; ctx.fillRect(x + 40 * S, y + 26 * S, 12 * S, 24 * S)
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(x + 16 * S, y + 16 * S, 16 * S, 12 * S); ctx.fillRect(x + 66 * S, y + 16 * S, 16 * S, 12 * S)
    }

    // Draw a tiny girl sprite from the provided sprite sheet
    const drawGirlFromSheet = (
      img: HTMLImageElement,
      frameIndex: number,
      dxCenter: number,
      baseY: number,
      scale: number
    ) => {
      const col = frameIndex % girlsCols
      const row = Math.floor(frameIndex / girlsCols)
      const sx = col * frameW
      const sy = row * frameH
      const dw = Math.max(1, Math.floor(frameW * scale))
      const dh = Math.max(1, Math.floor(frameH * scale))
      const dx = Math.floor(dxCenter - dw / 2)
      const dy = Math.floor(baseY - dh)
      ctx.drawImage(img, sx, sy, frameW, frameH, dx, dy, dw, dh)
    }

    const fence = (w: number, h: number) => {
      const off = offNear % (TILE_W / 2)
      const y = h - GROUND_H + 10 * WORLD_SCALE
      ctx.fillStyle = "#f5d0fe" // soft purple pink
      for (let x = -TILE_W + off; x < w + TILE_W; x += TILE_W / 2) {
        ctx.fillRect(x, y - 26 * WORLD_SCALE, 6 * WORLD_SCALE, 26 * WORLD_SCALE)
        ctx.fillRect(x, y - 6 * WORLD_SCALE, TILE_W / 2, 6 * WORLD_SCALE)
      }
    }

    const ground = (w: number, h: number) => {
      const y = h - GROUND_H
      ctx.fillStyle = "#fbcfe8"
      ctx.fillRect(0, y, w, GROUND_H)
      // cobblestone dashes
      const off = offNear % 30
      ctx.fillStyle = "rgba(148,163,184,0.35)"
      for (let x = -60 + off; x < w + 60; x += 30) ctx.fillRect(x, y + 24 * WORLD_SCALE, 14 * WORLD_SCALE, 6 * WORLD_SCALE)
    }

    const lamp = (x: number, h: number, t: number) => {
      const y = h - GROUND_H - 40 * WORLD_SCALE
      ctx.fillStyle = "rgb(55,65,81)"; ctx.fillRect(x, y, 6 * WORLD_SCALE, 40 * WORLD_SCALE)
      const glow = 0.7 + Math.sin(t * 0.003 + x * 0.05) * 0.3
      ctx.fillStyle = `rgba(253,224,71,${glow})`; ctx.fillRect(x - 6 * WORLD_SCALE, y - 10 * WORLD_SCALE, 18 * WORLD_SCALE, 12 * WORLD_SCALE)
      ctx.beginPath(); ctx.arc(x + 3 * WORLD_SCALE, y - 6 * WORLD_SCALE, 18 * WORLD_SCALE, 0, Math.PI * 2); ctx.fill()
    }

    // Blocky pixel sprites (Minecraft-style): H=hair, S=skin, D=dress, .=empty
    const SPRITE_VARIANTS: string[][] = [
      // Long wavy hair
      [
        "....HHHH....",
        "...HHHHHH...",
        "..HHHHHHHH..",
        "..HHHSSHHH..",
        ".HHHSSSSHHH.",
        ".HHHSSSSHHH.",
        "..HHHDDHHH..",
        "..HDDDDDH..",
        ".HDDDDDDDH.",
        ".HDDDDDDDH.",
        "..HDDDDDH..",
        "...HDDDD...",
        "....HDDH....",
        "............",
      ],
      // Twin tails
      [
        "..HHH..HHH..",
        ".HHHHHHHHHH.",
        ".HHHHHHHHHH.",
        ".HHHSSSSHHH.",
        ".HHHSSSSHHH.",
        "..HHSSSSHH..",
        "..HHHDDHHH..",
        "..HDDDDDH..",
        ".HDDDDDDDH.",
        ".HDDDDDDDH.",
        "..HDDDDDH..",
        "...HDDDD...",
        "....HDDH....",
        "............",
      ],
      // Short bob
      [
        "...HHHHHH...",
        "..HHHHHHHH..",
        "..HHHSSHHH..",
        ".HHHSSSSHHH.",
        "..HHSSSSHH..",
        "..HHHDDHHH..",
        "..HDDDDDH..",
        ".HDDDDDDDH.",
        ".HDDDDDDDH.",
        "..HDDDDDH..",
        "...HDDDD...",
        "....HDDH....",
        "............",
        "............",
      ],
      // Ponytail
      [
        "....HHHHHH..",
        "...HHHHHHHH.",
        "..HHHHHHHHH.",
        "..HHHSSHHHH.",
        ".HHHSSSSHHH.",
        ".HHHSSSSHHH.",
        "..HHHDDHHH..",
        "..HDDDDDH..",
        ".HDDDDDDDH.",
        ".HDDDDDDDH.",
        "..HDDDDDH..",
        "...HDDDD...",
        "....HDDH....",
        "............",
      ],
      // Straight long
      [
        "..HHHHHHHH..",
        ".HHHHHHHHHH.",
        ".HHHHHHHHHH.",
        ".HHHSSSSHHH.",
        ".HHHSSSSHHH.",
        ".HHHSSSSHHH.",
        "..HHHDDHHH..",
        "..HDDDDDH..",
        ".HDDDDDDDH.",
        ".HDDDDDDDH.",
        "..HDDDDDH..",
        "...HDDDD...",
        "....HDDH....",
        "............",
      ],
    ]

    const drawPixelSprite = (map: string[], p: Palette, xCenter: number, baseY: number, unit: number, frame: number) => {
      const h = map.length, w = map[0]?.length || 0
      const x0 = xCenter - (w * unit) / 2
      const y0 = baseY - h * unit
      ctx.lineWidth = Math.max(1, unit * 0.15)
      for (let i = 0; i < h; i++) {
        const row = map[i]
        for (let j = 0; j < w; j++) {
          const ch = row[j]
          if (ch === '.') continue
          const x = x0 + j * unit
          const y = y0 + i * unit
          if (ch === 'H') ctx.fillStyle = rgb(p.hair)
          else if (ch === 'S') ctx.fillStyle = rgb(p.skin)
          else ctx.fillStyle = rgb(p.dress)
          ctx.fillRect(x, y, unit, unit)
          ctx.strokeStyle = rgb(p.border)
          ctx.strokeRect(x + 0.5, y + 0.5, unit - 1, unit - 1)
        }
      }
      // Running legs: two blocks toggling positions
      const legY = baseY + unit * 2
      ctx.fillStyle = rgb(p.border)
      const lx = x0 + w * unit * 0.35
      const rx = x0 + w * unit * 0.65
      if (frame === 0) {
        ctx.fillRect(lx, legY, unit, unit * 1.2)
        ctx.fillRect(rx, legY - unit * 0.5, unit, unit * 1.2)
      } else {
        ctx.fillRect(lx + unit * 0.5, legY - unit * 0.5, unit, unit * 1.2)
        ctx.fillRect(rx - unit * 0.5, legY, unit, unit * 1.2)
      }
    }

    const sprite = (s: Sprite, t: number, w: number, h: number) => {
      const p = PALETTES[s.palette]
      const frame = Math.floor(t / 120) % 2
      const x = s.x
      const baseY = h - GROUND_H - 6 * WORLD_SCALE + Math.sin(t * 0.006 + x * 0.02) * 2 * WORLD_SCALE
      const unit = Math.max(3, Math.floor(s.size * 0.16))
      const map = SPRITE_VARIANTS[s.variant % SPRITE_VARIANTS.length]
      drawPixelSprite(map, p, x, baseY, unit, frame)
    }

    let raf = 0
    const loop = (t: number) => {
      if (!run.current) return
      const w = c.width / dpr, h = c.height / dpr

      // background layers
      sky(w, h, t)
      backBuildings(w, h)

      // parallax offsets
      offFar = (offFar - 0.15 * speed + TILE_W) % TILE_W
      offMid = (offMid - 0.35 * speed + TILE_W) % TILE_W
      offNear = (offNear - 0.8 * speed + TILE_W) % TILE_W
      offGirls = (offGirls - 0.22 * speed + TILE_W) % TILE_W

      // tiny girls in far background (behind houses), using exact sprite sheet
      if (girlsReady && girlsImg) {
        const baseYGirls = h * 0.42 // slightly above house roofline
        const startGirls = -TILE_W + offGirls
        let frame = 0
        for (let x = startGirls; x < w + TILE_W; x += TILE_W) {
          // draw 3 girls per tile span with different frames
          drawGirlFromSheet(girlsImg, frame % 9, x + TILE_W * 0.25, baseYGirls, GIRLS_BG_SCALE)
          drawGirlFromSheet(girlsImg, (frame + 1) % 9, x + TILE_W * 0.50, baseYGirls + 6 * WORLD_SCALE, GIRLS_BG_SCALE)
          drawGirlFromSheet(girlsImg, (frame + 2) % 9, x + TILE_W * 0.75, baseYGirls - 4 * WORLD_SCALE, GIRLS_BG_SCALE)
          frame += 3
        }
      }

      // mid houses row
      const houseY = h - GROUND_H - 120 * WORLD_SCALE
      const startMid = -TILE_W + offMid
      for (let x = startMid; x < w + TILE_W; x += TILE_W) houseTile(x + 10, houseY, 1.9, 280)

      // fence + ground
      fence(w, h)
      ground(w, h)

      // lamps along near layer
      const startNear = -TILE_W + offNear
      lamp(startNear + TILE_W * 0.25, h, t)
      lamp(startNear + TILE_W * 0.65, h, t)
      lamp(startNear + TILE_W * 1.05, h, t)

      // foreground blocky sprites removed in favor of exact background spritesheet
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { run.current = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])

  return <div aria-hidden className="pointer-events-none absolute inset-0 z-0"><canvas ref={ref} className="w-full h-full" /></div>
}