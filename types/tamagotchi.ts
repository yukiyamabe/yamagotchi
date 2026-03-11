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
