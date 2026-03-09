export type ProcessStatus = "running" | "stopped" | "error"

export type TaskType = "idle" | "slack" | "coding" | "skill" | "unknown"

export type AgentStatus = {
  process: ProcessStatus
  task: TaskType
  agentName: string
  uptime: number
  lastError?: string
  lastResolved?: number // timestamp of last resolved error
}

export type CharacterState = "normal" | "processing" | "error" | "resolved" | "idle"

export function toCharacterState(status: AgentStatus): CharacterState {
  if (status.process === "stopped") return "idle"
  if (status.process === "error") return "error"
  // If resolved recently (within 30 seconds), show relieved face
  if (status.lastResolved && Date.now() - status.lastResolved < 30000) return "resolved"
  switch (status.task) {
    case "slack":
    case "coding":
    case "skill":
      return "processing"
    default:
      return "normal"
  }
}
