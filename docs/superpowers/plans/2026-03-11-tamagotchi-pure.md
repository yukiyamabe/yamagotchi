# たまごっち純粋機能 実装計画

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** yamagotchi ダッシュボードに本物のたまごっちのような育成パラメータ・お世話ボタン・ミニゲーム・リアルタイム減衰・localStorage永続化を追加する

**Architecture:** 既存の CharacterState スプライトシステムはそのまま維持し、新しい TamagotchiExpression 型を追加して共存させる。パラメータ管理は lib/tamagotchi/ に純粋関数として実装し、use-tamagotchi フックで React と接続する。ミニゲームは components/mini-game/ に独立コンポーネントとして配置する。

**Tech Stack:** Next.js 16, React 19, shadcn/ui (zinc), Canvas API (32x32), localStorage, TypeScript

**Spec:** `docs/plans/2026-03-11-tamagotchi-pure-design.md`

---

## Chunk A: 型定義 + コアロジック

### Task A-1: 型定義

**Files:**
- Create: `types/tamagotchi.ts`

- [ ] **Step 1: TamagotchiExpression 型を定義**

```ts
export type TamagotchiExpression =
  | "happy"
  | "hungry"
  | "sad"
  | "dirty"
  | "drowsy"
  | "sick"
  | "sleeping"

export type TamagotchiParams = {
  hunger: number
  mood: number
  poop: number
  sleepy: number
  health: number
}

export type TamagotchiState = {
  params: TamagotchiParams
  lastUpdated: string
  isSleeping: boolean
  allGoodSince: string | null
  feedCount: number
  feedWindowStart: string | null
  lastManualSleepAt: string | null
  totalAge: number
}
```

ポイント:
- `TamagotchiParams` の各フィールドは 0〜100 の整数値
- `lastUpdated`, `allGoodSince`, `feedWindowStart`, `lastManualSleepAt` は ISO8601 文字列
- `feedWindowStart` はごはん連続制限の10分ウィンドウ開始時刻
- `lastManualSleepAt` は手動でんき操作の時刻（自動就寝/起床の上書き判定用）
- `totalAge` は分単位の累計（現フェーズではUI非表示、将来の進化用）

- [ ] **Step 2: ファイルを作成して型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS（型定義のみなので即成功）

- [ ] **Step 3: コミット**

```bash
git add types/tamagotchi.ts
git commit -m "feat: add TamagotchiExpression and TamagotchiState types"
```

---

### Task A-2: パラメータクランプとデフォルト値

**Files:**
- Create: `lib/tamagotchi/params.ts`

- [ ] **Step 1: clamp 関数とデフォルト値を実装**

```ts
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
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add lib/tamagotchi/params.ts
git commit -m "feat: add clamp utilities and default state factory"
```

---

### Task A-3: 減衰計算ロジック

**Files:**
- Modify: `lib/tamagotchi/params.ts`

- [ ] **Step 1: 減衰レート定数と applyDecay 関数を追加**

`params.ts` に以下を追記:

```ts
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

/** 就寝中の減衰レート倍率 */
const SLEEPING_RATE_MULTIPLIER = 0.5

/** 就寝中のねむけ回復レート（1分あたり） */
const SLEEPING_SLEEPY_RECOVERY = -1 / 5

/** 体調悪化条件とレート */
const HEALTH_PENALTIES = [
  { check: (p: TamagotchiParams) => p.hunger < 20, rate: -1 / 5 },
  { check: (p: TamagotchiParams) => p.poop > 80, rate: -1 / 5 },
  { check: (p: TamagotchiParams) => p.sleepy > 80, rate: -1 / 10 },
] as const

/** 全パラメータ良好判定 */
export function isAllGood(params: TamagotchiParams): boolean {
  return (
    params.hunger >= 50 &&
    params.mood >= 50 &&
    params.poop <= 50 &&
    params.sleepy <= 50 &&
    params.health >= 50
  )
}

/** 経過時間ぶんの減衰を一括適用する（テスト容易性のため now を外部注入） */
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

  // 体調ペナルティ（現在のパラメータ値で判定）
  for (const penalty of HEALTH_PENALTIES) {
    if (penalty.check(state.params)) {
      health = health + penalty.rate * elapsedMinutes
    }
  }

  // allGoodSince によるきげん自然回復（30分以上良好が続いた場合）
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
```

