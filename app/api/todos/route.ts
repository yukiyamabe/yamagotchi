import { NextResponse } from "next/server"
import { readTamagotchiState } from "@/lib/tamagotchi/state-file"

export async function GET() {
  const state = await readTamagotchiState()
  const completed = state.todos.filter((t) => t.status === "completed").length
  const total = state.todos.length
  return NextResponse.json({
    todos: state.todos,
    progress: total > 0 ? `${completed}/${total}` : null,
    pendingQuestion: state.pendingQuestion,
  })
}
