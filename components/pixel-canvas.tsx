"use client"

import { useRef, useEffect } from "react"
import type { SpriteFrame } from "@/lib/sprites"

type Props = {
  frame: SpriteFrame
  scale?: number
}

export function PixelCanvas({ frame, scale = 8 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false

    for (let y = 0; y < frame.length; y++) {
      for (let x = 0; x < frame[y].length; x++) {
        const color = frame[y][x]
        if (color === "rgba(0,0,0,0)") continue
        ctx.fillStyle = color
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }, [frame, scale])

  return (
    <canvas
      ref={canvasRef}
      width={32 * scale}
      height={32 * scale}
      style={{ imageRendering: "pixelated" }}
    />
  )
}