ポイント:
- `applyDecay` は純粋関数（Date.now()以外）。テスト時はモック可能
- 体調ペナルティは **現在の** パラメータで判定（経過中の中間状態は考慮しない。簡略化のため）
- `allGoodSince` の判定は結果パラメータで行う

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add lib/tamagotchi/params.ts
git commit -m "feat: add decay calculation with sleeping and health penalty logic"
```

---

### Task A-4: 就寝ロジック

**Files:**
- Modify: `lib/tamagotchi/params.ts`

- [ ] **Step 1: 自動就寝/起床判定を追加**

`params.ts` に以下を追記:

```ts
/** 自動就寝時間帯の判定 */
export function shouldAutoSleep(hour: number): boolean {
  return hour >= 22 || hour < 7
}

/**
 * 手動操作が有効かどうかを判定する。
 * 手動操作後、次の自動境界時刻（7:00 or 22:00）を超えるまでは手動状態を維持する。
 */
function isManualOverrideActive(
  lastManualSleepAt: string | null,
  now: Date,
): boolean {
  if (!lastManualSleepAt) return false
  const manualTime = new Date(lastManualSleepAt)
  const manualHour = manualTime.getHours()

  // 手動操作が深夜帯（22:00〜6:59）なら次の境界は 7:00
  // 手動操作が昼間帯（7:00〜21:59）なら次の境界は 22:00
  const nextBoundary = new Date(manualTime)
  if (manualHour >= 22 || manualHour < 7) {
    // 次の 7:00
    nextBoundary.setHours(7, 0, 0, 0)
    if (manualHour >= 22) nextBoundary.setDate(nextBoundary.getDate() + 1)
  } else {
    // 次の 22:00
    nextBoundary.setHours(22, 0, 0, 0)
  }

  return now < nextBoundary
}

