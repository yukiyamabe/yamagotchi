"use client"

import { useRef, useEffect } from "react"
import type { SpriteFrame } from "@/lib/sprites"

type Props = {
  frame: SpriteFrame
  scale?: number
  poopCount?: number
  flushAnimation?: boolean
}

const POOP_COLOR = "#8B4513"
const POOP_OUTLINE = "#1a1a2e"

function drawPoopAt(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  scale: number,
  offsetY = 0,
) {
  const draw = (x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect((px + x) * scale, (py + y + offsetY) * scale, scale, scale)
  }
  // Swirl top
  draw(1, 0, POOP_COLOR)
  // Middle
  draw(0, 1, POOP_COLOR)
  draw(1, 1, POOP_COLOR)
  draw(2, 1, POOP_COLOR)
  // Bottom wider
  draw(0, 2, POOP_COLOR)
  draw(1, 2, POOP_COLOR)
  draw(2, 2, POOP_COLOR)
  // Base outline
  draw(-1, 3, POOP_OUTLINE)
  draw(0, 3, POOP_COLOR)
  draw(1, 3, POOP_COLOR)
  draw(2, 3, POOP_COLOR)
  draw(3, 3, POOP_OUTLINE)
}

const POOP_POSITIONS = [
  { x: 2, y: 26 },
  { x: 26, y: 27 },
  { x: 5, y: 22 },
] as const

export function PixelCanvas({
  frame,
  scale = 8,
  poopCount = 0,
  flushAnimation = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flushOffsetRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function render() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = false

      // Draw sprite
      for (let y = 0; y < frame.length; y++) {
        for (let x = 0; x < frame[y].length; x++) {
          const color = frame[y][x]
          if (color === "#00000000") continue
          ctx.fillStyle = color
          ctx.fillRect(x * scale, y * scale, scale, scale)
        }
      }

      // Draw poops
      const visiblePoops = Math.min(poopCount, POOP_POSITIONS.length)
      for (let i = 0; i < visiblePoops; i++) {
        const pos = POOP_POSITIONS[i]
        drawPoopAt(ctx, pos.x, pos.y, scale, flushAnimation ? flushOffsetRef.current : 0)
      }
    }

    if (flushAnimation) {
      flushOffsetRef.current = 0
      let start: number | null = null
      function animate(timestamp: number) {
        if (!start) start = timestamp
        const elapsed = timestamp - start
        flushOffsetRef.current = Math.min(10, elapsed / 50)
        render()
        if (elapsed < 500) {
          animFrameRef.current = requestAnimationFrame(animate)
        }
      }
      animFrameRef.current = requestAnimationFrame(animate)
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      }
    }

    render()
  }, [frame, scale, poopCount, flushAnimation])

  return (
    <canvas
      ref={canvasRef}
      width={32 * scale}
      height={32 * scale}
      style={{ imageRendering: "pixelated" }}
    />
  )
}
