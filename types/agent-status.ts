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