/** 就寝状態を更新する（自動就寝/起床。手動操作中はスキップ） */
export function applySleepSchedule(
  state: TamagotchiState,
  currentHour: number,
  now = new Date(),
): TamagotchiState {
  // 手動操作が有効な間は自動スケジュールを適用しない
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

/** 手動でんきボタンによるトグル */
export function toggleSleep(state: TamagotchiState): TamagotchiState {
  return {
    ...state,
    isSleeping: !state.isSleeping,
    lastManualSleepAt: new Date().toISOString(),
  }
}
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add lib/tamagotchi/params.ts
git commit -m "feat: add auto-sleep schedule and manual toggle"
```

---

### Task A-5: ボタンアクション（ごはん・おそうじ・くすり）

**Files:**
- Modify: `lib/tamagotchi/params.ts`

- [ ] **Step 1: ボタンアクション関数と制約チェックを追加**

`params.ts` に以下を追記:

```ts
/** ごはんボタンの使用可否 */
export function canFeed(state: TamagotchiState): boolean {
  if (state.params.hunger >= 90) return false
  // 窓の開始時刻から10分以内に3回食べたらブロック
  if (state.feedCount >= 3 && state.feedWindowStart) {
    const windowElapsed = Date.now() - new Date(state.feedWindowStart).getTime()
    if (windowElapsed < 10 * 60 * 1000) return false
  }
  return true
}

/** ごはんを与える */
export function feed(state: TamagotchiState): TamagotchiState {
  if (!canFeed(state)) return state
  const now = new Date()
  // 窓が未設定 or 10分経過でリセット
  const windowExpired =
    !state.feedWindowStart ||
    now.getTime() - new Date(state.feedWindowStart).getTime() >= 10 * 60 * 1000

  return {
    ...state,
    params: clampParams({
      ...state.params,
      hunger: state.params.hunger + 20,
    }),
    feedCount: windowExpired ? 1 : state.feedCount + 1,
    feedWindowStart: windowExpired ? now.toISOString() : state.feedWindowStart,
    lastUpdated: now.toISOString(),
  }
}

/** おそうじボタンの使用可否 */
export function canClean(state: TamagotchiState): boolean {
  return state.params.poop > 10
}

/** おそうじする */
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

/** くすりボタンの使用可否 */
export function canMedicate(state: TamagotchiState): boolean {
  return state.params.health < 70
}

/** くすりを飲む */
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

/** ミニゲーム結果でのきげん回復 */
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
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add lib/tamagotchi/params.ts
git commit -m "feat: add feed, clean, medicate, and game result actions"
```

---

### Task A-6: 表情マッピング

**Files:**
- Create: `lib/tamagotchi/expression.ts`

- [ ] **Step 1: パラメータから表情を判定する関数を実装**

```ts
import type { TamagotchiParams, TamagotchiExpression } from "@/types/tamagotchi"

/** パラメータの状態から表情を決定する（優先度順） */
export function toExpression(
  params: TamagotchiParams,
  isSleeping: boolean,
): TamagotchiExpression {
  if (isSleeping) return "sleeping"
  if (params.health < 30) return "sick"
  if (params.sleepy > 70) return "drowsy"
  if (params.hunger < 30) return "hungry"
  if (params.poop > 70) return "dirty"
  if (params.mood < 30) return "sad"
  return "happy"
}
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add lib/tamagotchi/expression.ts
git commit -m "feat: add parameter-to-expression mapping with priority"
```

---

### Task A-7: localStorage 永続化

**Files:**
- Create: `lib/tamagotchi/storage.ts`

- [ ] **Step 1: 保存・読み込み・経過時間適用を実装**

```ts
import type { TamagotchiState } from "@/types/tamagotchi"
import {
  createDefaultState,
  applyDecay,
  applySleepSchedule,
} from "@/lib/tamagotchi/params"

const STORAGE_KEY = "yamagotchi-state"

/** localStorage に状態を保存 */
export function saveState(state: TamagotchiState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage が使えない環境では無視
  }
}

/** localStorage から状態を読み込み、経過時間を適用して返す */
export function loadState(): TamagotchiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const saved = JSON.parse(raw) as TamagotchiState

    // 経過時間を計算して減衰を一括適用
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

/** 状態をリセット */
export function resetState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add lib/tamagotchi/storage.ts
git commit -m "feat: add localStorage persistence with elapsed-time decay"
```

---

## Chunk B: スプライト拡張 + use-tamagotchi フック

### Task B-1: 新規表情スプライト（hungry, sad, dirty）

**Files:**
- Modify: `lib/sprites.ts`

- [ ] **Step 1: TamagotchiExpression 型のインポートと新規スプライト生成関数を追加**

`sprites.ts` の先頭の import を更新:
```ts
import type { CharacterState } from "@/types/agent-status"
import type { TamagotchiExpression } from "@/types/tamagotchi"
```

ファイル末尾の `generateIdle()` の後に以下を追加:

```ts
// --- Tamagotchi expression sprites ---

/** おなかすいた顔（口をもぐもぐ） */
function generateHungry(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawEyes(f1, 0)
  // もぐもぐ口（小さい開口）
  dot(f1, 15, 19, M)
  dot(f1, 16, 19, M)
  dot(f1, 17, 19, M)
  dot(f1, 15, 20, M)
  dot(f1, 16, 20, W)
  dot(f1, 17, 20, M)
  drawArms(f1, 0, "relaxed")
  drawPants(f1, 0)
  drawLegs(f1, 0, "standing")

  const f2 = blank()
  drawBody(f2, 0)
  drawEyes(f2, 0)
  // 口閉じ
  drawFlatMouth(f2, 0)
  drawArms(f2, 0, "relaxed")
  drawPants(f2, 0)
  drawLegs(f2, 0, "standing")

  return { frames: [f1, f2], frameDuration: 400 }
}

