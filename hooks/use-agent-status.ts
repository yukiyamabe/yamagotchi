"use client"

import { useState, useEffect } from "react"
import type { AgentStatus } from "@/types/agent-status"

const DEFAULT_STATUS: AgentStatus = {
  process: "stopped",
  task: "idle",
  agentName: "Claude.Yamabe",
  uptime: 0,
}

export function useAgentStatus(apiUrl: string, intervalMs = 5000) {
  const [status, setStatus] = useState<AgentStatus>(DEFAULT_STATUS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchStatus() {
      try {
        const res = await fetch(apiUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (active) {
          setStatus(data)
          setError(null)
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Unknown error")
          setStatus((prev) => ({ ...prev, process: "error" }))
        }
      }
    }

    fetchStatus()
    const id = setInterval(fetchStatus, intervalMs)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [apiUrl, intervalMs])

  return { status, error }
}
