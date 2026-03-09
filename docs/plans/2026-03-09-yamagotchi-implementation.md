# yamagotchi Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Claudeエージェントの状態をたまごっち風ドット絵キャラで表示するブラウザダッシュボード

**Architecture:** yamagotchi (Next.js) がフロントエンド。inta 側に `/api/status` エンドポイントを追加し、yamagotchi からポーリングしてエージェント状態を取得。Canvas API で 32x32 ドット絵キャラを描画し、状態に応じて表情・アニメーションが変わる。

**Tech Stack:** Next.js, shadcn/ui, Canvas API, bun

---

### Task 1: エージェント状態の型定義

**Files:**
- Create: `types/agent-status.ts`

**Step 1: 型定義ファイルを作成**

```ts
export type ProcessStatus = "running" | "stopped" | "error"

export type TaskType = "idle" | "slack" | "coding" | "unknown"

export type AgentStatus = {
  process: ProcessStatus
  task: TaskType
  agentName: string
  uptime: number
}

export type CharacterState = "idle" | "talking" | "coding" | "sleeping" | "sick"

export function toCharacterState(status: AgentStatus): CharacterState {
  if (status.process === "stopped") return "sleeping"
  if (status.process === "error") return "sick"
  switch (status.task) {
    case "slack":
      return "talking"
    case "coding":
      return "coding"
    default:
      return "idle"
  }
}
```

**Step 2: Commit**

```bash
git add types/agent-status.ts
git commit -m "feat: add agent status type definitions"
```

---

### Task 2: ドット絵スプライトデータ

**Files:**
- Create: `lib/sprites.ts`

**Step 1: 32x32 ドット絵のピクセルデータを定義**

各キャラ状態ごとに 32x32 のカラーピクセル配列を定義する。アニメーション用に状態ごとに2フレーム持つ。

```ts
// 色パレット
export const PALETTE = {
  transparent: "rgba(0,0,0,0)",
  black: "#1a1a2e",
  white: "#eee",
  skin: "#ffcc99",
  skinShadow: "#e6a86e",
  eye: "#1a1a2e",
  mouth: "#cc5555",
  blush: "#ff9999",
  blue: "#4a90d9",
  green: "#5cb85c",
  red: "#d9534f",
  zzz: "#8888aa",
} as const

// CharacterState → フレーム配列のマップ
// 各フレームは 32x32 の2次元配列（パレットキー）
export type SpriteFrame = (keyof typeof PALETTE)[][]

export type SpriteAnimation = {
  frames: SpriteFrame[]
  frameDuration: number // ms
}

// 実際のスプライトデータ（シンプルな丸いキャラ）
// idle: ゆらゆら（2フレーム、500ms）
// talking: 口パク（2フレーム、300ms）
// coding: タイピング（2フレーム、400ms）
// sleeping: Zzz（2フレーム、800ms）
// sick: ふらふら（2フレーム、600ms）
export const SPRITES: Record<string, SpriteAnimation> = {
  // Task 2 で実際のピクセルデータを埋める
  // 最初はプレースホルダーとして簡易的な図形で実装
}
```

実際のスプライトデータはシンプルな丸いキャラ（顔 + 目 + 口）をコードで生成する関数として実装する。

```ts
export function generateSprites(): Record<string, SpriteAnimation> {
  // プログラムでドット絵を生成
  // 状態ごとに目・口の形を変える
}
```

**Step 2: Commit**

```bash
git add lib/sprites.ts
git commit -m "feat: add pixel sprite data and animation definitions"
```

---

### Task 3: Canvas ドット絵レンダラーコンポーネント

**Files:**
- Create: `components/pixel-canvas.tsx`

**Step 1: Canvas コンポーネントを作成**

```tsx
"use client"

import { useRef, useEffect } from "react"
import type { SpriteFrame } from "@/lib/sprites"

type Props = {
  frame: SpriteFrame
  scale?: number // 1ピクセルを何pxで描画するか（デフォルト8 → 256x256）
}

export function PixelCanvas({ frame, scale = 8 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false

    for (let y = 0; y < frame.length; y++) {
      for (let x = 0; x < frame[y].length; x++) {
        const color = frame[y][x]
        if (color === "transparent") continue
        ctx.fillStyle = color
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }, [frame, scale])

  return (
    <canvas
      ref={canvasRef}
      width={32 * scale}
      height={32 * scale}
      className="image-rendering-pixelated"
    />
  )
}
```

**Step 2: Commit**

```bash
git add components/pixel-canvas.tsx
git commit -m "feat: add Canvas pixel renderer component"
```

---

### Task 4: たまごっちフレーム（卵型UI）

**Files:**
- Create: `components/tamagotchi-frame.tsx`

**Step 1: 卵型フレームコンポーネントを作成**

```tsx
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
```

**Step 2: Commit**