/** しょんぼり顔 */
function generateSad(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 1)
  // 下向き目
  drawClosedEyes(f1, 1)
  // 下がった口
  dot(f1, 14, 21, M)
  dot(f1, 15, 20, M)
  dot(f1, 16, 20, M)
  dot(f1, 17, 20, M)
  dot(f1, 18, 21, M)
  drawArms(f1, 1, "droopy")
  drawPants(f1, 1)
  drawLegs(f1, 1, "standing")

  const f2 = blank()
  drawBody(f2, 1)
  drawClosedEyes(f2, 1)
  dot(f2, 14, 21, M)
  dot(f2, 15, 20, M)
  dot(f2, 16, 20, M)
  dot(f2, 17, 20, M)
  dot(f2, 18, 21, M)
  drawArms(f2, 1, "droopy")
  drawPants(f2, 1)
  drawLegs(f2, 1, "standing")
  // 涙
  dot(f2, 10, 17, U)
  dot(f2, 22, 17, U)

  return { frames: [f1, f2], frameDuration: 700 }
}

/** 困り顔（うんち多い） */
function generateDirty(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawFrustratedEyes(f1, 0)
  drawGrittedMouth(f1, 0)
  drawArms(f1, 0, "tucked")
  drawPants(f1, 0)
  drawLegs(f1, 0, "standing")
  // 汗マーク
  dot(f1, 5, 10, U)
  dot(f1, 5, 11, U)

  const f2 = blank()
  drawBody(f2, -1)
  drawFrustratedEyes(f2, -1)
  drawGrittedMouth(f2, -1)
  drawArms(f2, -1, "tucked")
  drawPants(f2, -1)
  drawLegs(f2, -1, "standing")
  dot(f2, 27, 10, U)
  dot(f2, 27, 11, U)

  return { frames: [f1, f2], frameDuration: 500 }
}
```

- [ ] **Step 2: getSprite のシグネチャを拡張**

`sprites.ts` 末尾の `sprites` マップと `getSprite` を以下に置き換え:

```ts
const sprites: Record<CharacterState, SpriteAnimation> = {
  normal: generateNormal(),
  processing: generateProcessing(),
  error: generateError(),
  resolved: generateResolved(),
  idle: generateIdle(),
}

const expressionSprites: Record<TamagotchiExpression, SpriteAnimation> = {
  happy: sprites.normal,
  hungry: generateHungry(),
  sad: generateSad(),
  dirty: generateDirty(),
  drowsy: sprites.idle,
  sick: sprites.error,
  sleeping: sprites.idle,
}

/** Get the sprite animation for a given state or expression */
export function getSprite(
  state: CharacterState | TamagotchiExpression,
): SpriteAnimation {
  if (state in sprites) return sprites[state as CharacterState]
  return expressionSprites[state as TamagotchiExpression]
}
```

- [ ] **Step 3: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add lib/sprites.ts
git commit -m "feat: add hungry/sad/dirty sprites and extend getSprite for TamagotchiExpression"
```

---

### Task B-2: use-tamagotchi フック

**Files:**
- Create: `hooks/use-tamagotchi.ts`

- [ ] **Step 1: パラメータ管理の統合フックを実装**

