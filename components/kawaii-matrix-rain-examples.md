# Kawaii Matrix Rain Component 🌸✨

A cute Japanese character rain effect inspired by The Matrix, but kawaii! Perfect for the Bambiland aesthetic.

## Features

- 🌈 Rainbow colors or pink gradient
- 💕 Japanese characters (hiragana, katakana, kanji)
- ⭐ Hearts, stars, and cute symbols
- 🎀 Customizable speed, size, and opacity
- 🦋 Canvas-based animation (performant)

## Basic Usage

### Rainbow Effect (Default)
```tsx
import { KawaiiMatrixRain } from "@/components/kawaii-matrix-rain"

export default function MyPage() {
  return (
    <div>
      <KawaiiMatrixRain />
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  )
}
```

### Pink Gradient (Bambi Style)
```tsx
<KawaiiMatrixRain rainbow={false} opacity={0.6} />
```

### Faster + Larger Characters
```tsx
<KawaiiMatrixRain speed={2} fontSize={20} />
```

### Subtle Background
```tsx
<KawaiiMatrixRain speed={0.5} fontSize={14} opacity={0.3} />
```

### Above Content (Overlay)
```tsx
<KawaiiMatrixRain zIndex={50} opacity={0.5} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `speed` | `number` | `1` | Speed multiplier (higher = faster) |
| `fontSize` | `number` | `16` | Character size in pixels |
| `opacity` | `number` | `0.8` | Canvas opacity (0-1) |
| `zIndex` | `number` | `-1` | CSS z-index (negative = behind content) |
| `rainbow` | `boolean` | `true` | Use rainbow colors vs pink gradient |

## Example Pages

### Landing Page with Subtle Pink Rain
```tsx
export default function HomePage() {
  return (
    <>
      <KawaiiMatrixRain rainbow={false} speed={0.8} opacity={0.4} />
      <div className="relative z-10">
        {/* Landing content */}
      </div>
    </>
  )
}
```

### Login Page with Rainbow Sparkle
```tsx
export default function LoginPage() {
  return (
    <>
      <KawaiiMatrixRain speed={1.5} fontSize={18} />
      <div className="relative z-10">
        {/* Login form */}
      </div>
    </>
  )
}
```

### Profile Page with Slow Pink Drift
```tsx
export default function ProfilePage() {
  return (
    <>
      <KawaiiMatrixRain rainbow={false} speed={0.5} fontSize={14} opacity={0.3} />
      <div className="relative z-10">
        {/* Profile content */}
      </div>
    </>
  )
}
```

## Characters Used

The component randomly picks from:
- **Hiragana**: あいうえお... (all 46)
- **Katakana**: アイウエオ... (all 46)
- **Cute Kanji**: 可愛 (cute), 夢 (dream), 恋 (love), 桜 (cherry blossom), 姫 (princess), 花 (flower), 虹 (rainbow), 星 (star), 月 (moon), etc.
- **Symbols**: ♡♥★☆✨💕💖💗💘🌸🌺🎀🦋✿❀🧚🪄💫⭐️
- **Numbers**: 0-9

## Tips

1. **Performance**: Uses canvas with ~30 FPS, optimized for smooth animation
2. **Layering**: Set `zIndex={-1}` for background, `zIndex={50}` for overlay
3. **Readability**: Lower `opacity` (0.3-0.5) if text becomes hard to read
4. **Mobile**: Automatically resizes to fit screen

## Styling with Existing Components

Combine with other Bambiland components:

```tsx
import { KawaiiMatrixRain } from "@/components/kawaii-matrix-rain"
import { PixelHeartsBg } from "@/components/pixel-hearts-bg"

export default function MagicalPage() {
  return (
    <>
      {/* Matrix rain in back */}
      <KawaiiMatrixRain rainbow={false} zIndex={-2} opacity={0.3} />
      {/* Pixel hearts on top */}
      <PixelHeartsBg />
      {/* Content */}
      <div className="relative z-10">...</div>
    </>
  )
}
```

## Inspiration

Based on the classic Matrix rain effect but reimagined with:
- Kawaii aesthetic 🎀
- Japanese characters and hearts 💕
- Rainbow or pink color schemes 🌈
- Perfect for Bambi Sleep themed apps ✨
