import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { message } = await request.json()
  // TODO: Connect to Slack API to send message to Claude.Yamabe
  console.log("[yamagotchi] Message to send:", message)
  return NextResponse.json({ ok: true, message })
}