```ts
"use client"

import { useState, useEffect, useCallback } from "react"
import type { TamagotchiState } from "@/types/tamagotchi"
import type { TamagotchiExpression } from "@/types/tamagotchi"
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

  // 初回ロード（クライアントサイドのみ）
  useEffect(() => {
    setState(loadState())
  }, [])

  // 毎分の減衰ティック（setState コールバックで最新状態を参照）
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

  // アクション後に即保存
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

  const doFeed = useCallback(() => act(feed), [act])
  const doClean = useCallback(() => act(clean), [act])
  const doMedicate = useCallback(() => act(medicate), [act])
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
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add hooks/use-tamagotchi.ts
git commit -m "feat: add use-tamagotchi hook integrating params, decay, persistence"
```

---

## Chunk C: UIコンポーネント

### Task C-1: アクションボタン

**Files:**
- Create: `components/action-buttons.tsx`

- [ ] **Step 1: アイコンボタン群コンポーネントを実装**

```tsx
"use client"

import { Button } from "@/components/ui/button"

type Props = {
  onFeed: () => void
  onPlay: () => void
  onClean: () => void
  onMedicate: () => void
  onToggleSleep: () => void
  onStatus: () => void
  canFeed: boolean
  canClean: boolean
  canMedicate: boolean
  isSleeping: boolean
}

const BUTTONS = [
  { key: "feed", icon: "🍙", label: "ごはん" },
  { key: "play", icon: "🎮", label: "あそぶ" },
  { key: "clean", icon: "🧹", label: "おそうじ" },
  { key: "medicate", icon: "💊", label: "くすり" },
  { key: "light", icon: "💡", label: "でんき" },
  { key: "status", icon: "📊", label: "ステータス" },
] as const

export function ActionButtons({
  onFeed,
  onPlay,
  onClean,
  onMedicate,
  onToggleSleep,
  onStatus,
  canFeed,
  canClean,
  canMedicate,
  isSleeping,
}: Props) {
  const handlers: Record<string, () => void> = {
    feed: onFeed,
    play: onPlay,
    clean: onClean,
    medicate: onMedicate,
    light: onToggleSleep,
    status: onStatus,
  }

  const disabled: Record<string, boolean> = {
    feed: !canFeed,
    clean: !canClean,
    medicate: !canMedicate,
  }

  return (
    <div className="flex gap-2">
      {BUTTONS.map((btn) => (
        <Button
          key={btn.key}
          variant="outline"
          size="icon"
          className="h-10 w-10 text-lg font-mono"
          onClick={handlers[btn.key]}
          disabled={disabled[btn.key] ?? false}
          title={btn.key === "light" ? (isSleeping ? "起こす" : "寝かす") : btn.label}
        >
          {btn.icon}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add components/action-buttons.tsx
git commit -m "feat: add action buttons component with icon-based UI"
```

---

### Task C-2: ステータス表示

**Files:**
- Create: `components/status-view.tsx`

- [ ] **Step 1: ドット絵風パラメータバー表示を実装**

```tsx
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
        const level = paramLevel(value, cfg.invert)
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
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add components/status-view.tsx
git commit -m "feat: add status view with pixel-style parameter bars"
```

---

### Task C-3: tamagotchi-frame.tsx のステータステキスト動的化

**Files:**
- Modify: `components/tamagotchi-frame.tsx`

- [ ] **Step 1: パラメータ由来のメッセージ表示に対応**

`tamagotchi-frame.tsx` を以下のように更新:

```tsx
"use client"

import type { ReactNode } from "react"
import type { CharacterState } from "@/types/agent-status"
import type { TamagotchiExpression } from "@/types/tamagotchi"

type Props = {
  children: ReactNode
  state: CharacterState | TamagotchiExpression
  agentName: string
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

export function TamagotchiFrame({ children, state, agentName }: Props) {
  const label =
    state in STATE_LABELS
      ? STATE_LABELS[state as CharacterState]
      : EXPRESSION_LABELS[state as TamagotchiExpression]

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
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add components/tamagotchi-frame.tsx
git commit -m "feat: extend tamagotchi-frame to show expression-based status labels"
```

---

