"use client"

import { useState, useEffect, useCallback } from "react"
import type { TamagotchiState, TamagotchiExpression } from "@/types/tamagotchi"
import {
  applyDecay,
  applySleepSchedule,
  feed,
  clean,
  medicate,
  toggleSleep,
  applyGameResult,
  canFeed,
  canClean,
  canMedicate,
} from "@/lib/tamagotchi/params"
import { toExpression } from "@/lib/tamagotchi/expression"
import { loadState, saveState } from "@/lib/tamagotchi/storage"

const TICK_INTERVAL_MS = 60_000
const SAVE_INTERVAL_MS = 60_000

export function useTamagotchi() {
  const [state, setState] = useState<TamagotchiState | null>(null)

  useEffect(() => {
    setState(loadState())
  }, [])

  // 毎分の減衰ティック
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev
        const now = new Date()
        const decayed = applyDecay(prev, 1, now)
        const withSleep = applySleepSchedule(decayed, now.getHours(), now)
        return withSleep
      })
    }, TICK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // 定期保存
  useEffect(() => {
    const id = setInterval(() => {
      setState((current) => {
        if (current) saveState(current)
        return current
      })
    }, SAVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const act = useCallback(
    (updater: (s: TamagotchiState) => TamagotchiState) => {
      setState((prev) => {
        if (!prev) return prev
        const next = updater(prev)
        saveState(next)
        return next
      })
    },
    [],
  )

  const doFeed = useCallback((): "ok" | "full" | "limit" => {
    let result: "ok" | "full" | "limit" = "ok"
    setState((prev) => {
      if (!prev) return prev
      if (prev.params.hunger >= 90) {
        result = "full"
        return prev
      }
      if (!canFeed(prev)) {
        result = "limit"
        return prev
      }
      const next = feed(prev)
      saveState(next)
      return next
    })
    return result
  }, [])
  const doClean = useCallback((): "ok" | "clean" => {
    let result: "ok" | "clean" = "ok"
    setState((prev) => {
      if (!prev) return prev
      if (!canClean(prev)) {
        result = "clean"
        return prev
      }
      const next = clean(prev)
      saveState(next)
      return next
    })
    return result
  }, [])

  const doMedicate = useCallback((): "ok" | "healthy" => {
    let result: "ok" | "healthy" = "ok"
    setState((prev) => {
      if (!prev) return prev
      if (!canMedicate(prev)) {
        result = "healthy"
        return prev
      }
      const next = medicate(prev)
      saveState(next)
      return next
    })
    return result
  }, [])
  const doToggleSleep = useCallback(() => act(toggleSleep), [act])
  const doGameResult = useCallback(
    (won: boolean) => act((s) => applyGameResult(s, won)),
    [act],
  )

  const expression: TamagotchiExpression = state
    ? toExpression(state.params, state.isSleeping)
    : "happy"

  return {
    state,
    expression,
    doFeed,
    doClean,
    doMedicate,
    doToggleSleep,
    doGameResult,
    canFeed: state ? canFeed(state) : false,
    canClean: state ? canClean(state) : false,
    canMedicate: state ? canMedicate(state) : false,
  }
}
