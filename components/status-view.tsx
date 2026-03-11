"use client"

import type { TamagotchiParams } from "@/types/tamagotchi"

type Props = {
  params: TamagotchiParams
  onClose: () => void
}

const PARAM_CONFIG = [
  { key: "hunger" as const, icon: "🍙", label: "おなか" },
  { key: "mood" as const, icon: "😊", label: "きげん" },
  { key: "poop" as const, icon: "💩", label: "うんち", invert: true },
  { key: "sleepy" as const, icon: "💤", label: "ねむけ", invert: true },
  { key: "health" as const, icon: "🏥", label: "体調" },
] as const

function paramLevel(value: number, invert = false): number {
  const effective = invert ? 100 - value : value
  if (effective >= 75) return 4
  if (effective >= 50) return 3
  if (effective >= 25) return 2
  return 1
}

function barColor(level: number): string {
  if (level >= 4) return "bg-emerald-400"
  if (level >= 3) return "bg-yellow-400"
  if (level >= 2) return "bg-orange-400"
  return "bg-red-400"
}

export function StatusView({ params, onClose }: Props) {
  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="text-center text-xs font-bold text-zinc-300">
        ステータス
      </div>
      {PARAM_CONFIG.map((cfg) => {
        const value = params[cfg.key]
        const level = paramLevel(value, "invert" in cfg && cfg.invert)
        const color = barColor(level)
        return (
          <div key={cfg.key} className="flex items-center gap-2 text-xs">
            <span className="w-5 text-center">{cfg.icon}</span>
            <span className="w-12 text-zinc-400">{cfg.label}</span>
            <div className="flex gap-1">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-sm border border-zinc-600 ${
                    i < level ? color : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
            <span className="w-8 text-right text-zinc-500">{value}</span>
          </div>
        )
      })}
      <button
        type="button"
        onClick={onClose}
        className="mt-1 text-center text-xs text-zinc-500 hover:text-zinc-300"
      >
        とじる
      </button>
    </div>
  )
}
