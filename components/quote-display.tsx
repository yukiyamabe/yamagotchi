"use client"

import { useState, useEffect } from "react"
import { getRandomQuote, type Quote } from "@/lib/quotes"

export function QuoteDisplay() {
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    setQuote(getRandomQuote())
    const interval = setInterval(() => {
      setQuote(getRandomQuote())
    }, 30000) // Change every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (!quote) return null

  return (
    <div className="max-w-xs text-center font-mono">
      <p className="text-sm text-zinc-300 italic">「{quote.text}」</p>
      <p className="mt-1 text-xs text-zinc-500">
        — {quote.character}（{quote.series}）
      </p>
    </div>
  )
}
