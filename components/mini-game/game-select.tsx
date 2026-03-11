"use client"

import { Button } from "@/components/ui/button"

type GameType = "janken" | "direction" | "whack"

type Props = {
  onSelect: (game: GameType) => void
  onBack: () => void
}

const GAMES = [
  { type: "janken" as const, icon: "✊", label: "じゃんけん" },
  { type: "direction" as const, icon: "👆", label: "方向当て" },
  { type: "whack" as const, icon: "🔨", label: "もぐらたたき" },
] as const

export function GameSelect({ onSelect, onBack }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-xs font-bold text-zinc-300">あそぶ</div>
      <div className="flex flex-col gap-2">
        {GAMES.map((g) => (
          <Button
            key={g.type}
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={() => onSelect(g.type)}
          >
            {g.icon} {g.label}
          </Button>
        ))}
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        もどる
      </button>
    </div>
  )
}

export type { GameType }
