import React, { useEffect, useRef } from "react";

type PixelPreloaderProps = {
  className?: string;
  count?: number; // number of moving pixels
  squareSize?: number; // base square size in px
  speed?: number; // base speed multiplier
  colors?: string[]; // pixel colors
  backgroundAlpha?: number; // canvas background alpha
};

type Pixel = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  color: string;
};

// Lightweight, canvas-based moving pixel field for preloaders
export default function PixelPreloader({
  className,
  count = 140,
  squareSize = 8,
  speed = 0.6,
  colors = ["#ff7ac8", "#ffb3dd", "#ffd6ea", "#f7a2d4"],
  backgroundAlpha = 0.06,
}: PixelPreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const pixelsRef = useRef<Pixel[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const makePixel = (w: number, h: number): Pixel => {
      const sizeJitter = squareSize * (0.7 + Math.random() * 0.6);
      const angle = Math.random() * Math.PI * 2;
      const speedUnit = speed * (0.4 + Math.random() * 1.2);
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speedUnit,
        vy: Math.sin(angle) * speedUnit,
        size: sizeJitter,
        alpha: 0.6 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    };

    const resize = () => {
      const r = container.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // roughly scale count with area while keeping upper bound reasonable
      const area = r.width * r.height;
      const target = Math.min(240, Math.max(90, Math.floor((area / 12000) * count)));
      pixelsRef.current = Array.from({ length: target }, () => makePixel(r.width, r.height));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); // cap ~33ms
      last = now;
      const r = container.getBoundingClientRect();

      // subtle background wash
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = backgroundAlpha;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.globalAlpha = 1;

      // draw pixels
      for (const p of pixelsRef.current) {
        // motion
        p.x += p.vx;
        p.y += p.vy;

        // gentle steering to keep them moving around
        p.phase += 0.8 * dt;
        const sway = Math.sin(p.phase) * 0.12;
        p.vx += sway * dt;
        p.vy += Math.cos(p.phase) * 0.06 * dt;

        // wrap around edges
        if (p.x < -p.size) p.x = r.width + p.size;
        if (p.x > r.width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = r.height + p.size;
        if (p.y > r.height + p.size) p.y = -p.size;

        // pulse alpha
        const pulse = 0.5 + 0.5 * Math.sin(p.phase * 2.3);
        const alpha = p.alpha * (0.7 + 0.3 * pulse);

        // occasional sparkle
        const sparkle = Math.random() < 0.006 ? 0.6 : 0;

        ctx.globalAlpha = Math.min(1, alpha + sparkle);
        ctx.fillStyle = p.color;
        // rounded pixel squares
        const s = p.size;
        const x = p.x;
        const y = p.y;
        const rads = Math.max(2, Math.min(6, s * 0.35));
        roundRect(ctx, x, y, s, s, rads);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count, squareSize, speed, colors, backgroundAlpha]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}