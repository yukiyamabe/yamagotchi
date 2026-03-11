"use client"

import { Button } from "@/components/ui/button"

type Props = {
  onFeed: () => void
  onPlay: () => void
  onClean: () => void
  onMedicate: () => void
  onToggleSleep: () => void
  onStatus: () => void
  canFeed: boolean
  canClean: boolean
  canMedicate: boolean
  isSleeping: boolean
}

const BUTTONS = [
  { key: "feed", icon: "🍙", label: "ごはん" },
  { key: "play", icon: "🎮", label: "あそぶ" },
  { key: "clean", icon: "🧹", label: "おそうじ" },
  { key: "medicate", icon: "💊", label: "くすり" },
  { key: "light", icon: "💡", label: "でんき" },
  { key: "status", icon: "📊", label: "ステータス" },
] as const

export function ActionButtons({
  onFeed,
  onPlay,
  onClean,
  onMedicate,
  onToggleSleep,
  onStatus,
  canFeed,
  canClean,
  canMedicate,
  isSleeping,
}: Props) {
  const handlers: Record<string, () => void> = {
    feed: onFeed,
    play: onPlay,
    clean: onClean,
    medicate: onMedicate,
    light: onToggleSleep,
    status: onStatus,
  }

  const disabled: Record<string, boolean> = {}

  return (
    <div className="flex gap-2">
      {BUTTONS.map((btn) => (
        <Button
          key={btn.key}
          variant="outline"
          size="icon"
          className="h-10 w-10 text-lg font-mono"
          onClick={handlers[btn.key]}
          disabled={disabled[btn.key] ?? false}
          title={
            btn.key === "light"
              ? isSleeping
                ? "起こす"
                : "寝かす"
              : btn.label
          }
        >
          {btn.icon}
        </Button>
      ))}
    </div>
  )
}