## Chunk D: ミニゲーム

### Task D-1: ゲーム選択画面

**Files:**
- Create: `components/mini-game/game-select.tsx`

- [ ] **Step 1: 3つのゲーム選択UIを実装**

```tsx
"use client"

import { Button } from "@/components/ui/button"

type GameType = "janken" | "direction" | "whack"

type Props = {
  onSelect: (game: GameType) => void
  onBack: () => void
}

const GAMES = [
  { type: "janken" as const, icon: "✊", label: "じゃんけん" },
  { type: "direction" as const, icon: "👆", label: "方向当て" },
  { type: "whack" as const, icon: "🔨", label: "もぐらたたき" },
] as const

export function GameSelect({ onSelect, onBack }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-xs font-bold text-zinc-300">あそぶ</div>
      <div className="flex flex-col gap-2">
        {GAMES.map((g) => (
          <Button
            key={g.type}
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={() => onSelect(g.type)}
          >
            {g.icon} {g.label}
          </Button>
        ))}
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        もどる
      </button>
    </div>
  )
}

export type { GameType }
```

- [ ] **Step 2: コミット**

```bash
git add components/mini-game/game-select.tsx
git commit -m "feat: add game selection screen"
```

---

### Task D-2: じゃんけんゲーム

**Files:**
- Create: `components/mini-game/janken.tsx`

- [ ] **Step 1: じゃんけんロジックとUIを実装**

```tsx
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

      if (result === "draw") return // やり直し

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
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add components/mini-game/janken.tsx
git commit -m "feat: add janken mini-game with draw retry logic"
```

---

### Task D-3: 方向当てゲーム

**Files:**
- Create: `components/mini-game/direction.tsx`

- [ ] **Step 1: 方向当てロジックとUIを実装**

```tsx
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

  // ターゲット表示後に隠す
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
        // 次のラウンド
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
        {showTarget ? dirIcon(target) : lastGuess ? (lastGuess.correct ? "⭕" : "❌") : "❓"}
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
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add components/mini-game/direction.tsx
git commit -m "feat: add direction guessing mini-game"
```

---

### Task D-4: もぐらたたきゲーム

**Files:**
- Create: `components/mini-game/whack.tsx`

- [ ] **Step 1: もぐらたたきロジックとUIを実装**

```tsx
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

  // スポーンタイマー
  useEffect(() => {
    if (finished) return
    const spawnTimer = setInterval(() => {
      const now = Date.now()
      setMoles((prev) => {
        // 期限切れを除去
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

  // 時間カウントダウン
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

  // 期限切れもぐらの除去
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
```

- [ ] **Step 2: 型チェック**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add components/mini-game/whack.tsx
git commit -m "feat: add whack-a-mole mini-game with spawn timing"
```

---

## Chunk E: ページ統合

### Task E-1: page.tsx に全機能を統合

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: page.tsx をたまごっちモードに書き換え**

```tsx
"use client"

import { useState } from "react"
import { TamagotchiFrame } from "@/components/tamagotchi-frame"
import { PixelCanvas } from "@/components/pixel-canvas"
import { QuoteDisplay } from "@/components/quote-display"
import { SlackButton } from "@/components/slack-button"
import { ActionButtons } from "@/components/action-buttons"
import { StatusView } from "@/components/status-view"
import { GameSelect } from "@/components/mini-game/game-select"
import type { GameType } from "@/components/mini-game/game-select"
import { Janken } from "@/components/mini-game/janken"
import { DirectionGame } from "@/components/mini-game/direction"
import { WhackGame } from "@/components/mini-game/whack"
import { useTamagotchi } from "@/hooks/use-tamagotchi"
import { useSpriteAnimation } from "@/hooks/use-sprite-animation"
import { getSprite } from "@/lib/sprites"

type ScreenMode = "main" | "status" | "game-select" | "game-playing"

