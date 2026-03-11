import type {
  TamagotchiParams,
  TamagotchiExpression,
} from "@/types/tamagotchi"

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
