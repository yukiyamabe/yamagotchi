import {
  readTamagotchiState,
  writeTamagotchiState,
  type TamagotchiState,
  type TodoItem,
} from "@/lib/tamagotchi/state-file"

function calculateMood(isRunning: boolean): TamagotchiState["mood"] {
  const hour = new Date().getHours()
  if (!isRunning) {
    if (hour < 10 || hour >= 19) {
      return "sleeping"
    }
    return "thinking"
  }
  return "working"
}

export async function updateRunningState(isRunning: boolean): Promise<void> {
  const current = await readTamagotchiState()
  const updated: TamagotchiState = {
    ...current,
    isRunning,
    lastActiveAt: isRunning ? new Date().toISOString() : current.lastActiveAt,
    mood: calculateMood(isRunning),
  }
  await writeTamagotchiState(updated)
}

export async function setCurrentTask(task: string | null): Promise<void> {
  const current = await readTamagotchiState()
  const updated: TamagotchiState = {
    ...current,
    currentTask: task,
    mood: task ? "working" : calculateMood(current.isRunning),
  }
  await writeTamagotchiState(updated)
}

export async function incrementTasksCompleted(): Promise<void> {
  const current = await readTamagotchiState()
  const updated: TamagotchiState = {
    ...current,
    stats: {
      ...current.stats,
      tasksCompletedToday: current.stats.tasksCompletedToday + 1,
    },
  }
  await writeTamagotchiState(updated)
}

export async function incrementMessagesHandled(): Promise<void> {
  const current = await readTamagotchiState()
  const updated: TamagotchiState = {
    ...current,
    stats: {
      ...current.stats,
      messagesHandledToday: current.stats.messagesHandledToday + 1,
    },
  }
  await writeTamagotchiState(updated)
}

export async function setTodos(todos: TodoItem[]): Promise<void> {
  const current = await readTamagotchiState()
  const updated: TamagotchiState = {
    ...current,
    todos,
    mood: todos.some((t) => t.status === "in_progress")
      ? "working"
      : calculateMood(current.isRunning),
  }
  await writeTamagotchiState(updated)
}

export async function setPendingQuestion(
  question: string | null,
): Promise<void> {
  const current = await readTamagotchiState()
  const updated: TamagotchiState = {
    ...current,
    pendingQuestion: question,
    mood: question ? "thinking" : calculateMood(current.isRunning),
  }
  await writeTamagotchiState(updated)
}

export async function clearTodosAndQuestion(): Promise<void> {
  const current = await readTamagotchiState()
  const updated: TamagotchiState = {
    ...current,
    todos: [],
    pendingQuestion: null,
  }
  await writeTamagotchiState(updated)
}