export default function Page() {
  const tamagotchi = useTamagotchi()
  const sprite = getSprite(tamagotchi.expression)
  const frame = useSpriteAnimation(sprite)

  const [screenMode, setScreenMode] = useState<ScreenMode>("main")
  const [currentGame, setCurrentGame] = useState<GameType | null>(null)

  function handleGameSelect(game: GameType) {
    setCurrentGame(game)
    setScreenMode("game-playing")
  }

  function handleGameFinish(won: boolean) {
    tamagotchi.doGameResult(won)
    setCurrentGame(null)
    setScreenMode("main")
  }

  const screenContent = (() => {
    if (screenMode === "status" && tamagotchi.state) {
      return (
        <StatusView
          params={tamagotchi.state.params}
          onClose={() => setScreenMode("main")}
        />
      )
    }
    if (screenMode === "game-select") {
      return (
        <GameSelect
          onSelect={handleGameSelect}
          onBack={() => setScreenMode("main")}
        />
      )
    }
    if (screenMode === "game-playing" && currentGame) {
      if (currentGame === "janken") {
        return <Janken onFinish={handleGameFinish} />
      }
      if (currentGame === "direction") {
        return <DirectionGame onFinish={handleGameFinish} />
      }
      if (currentGame === "whack") {
        return <WhackGame onFinish={handleGameFinish} />
      }
    }
    return <PixelCanvas frame={frame} scale={8} />
  })()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 p-4">
      <TamagotchiFrame
        state={tamagotchi.expression}
        agentName="Claude.Yamabe"
      >
        {screenContent}
      </TamagotchiFrame>
      <ActionButtons
        onFeed={tamagotchi.doFeed}
        onPlay={() => setScreenMode("game-select")}
        onClean={tamagotchi.doClean}
        onMedicate={tamagotchi.doMedicate}
        onToggleSleep={tamagotchi.doToggleSleep}
        onStatus={() =>
          setScreenMode(screenMode === "status" ? "main" : "status")
        }
        canFeed={tamagotchi.canFeed}
        canClean={tamagotchi.canClean}
        canMedicate={tamagotchi.canMedicate}
        isSleeping={tamagotchi.state?.isSleeping ?? false}
      />
      <SlackButton />
      <QuoteDisplay />
    </div>
  )
}
```

ポイント:
- 既存の `useAgentStatus` は一旦削除。将来的に業務連動時に復活させる
- `screenMode` で画面遷移を管理: main → status / game-select → game-playing
- ゲーム終了時に `doGameResult` できげんを回復

- [ ] **Step 2: 型チェックと開発サーバー確認**

Run: `cd ~/yamagotchi && npx tsc --noEmit`
Expected: PASS

ブラウザで `http://localhost:3000` を開いて以下を確認:
- ドット絵キャラが表示される
- 6つのアイコンボタンが表示される
- 🍙ボタンでおなかが回復する
- 📊ボタンでステータスが表示される
- 🎮ボタンでゲーム選択画面になる
- 各ミニゲームが動作する

- [ ] **Step 3: コミット**

```bash
git add app/page.tsx
git commit -m "feat: integrate tamagotchi system into main page"
```

---

### Task E-2: 動作確認と微調整

- [ ] **Step 1: 全機能の動作確認**

ブラウザで以下をチェック:
- キャラの表情がパラメータに応じて変わる（📊でパラメータを確認しながら）
- ごはんボタンの連続制限（3回で無効化→10分後に復活）
- おそうじボタンの制約（うんち10以下で無効化）
- くすりボタンの制約（体調70以上で無効化）
- でんきボタンで就寝ON/OFFが切り替わる
- ミニゲーム終了後にきげんが上がる
- ブラウザリロード後にパラメータが復元される
- 数分放置して減衰が進む

- [ ] **Step 2: 問題があれば修正してコミット**

```bash
git add -A
git commit -m "fix: polish tamagotchi interactions and edge cases"
```
