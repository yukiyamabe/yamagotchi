"use client"

import { useState, useEffect, useCallback, useRef } from "react"

type Props = {
  onFinish: (won: boolean) => void
}

type Mole = {
  id: number
  cell: number
  expiresAt: number
}

const GAME_DURATION = 10_000
const SPAWN_INTERVAL = 1_200
const MOLE_LIFETIME = 1_000
const WIN_THRESHOLD = 5

export function WhackGame({ onFinish }: Props) {
  const [moles, setMoles] = useState<Mole[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [finished, setFinished] = useState(false)
  const nextId = useRef(0)
  const startTime = useRef(Date.now())
  const scoreRef = useRef(0)

  useEffect(() => {
    if (finished) return
    const spawnTimer = setInterval(() => {
      const now = Date.now()
      setMoles((prev) => {
        const active = prev.filter((m) => m.expiresAt > now)
        if (active.length >= 2) return active
        const occupied = new Set(active.map((m) => m.cell))
        let cell: number
        do {
          cell = Math.floor(Math.random() * 9)
        } while (occupied.has(cell))
        const id = nextId.current++
        return [...active, { id, cell, expiresAt: now + MOLE_LIFETIME }]
      })
    }, SPAWN_INTERVAL)
    return () => clearInterval(spawnTimer)
  }, [finished])

  useEffect(() => {
    if (finished) return
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime.current
      const remaining = Math.max(0, GAME_DURATION - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setFinished(true)
        clearInterval(timer)
        setTimeout(() => onFinish(scoreRef.current >= WIN_THRESHOLD), 1000)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [finished, onFinish])

  const whack = useCallback(
    (moleId: number) => {
      if (finished) return
      setMoles((prev) => prev.filter((m) => m.id !== moleId))
      const newScore = scoreRef.current + 1
      scoreRef.current = newScore
      setScore(newScore)
    },
    [finished],
  )

  useEffect(() => {
    if (finished) return
    const cleanup = setInterval(() => {
      const now = Date.now()
      setMoles((prev) => prev.filter((m) => m.expiresAt > now))
    }, 200)
    return () => clearInterval(cleanup)
  }, [finished])

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <div className="text-xs font-bold text-zinc-300">もぐらたたき</div>
      <div className="flex gap-4 text-xs text-zinc-400">
        <span>スコア: {score}</span>
        <span>残り: {Math.ceil(timeLeft / 1000)}秒</span>
      </div>

      {finished ? (
        <div className="text-sm font-bold">
          {score >= WIN_THRESHOLD
            ? `🎉 ${score}匹！やったー！`
            : `😢 ${score}匹…ざんねん`}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }, (_, i) => {
            const mole = moles.find((m) => m.cell === i)
            return (
              <button
                type="button"
                key={i}
                className={`flex h-12 w-12 items-center justify-center rounded border text-lg transition-colors ${
                  mole
                    ? "border-yellow-500 bg-yellow-900/30 hover:bg-yellow-800/50"
                    : "border-zinc-700 bg-zinc-800"
                }`}
                onClick={() => mole && whack(mole.id)}
              >
                {mole ? "🐻" : ""}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
