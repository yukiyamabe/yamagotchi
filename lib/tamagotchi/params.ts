import type { TamagotchiParams, TamagotchiState } from "@/types/tamagotchi"

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function clampParams(params: TamagotchiParams): TamagotchiParams {
  return {
    hunger: clamp(params.hunger),
    mood: clamp(params.mood),
    poop: clamp(params.poop),
    sleepy: clamp(params.sleepy),
    health: clamp(params.health),
  }
}

export function createDefaultState(): TamagotchiState {
  return {
    params: { hunger: 80, mood: 80, poop: 0, sleepy: 0, health: 100 },
    lastUpdated: new Date().toISOString(),
    isSleeping: false,
    allGoodSince: null,
    feedCount: 0,
    feedWindowStart: null,
    lastManualSleepAt: null,
    totalAge: 0,
  }
}

/**
 * 減衰レート（1分あたりの変化量）
 * 正の値 = 増加する（poop, sleepy）、負の値 = 減少する（hunger, mood）
 */
const DECAY_RATES = {
  hunger: -1 / 5,
  mood: -1 / 10,
  poop: 1 / 15,
  sleepy: 1 / 20,
} as const

const SLEEPING_RATE_MULTIPLIER = 0.5
const SLEEPING_SLEEPY_RECOVERY = -1 / 5

const HEALTH_PENALTIES = [
  { check: (p: TamagotchiParams) => p.hunger < 20, rate: -1 / 5 },
  { check: (p: TamagotchiParams) => p.poop > 80, rate: -1 / 5 },
  { check: (p: TamagotchiParams) => p.sleepy > 80, rate: -1 / 10 },
] as const

export function isAllGood(params: TamagotchiParams): boolean {
  return (
    params.hunger >= 50 &&
    params.mood >= 50 &&
    params.poop <= 50 &&
    params.sleepy <= 50 &&
    params.health >= 50
  )
}

export function applyDecay(
  state: TamagotchiState,
  elapsedMinutes: number,
  now = new Date(),
): TamagotchiState {
  const sleeping = state.isSleeping
  const rate = sleeping ? SLEEPING_RATE_MULTIPLIER : 1

  let hunger = state.params.hunger + DECAY_RATES.hunger * rate * elapsedMinutes
  let mood = state.params.mood + DECAY_RATES.mood * rate * elapsedMinutes
  let poop = state.params.poop + DECAY_RATES.poop * rate * elapsedMinutes
  let sleepy = sleeping
    ? state.params.sleepy + SLEEPING_SLEEPY_RECOVERY * elapsedMinutes
    : state.params.sleepy + DECAY_RATES.sleepy * rate * elapsedMinutes
  let health = state.params.health

  for (const penalty of HEALTH_PENALTIES) {
    if (penalty.check(state.params)) {
      health = health + penalty.rate * elapsedMinutes
    }
  }

  if (state.allGoodSince) {
    const goodMinutes =
      (now.getTime() - new Date(state.allGoodSince).getTime()) / 60000
    if (goodMinutes >= 30) {
      mood = mood + (1 / 10) * elapsedMinutes
    }
  }

  const newParams = clampParams({ hunger, mood, poop, sleepy, health })
  const newAllGoodSince = isAllGood(newParams)
    ? state.allGoodSince || now.toISOString()
    : null

  return {
    ...state,
    params: newParams,
    lastUpdated: now.toISOString(),
    allGoodSince: newAllGoodSince,
    totalAge: state.totalAge + elapsedMinutes,
  }
}

// --- 就寝ロジック ---

export function shouldAutoSleep(hour: number): boolean {
  return hour >= 22 || hour < 7
}

function isManualOverrideActive(
  lastManualSleepAt: string | null,
  now: Date,
): boolean {
  if (!lastManualSleepAt) return false
  const manualTime = new Date(lastManualSleepAt)
  const manualHour = manualTime.getHours()

  const nextBoundary = new Date(manualTime)
  if (manualHour >= 22 || manualHour < 7) {
    nextBoundary.setHours(7, 0, 0, 0)
    if (manualHour >= 22) nextBoundary.setDate(nextBoundary.getDate() + 1)
  } else {
    nextBoundary.setHours(22, 0, 0, 0)
  }

  return now < nextBoundary
}

export function applySleepSchedule(
  state: TamagotchiState,
  currentHour: number,
  now = new Date(),
): TamagotchiState {
  if (isManualOverrideActive(state.lastManualSleepAt, now)) {
    return state
  }

  const autoSleep = shouldAutoSleep(currentHour)
  if (autoSleep && !state.isSleeping) {
    return { ...state, isSleeping: true, lastManualSleepAt: null }
  }
  if (!autoSleep && state.isSleeping) {
    return { ...state, isSleeping: false, lastManualSleepAt: null }
  }
  return state
}

export function toggleSleep(state: TamagotchiState): TamagotchiState {
  return {
    ...state,
    isSleeping: !state.isSleeping,
    lastManualSleepAt: new Date().toISOString(),
  }
}

// --- ボタンアクション ---

export function canFeed(state: TamagotchiState): boolean {
  if (state.params.hunger >= 90) return false
  if (state.feedCount >= 3 && state.feedWindowStart) {
    const windowElapsed =
      Date.now() - new Date(state.feedWindowStart).getTime()
    if (windowElapsed < 10 * 60 * 1000) return false
  }
  return true
}

export function feed(state: TamagotchiState): TamagotchiState {
  if (!canFeed(state)) return state
  const now = new Date()
  const windowExpired =
    !state.feedWindowStart ||
    now.getTime() - new Date(state.feedWindowStart).getTime() >=
      10 * 60 * 1000

  return {
    ...state,
    params: clampParams({
      ...state.params,
      hunger: state.params.hunger + 20,
    }),
    feedCount: windowExpired ? 1 : state.feedCount + 1,
    feedWindowStart: windowExpired
      ? now.toISOString()
      : state.feedWindowStart,
    lastUpdated: now.toISOString(),
  }
}

export function canClean(state: TamagotchiState): boolean {
  return state.params.poop > 10
}

export function clean(state: TamagotchiState): TamagotchiState {
  if (!canClean(state)) return state
  return {
    ...state,
    params: clampParams({
      ...state.params,
      poop: state.params.poop - 30,
    }),
    lastUpdated: new Date().toISOString(),
  }
}

export function canMedicate(state: TamagotchiState): boolean {
  return state.params.health < 70
}

export function medicate(state: TamagotchiState): TamagotchiState {
  if (!canMedicate(state)) return state
  return {
    ...state,
    params: clampParams({
      ...state.params,
      health: state.params.health + 30,
    }),
    lastUpdated: new Date().toISOString(),
  }
}

export function applyGameResult(
  state: TamagotchiState,
  won: boolean,
): TamagotchiState {
  const moodBoost = won ? 15 : 5
  return {
    ...state,
    params: clampParams({
      ...state.params,
      mood: state.params.mood + moodBoost,
    }),
    lastUpdated: new Date().toISOString(),
  }
}
