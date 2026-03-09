"use client"

import { TamagotchiFrame } from "@/components/tamagotchi-frame"
import { PixelCanvas } from "@/components/pixel-canvas"
import { useAgentStatus } from "@/hooks/use-agent-status"
import { useSpriteAnimation } from "@/hooks/use-sprite-animation"
import { toCharacterState } from "@/types/agent-status"
import { getSprite } from "@/lib/sprites"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/mock-status"

export default function Page() {
  const { status } = useAgentStatus(API_URL)
  const characterState = toCharacterState(status)
  const sprite = getSprite(characterState)
  const frame = useSpriteAnimation(sprite)

  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-950">
      <TamagotchiFrame state={characterState} agentName={status.agentName}>
        <PixelCanvas frame={frame} scale={8} />
      </TamagotchiFrame>
    </div>
  )
}
