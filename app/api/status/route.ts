import { NextResponse } from "next/server"
import { readTamagotchiState } from "@/lib/tamagotchi/state-file"

export async function GET() {
  const state = await readTamagotchiState()
  return NextResponse.json({
    isRunning: state.isRunning,
    mood: state.mood,
    lastActiveAt: state.lastActiveAt,
    currentTask: state.currentTask,
    pendingQuestion: state.pendingQuestion,
  })
}
