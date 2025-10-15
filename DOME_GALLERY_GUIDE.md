# Dome Gallery Customization Guide

## 🎨 How to Add Your Own Images

### Method 1: Direct Image URLs (Recommended)
Update the `images` prop in your login/signup pages:

```tsx
// In app/login/page.tsx or app/signup/page.tsx
<DomeGallery
  images={[
    "https://your-image-url-1.jpg",
    "https://your-image-url-2.jpg",
    "https://your-image-url-3.jpg",
    // Add more URLs...
  ]}
  overlayBlurColor="rgba(255, 245, 248, 0.3)"
  grayscale={false}
/>
```

### Method 2: With Alt Text
For better accessibility:

```tsx
<DomeGallery
  images={[
    { src: "https://your-image-url-1.jpg", alt: "Description 1" },
    { src: "https://your-image-url-2.jpg", alt: "Description 2" },
    { src: "https://your-image-url-3.jpg", alt: "Description 3" },
  ]}
  overlayBlurColor="rgba(255, 245, 248, 0.3)"
  grayscale={false}
/>
```

### Method 3: Local Images
Put images in the `public` folder and reference them:

```tsx
<DomeGallery
  images={[
    "/images/photo1.jpg",
    "/images/photo2.jpg",
    "/images/photo3.jpg",
  ]}
  overlayBlurColor="rgba(255, 245, 248, 0.3)"
  grayscale={false}
/>
```

## ⚙️ Customization Options

### Image Size Controls
```tsx
<DomeGallery
  // Overall dome size (0-1, default: 0.7 for larger images)
  fit={0.7}
  
  // Minimum radius in pixels (default: 800 for larger images)
  minRadius={800}
  
  // Clicked image size (default: 600px for larger images)
  openedImageWidth="600px"
  openedImageHeight="600px"
  
  // Tile border radius
  imageBorderRadius="30px"
  openedImageBorderRadius="30px"
/>
```

### Visual Effects
```tsx
<DomeGallery
  // Background blur color
  overlayBlurColor="rgba(255, 245, 248, 0.3)"
  
  // Enable/disable grayscale filter
  grayscale={false}
  
  // Number of image segments
  segments={35}
/>
```

### Interaction Controls
```tsx
<DomeGallery
  // Drag sensitivity (lower = more sensitive)
  dragSensitivity={20}
  
  // Drag dampening (0-1, higher = smoother)
  dragDampening={2}
  
  // Max vertical rotation in degrees
  maxVerticalRotationDeg={5}
  
  // Enlarge transition speed in ms
  enlargeTransitionMs={300}
/>
```

## 🎯 Current Setup

### Login Page (`app/login/page.tsx`)
- Background: Dome Gallery with pink tint
- Images: Larger size (fit=0.7, minRadius=800)
- Click effect: 600x600px enlarged image
- Color: `rgba(255, 245, 248, 0.3)` (soft pink)

### Signup Page (`app/signup/page.tsx`)
- Background: Dome Gallery with purple tint
- Images: Same larger size
- Color: `rgba(245, 240, 255, 0.3)` (soft purple)

## 🚀 Image Size Changes Made

I've increased the image sizes from the defaults:
- `fit`: 0.5 → **0.7** (40% larger dome)
- `minRadius`: 600px → **800px** (33% larger minimum)
- `openedImageWidth`: 400px → **600px** (50% larger when clicked)
- `openedImageHeight`: 400px → **600px** (50% larger when clicked)

## 💡 Tips

1. **Image Count**: The dome can hold many images (175 slots with default 35 segments)
2. **Performance**: Use optimized images (WebP format recommended)
3. **Image Size**: Recommended dimensions: 800x800px or larger
4. **Aspect Ratio**: Square images work best
5. **File Size**: Keep under 500KB per image for best performance

## 🔧 Quick Examples

### Different Colors for Each Page
```tsx
// Login page - warm pink
<DomeGallery
  overlayBlurColor="rgba(255, 245, 248, 0.3)"
  grayscale={false}
/>

// Signup page - cool purple
<DomeGallery
  overlayBlurColor="rgba(245, 240, 255, 0.3)"
  grayscale={false}
/>
```

### Make Images Even Bigger
```tsx
<DomeGallery
  fit={0.9}
  minRadius={1000}
  openedImageWidth="800px"
  openedImageHeight="800px"
/>
```

### Enable Grayscale with Color on Hover
```tsx
<DomeGallery
  grayscale={true}  // Images are grayscale by default
  // Color appears when image is enlarged
/>
```

## 📍 File Locations

- Component: `components/ui/dome-gallery.tsx`
- Login page: `app/login/page.tsx`
- Signup page: `app/signup/page.tsx`

## 🎮 User Interactions

- **Drag**: Rotate the dome left/right and up/down
- **Click/Tap**: Enlarge an image
- **Click Background**: Close enlarged image
- **ESC Key**: Close enlarged image
- **Smooth Inertia**: Dome continues spinning after drag
