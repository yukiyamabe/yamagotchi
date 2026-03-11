"use client"

import { useState, useCallback, useRef } from "react"
import type { TamagotchiExpression } from "@/types/tamagotchi"
import { TamagotchiFrame } from "@/components/tamagotchi-frame"
import { PixelCanvas } from "@/components/pixel-canvas"
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
import { useMumble } from "@/hooks/use-mumble"
import { getSprite } from "@/lib/sprites"

type ScreenMode = "main" | "status" | "game-select" | "game-playing"

export default function Page() {
  const tamagotchi = useTamagotchi()
  const [overrideExpression, setOverrideExpression] =
    useState<TamagotchiExpression | null>(null)
  const [overrideLabel, setOverrideLabel] = useState<string | null>(null)
  const overrideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeExpression = overrideExpression ?? tamagotchi.expression
  const sprite = getSprite(activeExpression)
  const frame = useSpriteAnimation(sprite)
  const mumble = useMumble(!!overrideLabel)

  const [screenMode, setScreenMode] = useState<ScreenMode>("main")
  const [currentGame, setCurrentGame] = useState<GameType | null>(null)
  const [flushAnimation, setFlushAnimation] = useState(false)

  const flashReaction = useCallback(
    (expr: TamagotchiExpression, label: string, durationMs = 2000) => {
      if (overrideTimer.current) clearTimeout(overrideTimer.current)
      setOverrideExpression(expr)
      setOverrideLabel(label)
      overrideTimer.current = setTimeout(() => {
        setOverrideExpression(null)
        setOverrideLabel(null)
      }, durationMs)
    },
    [],
  )

  const handleFeed = useCallback(() => {
    const result = tamagotchi.doFeed()
    if (result === "full") {
      flashReaction("sad", "おなかいっぱいだよ〜！ 😭")
    }
  }, [tamagotchi.doFeed, flashReaction])

  const handleClean = useCallback(() => {
    const result = tamagotchi.doClean()
    if (result === "clean") {
      flashReaction("happy", "きれいだよ！ ✨")
    } else {
      setFlushAnimation(true)
      setTimeout(() => setFlushAnimation(false), 600)
    }
  }, [tamagotchi.doClean, flashReaction])

  const handleMedicate = useCallback(() => {
    const result = tamagotchi.doMedicate()
    if (result === "healthy") {
      flashReaction("happy", "げんきだよ！ 💪")
    }
  }, [tamagotchi.doMedicate, flashReaction])

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
    const poopCount = tamagotchi.state
      ? Math.min(3, Math.floor(tamagotchi.state.params.poop / 25))
      : 0
    return (
      <PixelCanvas
        frame={frame}
        scale={8}
        poopCount={poopCount}
        flushAnimation={flushAnimation}
      />
    )
  })()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 p-4">
      <TamagotchiFrame
        state={activeExpression}
        agentName="Claude.Yamabe"
        labelOverride={overrideLabel ?? mumble}
      >
        {screenContent}
      </TamagotchiFrame>
      <ActionButtons
        onFeed={handleFeed}
        onPlay={() => setScreenMode("game-select")}
        onClean={handleClean}
        onMedicate={handleMedicate}
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
    </div>
  )
}
