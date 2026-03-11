"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"

type Hand = "rock" | "scissors" | "paper"
type Result = "win" | "lose" | "draw"

type Props = {
  onFinish: (won: boolean) => void
}

const HANDS: { type: Hand; icon: string }[] = [
  { type: "rock", icon: "✊" },
  { type: "scissors", icon: "✌️" },
  { type: "paper", icon: "🖐️" },
]

function judge(player: Hand, cpu: Hand): Result {
  if (player === cpu) return "draw"
  if (
    (player === "rock" && cpu === "scissors") ||
    (player === "scissors" && cpu === "paper") ||
    (player === "paper" && cpu === "rock")
  ) {
    return "win"
  }
  return "lose"
}

function randomHand(): Hand {
  const hands: Hand[] = ["rock", "scissors", "paper"]
  return hands[Math.floor(Math.random() * 3)]
}

export function Janken({ onFinish }: Props) {
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [lastResult, setLastResult] = useState<{
    player: Hand
    cpu: Hand
    result: Result
  } | null>(null)
  const [finished, setFinished] = useState(false)

  const play = useCallback(
    (hand: Hand) => {
      if (finished) return
      const cpu = randomHand()
      const result = judge(hand, cpu)
      setLastResult({ player: hand, cpu, result })

      if (result === "draw") return

      const newWins = result === "win" ? wins + 1 : wins
      const newLosses = result === "lose" ? losses + 1 : losses
      setWins(newWins)
      setLosses(newLosses)

      if (newWins >= 2 || newLosses >= 2) {
        setFinished(true)
        setTimeout(() => onFinish(newWins >= 2), 1500)
      }
    },
    [wins, losses, finished, onFinish],
  )

  const handIcon = (h: Hand) => HANDS.find((x) => x.type === h)?.icon ?? ""

  return (
    <div className="flex flex-col items-center gap-3 p-2">
      <div className="text-xs font-bold text-zinc-300">じゃんけん</div>
      <div className="text-xs text-zinc-400">
        {wins}勝 {losses}敗
      </div>

      {lastResult && (
        <div className="text-center text-sm">
          <div>
            {handIcon(lastResult.player)} vs {handIcon(lastResult.cpu)}
          </div>
          <div className="text-xs text-zinc-400">
            {lastResult.result === "win"
              ? "かち！"
              : lastResult.result === "lose"
                ? "まけ…"
                : "あいこ！"}
          </div>
        </div>
      )}

      {finished ? (
        <div className="text-sm font-bold">
          {wins >= 2 ? "🎉 やったー！" : "😢 ざんねん…"}
        </div>
      ) : (
        <div className="flex gap-2">
          {HANDS.map((h) => (
            <Button
              key={h.type}
              variant="outline"
              size="icon"
              className="h-10 w-10 text-lg"
              onClick={() => play(h.type)}
            >
              {h.icon}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
