"use client"

import { useState, useEffect, useRef } from "react"
import { getRandomQuote } from "@/lib/quotes"

const MIN_INTERVAL_MS = 20_000
const MAX_INTERVAL_MS = 60_000
const DISPLAY_DURATION_MS = 5_000

function randomInterval() {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS)
}

/**
 * キャラが不定期でつぶやく名言を返す。
 * つぶやいてないときは null。
 */
export function useMumble(paused = false) {
  const [mumble, setMumble] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (paused) {
      setMumble(null)
      return
    }

    function scheduleNext() {
      timerRef.current = setTimeout(() => {
        const quote = getRandomQuote()
        setMumble(`「${quote.text}」`)

        timerRef.current = setTimeout(() => {
          setMumble(null)
          scheduleNext()
        }, DISPLAY_DURATION_MS)
      }, randomInterval())
    }

    scheduleNext()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [paused])

  return mumble
}
