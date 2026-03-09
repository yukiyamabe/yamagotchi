"use client"

import type { ReactNode } from "react"
import type { CharacterState } from "@/types/agent-status"

type Props = {
  children: ReactNode
  state: CharacterState
  agentName: string
}

const STATE_LABELS: Record<CharacterState, string> = {
  idle: "まったり中...",
  talking: "おしゃべり中!",
  coding: "コーディング中...",
  sleeping: "おやすみ中... zzZ",
  sick: "ぐったり...",
}

export function TamagotchiFrame({ children, state, agentName }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* 卵型フレーム */}
      <div className="relative rounded-[50%/60%] border-4 border-zinc-700 bg-zinc-900 p-8 shadow-xl">
        {/* スクリーン */}
        <div className="rounded-xl border-2 border-zinc-600 bg-emerald-100 dark:bg-emerald-950 p-4">
          {children}
        </div>
      </div>
      {/* ステータス表示 */}
      <div className="text-center font-mono text-sm">
        <div className="font-bold">{agentName}</div>
        <div className="text-muted-foreground">{STATE_LABELS[state]}</div>
      </div>
    </div>
  )
}
