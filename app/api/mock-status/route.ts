import { NextResponse } from "next/server"

const TASKS = ["idle", "slack", "coding"] as const
const PROCESSES = ["running", "running", "running", "stopped", "error"] as const

export async function GET() {
  return NextResponse.json({
    process: PROCESSES[Math.floor(Math.random() * PROCESSES.length)],
    task: TASKS[Math.floor(Math.random() * TASKS.length)],
    agentName: "Claude.Yamabe",
    uptime: Math.floor(Math.random() * 7200),
  })
}
