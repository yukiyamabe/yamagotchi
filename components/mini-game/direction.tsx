"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"

type Direction = "up" | "down" | "left" | "right"

type Props = {
  onFinish: (won: boolean) => void
}

const DIRECTIONS: { type: Direction; icon: string }[] = [
  { type: "up", icon: "⬆️" },
  { type: "down", icon: "⬇️" },
  { type: "left", icon: "⬅️" },
  { type: "right", icon: "➡️" },
]

function randomDirection(): Direction {
  const dirs: Direction[] = ["up", "down", "left", "right"]
  return dirs[Math.floor(Math.random() * 4)]
}

export function DirectionGame({ onFinish }: Props) {
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [target, setTarget] = useState<Direction>(randomDirection)
  const [showTarget, setShowTarget] = useState(true)
  const [lastGuess, setLastGuess] = useState<{
    guess: Direction
    answer: Direction
    correct: boolean
  } | null>(null)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (showTarget) {
      const timer = setTimeout(() => setShowTarget(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [showTarget, target])

  const guess = useCallback(
    (dir: Direction) => {
      if (showTarget || finished) return
      const isCorrect = dir === target
      const newCorrect = isCorrect ? correct + 1 : correct
      const newRound = round + 1

      setLastGuess({ guess: dir, answer: target, correct: isCorrect })
      setCorrect(newCorrect)
      setRound(newRound)

      if (newRound >= 5) {
        setFinished(true)
        setTimeout(() => onFinish(newCorrect >= 3), 1500)
      } else {
        setTimeout(() => {
          setTarget(randomDirection())
          setShowTarget(true)
          setLastGuess(null)
        }, 1000)
      }
    },
    [showTarget, finished, target, correct, round, onFinish],
  )

  const dirIcon = (d: Direction) =>
    DIRECTIONS.find((x) => x.type === d)?.icon ?? ""

  return (
    <div className="flex flex-col items-center gap-3 p-2">
      <div className="text-xs font-bold text-zinc-300">方向当て</div>
      <div className="text-xs text-zinc-400">
        {round}/5 ({correct}正解)
      </div>

      <div className="flex h-12 items-center justify-center text-2xl">
        {showTarget
          ? dirIcon(target)
          : lastGuess
            ? lastGuess.correct
              ? "⭕"
              : "❌"
            : "❓"}
      </div>

      {finished ? (
        <div className="text-sm font-bold">
          {correct >= 3 ? "🎉 やったー！" : "😢 ざんねん…"}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => guess("up")}
            disabled={showTarget}
          >
            ⬆️
          </Button>
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => guess("left")}
            disabled={showTarget}
          >
            ⬅️
          </Button>
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => guess("right")}
            disabled={showTarget}
          >
            ➡️
          </Button>
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => guess("down")}
            disabled={showTarget}
          >
            ⬇️
          </Button>
          <div />
        </div>
      )}
    </div>
  )
}
