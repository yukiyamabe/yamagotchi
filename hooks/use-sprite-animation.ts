"use client"

import { useState, useEffect } from "react"
import type { SpriteAnimation, SpriteFrame } from "@/lib/sprites"

export function useSpriteAnimation(animation: SpriteAnimation): SpriteFrame {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % animation.frames.length)
    }, animation.frameDuration)
    return () => clearInterval(interval)
  }, [animation])

  return animation.frames[frameIndex]
}
