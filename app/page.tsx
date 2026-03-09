"use client"

import { TamagotchiFrame } from "@/components/tamagotchi-frame"
import { PixelCanvas } from "@/components/pixel-canvas"
import { QuoteDisplay } from "@/components/quote-display"
import { SlackButton } from "@/components/slack-button"
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 p-4">
      <TamagotchiFrame state={characterState} agentName={status.agentName}>
        <PixelCanvas frame={frame} scale={8} />
      </TamagotchiFrame>
      <SlackButton />
      <QuoteDisplay />
    </div>
  )
}
