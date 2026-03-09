import { NextResponse } from "next/server"

const TASKS = ["idle", "slack", "coding", "skill"] as const
const PROCESSES = ["running", "running", "running", "stopped", "error"] as const

export async function GET() {
  const process = PROCESSES[Math.floor(Math.random() * PROCESSES.length)]
  return NextResponse.json({
    process,
    task: TASKS[Math.floor(Math.random() * TASKS.length)],
    agentName: "Claude.Yamabe",
    uptime: Math.floor(Math.random() * 7200),
    ...(process === "running" && Math.random() > 0.8 ? { lastResolved: Date.now() - 5000 } : {}),
  })
}