```bash
git add components/tamagotchi-frame.tsx
git commit -m "feat: add tamagotchi egg-shaped frame component"
```

---

### Task 5: アニメーションフック

**Files:**
- Create: `hooks/use-sprite-animation.ts`

**Step 1: アニメーション制御フックを作成**

```ts
"use client"

import { useState, useEffect } from "react"
import type { SpriteAnimation, SpriteFrame } from "@/lib/sprites"

export function useSpriteAnimation(animation: SpriteAnimation): SpriteFrame {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % animation.frames.length)
    }, animation.frameDuration)
    return () => clearInterval(interval)
  }, [animation])

  return animation.frames[frameIndex]
}
```

**Step 2: Commit**

```bash
git add hooks/use-sprite-animation.ts
git commit -m "feat: add sprite animation hook"
```

---

### Task 6: ステータスポーリングフック

**Files:**
- Create: `hooks/use-agent-status.ts`

**Step 1: ポーリングフックを作成**

```ts
"use client"

import { useState, useEffect } from "react"
import type { AgentStatus } from "@/types/agent-status"

const DEFAULT_STATUS: AgentStatus = {
  process: "stopped",
  task: "idle",
  agentName: "Claude.Yamabe",
  uptime: 0,
}

export function useAgentStatus(apiUrl: string, intervalMs = 5000) {
  const [status, setStatus] = useState<AgentStatus>(DEFAULT_STATUS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchStatus() {
      try {
        const res = await fetch(apiUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (active) {
          setStatus(data)
          setError(null)
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Unknown error")
          setStatus((prev) => ({ ...prev, process: "error" }))
        }
      }
    }

    fetchStatus()
    const id = setInterval(fetchStatus, intervalMs)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [apiUrl, intervalMs])

  return { status, error }
}
```

**Step 2: Commit**

```bash
git add hooks/use-agent-status.ts
git commit -m "feat: add agent status polling hook"
```

---

### Task 7: メインページ組み立て

**Files:**
- Modify: `app/page.tsx`

**Step 1: ページをたまごっちUIに置き換え**

```tsx
"use client"

import { TamagotchiFrame } from "@/components/tamagotchi-frame"
import { PixelCanvas } from "@/components/pixel-canvas"
import { useAgentStatus } from "@/hooks/use-agent-status"
import { useSpriteAnimation } from "@/hooks/use-sprite-animation"
import { toCharacterState } from "@/types/agent-status"
import { getSprite } from "@/lib/sprites"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/status"

export default function Page() {
  const { status, error } = useAgentStatus(API_URL)
  const characterState = toCharacterState(status)
  const sprite = getSprite(characterState)
  const frame = useSpriteAnimation(sprite)

  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-950">
      <TamagotchiFrame state={characterState} agentName={status.agentName}>
        <PixelCanvas frame={frame} scale={8} />
      </TamagotchiFrame>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble tamagotchi main page"
```

---

### Task 8: モックAPIで動作確認

**Files:**
- Create: `app/api/mock-status/route.ts`

**Step 1: モックAPIエンドポイントを作成**

開発用にランダムで状態を返すモック API を作る。inta 側の実装前にUIの動作確認ができる。

```ts
import { NextResponse } from "next/server"

const TASKS = ["idle", "slack", "coding"] as const
const PROCESSES = ["running", "running", "running", "stopped", "error"] as const

export async function GET() {
  return NextResponse.json({
    process: PROCESSES[Math.floor(Math.random() * PROCESSES.length)],
    task: TASKS[Math.floor(Math.random() * TASKS.length)],
    agentName: "Claude.Yamabe",
    uptime: Math.floor(Math.random() * 7200),
  })
}
```

**Step 2: `NEXT_PUBLIC_API_URL` をモックに向けて動作確認**

Run: `NEXT_PUBLIC_API_URL=/api/mock-status bun dev`

ブラウザで http://localhost:3000 を開いてキャラが表示され、5秒ごとに状態が変わることを確認。

**Step 3: Commit**

```bash
git add app/api/mock-status/route.ts
git commit -m "feat: add mock status API for development"
```

---

### Task 9: inta 側 API エンドポイント（別リポジトリ）

**Files:**
- 別リポジトリ（inta）での作業
- 詳細は yamagotchi 側完成後に別途計画

**概要:**
- inta に HTTP サーバーまたは API route を追加
- `session-state.json` とプロセス情報を読み取って JSON レスポンスを返す
- yamagotchi の `NEXT_PUBLIC_API_URL` をそのエンドポイントに向ける

---

## 実装順序まとめ

1. Task 1: 型定義
2. Task 2: スプライトデータ
3. Task 3: Canvas レンダラー
4. Task 4: たまごっちフレーム
5. Task 5: アニメーションフック
6. Task 6: ポーリングフック
7. Task 7: メインページ組み立て
8. Task 8: モックAPIで動作確認
9. Task 9: inta 側 API（後日）
