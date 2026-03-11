import type { TamagotchiState } from "@/types/tamagotchi"
import {
  createDefaultState,
  applyDecay,
  applySleepSchedule,
} from "@/lib/tamagotchi/params"

const STORAGE_KEY = "yamagotchi-state"

export function saveState(state: TamagotchiState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage が使えない環境では無視
  }
}

export function loadState(): TamagotchiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const saved = JSON.parse(raw) as TamagotchiState

    const now = new Date()
    const elapsed =
      (now.getTime() - new Date(saved.lastUpdated).getTime()) / 60000
    if (elapsed <= 0) return saved

    const withDecay = applyDecay(saved, elapsed, now)
    const withSleep = applySleepSchedule(withDecay, now.getHours(), now)
    return withSleep
  } catch {
    return createDefaultState()
  }
}

export function resetState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}
