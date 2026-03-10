import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export type TodoItem = {
  content: string
  status: "pending" | "in_progress" | "completed"
}

export type TamagotchiState = {
  isRunning: boolean
  lastActiveAt: string
  currentTask: string | null
  mood: "happy" | "working" | "sleeping" | "thinking"
  stats: {
    tasksCompletedToday: number
    messagesHandledToday: number
  }
  todos: TodoItem[]
  pendingQuestion: string | null
}

const STATE_DIR = path.join(process.cwd(), ".tamagotchi")
const STATE_FILE = path.join(STATE_DIR, "state.json")

const defaultState: TamagotchiState = {
  isRunning: false,
  lastActiveAt: new Date().toISOString(),
  currentTask: null,
  mood: "sleeping",
  stats: {
    tasksCompletedToday: 0,
    messagesHandledToday: 0,
  },
  todos: [],
  pendingQuestion: null,
}

export async function readTamagotchiState(): Promise<TamagotchiState> {
  try {
    const content = await readFile(STATE_FILE, "utf-8")
    return JSON.parse(content) as TamagotchiState
  } catch {
    return { ...defaultState, lastActiveAt: new Date().toISOString() }
  }
}

export async function writeTamagotchiState(
  state: TamagotchiState,
): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true })
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2))
}
