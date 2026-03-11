"use client"

import type { ReactNode } from "react"
import type { CharacterState } from "@/types/agent-status"
import type { TamagotchiExpression } from "@/types/tamagotchi"

type Props = {
  children: ReactNode
  state: CharacterState | TamagotchiExpression
  agentName: string
  labelOverride?: string | null
}

const STATE_LABELS: Record<CharacterState, string> = {
  normal: "通常稼働中 😊",
  processing: "処理中... 🤔",
  error: "エラー発生！ 😤",
  resolved: "解決！ 😌",
  idle: "おやすみ中... 💤",
}

const EXPRESSION_LABELS: Record<TamagotchiExpression, string> = {
  happy: "ごきげん 🫶",
  hungry: "おなかすいた… 🍙",
  sad: "しょんぼり… 😢",
  dirty: "きたない… 💩",
  drowsy: "ねむい… 💤",
  sick: "ぐあいわるい… 🏥",
  sleeping: "Zzz… 💤",
}

export function TamagotchiFrame({
  children,
  state,
  agentName,
  labelOverride,
}: Props) {
  const label =
    labelOverride ??
    (state in STATE_LABELS
      ? STATE_LABELS[state as CharacterState]
      : EXPRESSION_LABELS[state as TamagotchiExpression])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-[50%/60%] border-4 border-zinc-700 bg-zinc-900 p-8 shadow-xl">
        <div className="rounded-xl border-2 border-zinc-600 bg-emerald-100 dark:bg-emerald-950 p-4">
          {children}
        </div>
      </div>
      <div className="text-center font-mono text-sm">
        <div className="font-bold">{agentName}</div>
        <div className="text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
