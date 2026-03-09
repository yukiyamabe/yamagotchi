"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

const MESSAGES = [
  "おーい、元気？",
  "お仕事がんばって！",
  "何か手伝えることある？",
  "おにぎりあげる🍙",
  "今日もよろしく！",
]

export function SlackButton() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    setSending(true)
    try {
      const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => setSent(false), 3000)
      }
    } catch {
      // silently fail for now
    } finally {
      setSending(false)
    }
  }

  return (
    <Button
      onClick={handleSend}
      disabled={sending || sent}
      variant="outline"
      className="font-mono text-xs"
    >
      {sent ? "送信した！ 🫶" : sending ? "送信中..." : "話しかける 💬"}
    </Button>
  )
}
