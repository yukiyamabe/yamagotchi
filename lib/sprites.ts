import type { CharacterState } from "@/types/agent-status"

// Color palette
const _ = "#00000000" // transparent
const K = "#1a1a2e" // black (outlines)
const W = "#ffffff" // white
const S = "#ffcc99" // skin
const D = "#e6a86e" // skinShadow
const E = "#1a1a2e" // eye
const M = "#cc4444" // mouth
const B = "#ff8899" // blush
const U = "#4488ff" // blue
const G = "#44cc88" // green
const R = "#ff4444" // red
const Z = "#6666aa" // zzz

export type SpriteFrame = string[][]
export type SpriteAnimation = {
  frames: SpriteFrame[]
  frameDuration: number
}

/** Create a blank 32x32 frame */
function blank(): SpriteFrame {
  return Array.from({ length: 32 }, () => Array(32).fill(_))
}

/** Draw a filled circle on the frame */
function circle(
  frame: SpriteFrame,
  cx: number,
  cy: number,
  r: number,
  fill: string,
  outline?: string,
) {
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (outline && dist <= r + 0.8 && dist > r - 0.8) {
        frame[y][x] = outline
      } else if (dist < r - 0.8) {
        frame[y][x] = fill
      }
    }
  }
}

/** Draw a small dot / pixel block */
function dot(frame: SpriteFrame, x: number, y: number, color: string) {
  if (y >= 0 && y < 32 && x >= 0 && x < 32) {
    frame[y][x] = color
  }
}

/** Draw a rectangle */
function rect(
  frame: SpriteFrame,
  x1: number,
  y1: number,
  w: number,
  h: number,
  color: string,
) {
  for (let y = y1; y < y1 + h && y < 32; y++) {
    for (let x = x1; x < x1 + w && x < 32; x++) {
      if (x >= 0 && y >= 0) frame[y][x] = color
    }
  }
}

/** Draw the base body: round face with skin fill and outline */
function drawBody(frame: SpriteFrame, offsetY = 0) {
  // Main body circle (center 16,16 radius 10)
  circle(frame, 16, 16 + offsetY, 10, S, K)
  // Shadow on bottom half
  for (let y = 17 + offsetY; y < 26 + offsetY; y++) {
    for (let x = 6; x < 26; x++) {
      if (frame[y]?.[x] === S) {
        const dist = Math.sqrt((x - 16) ** 2 + (y - 16 - offsetY) ** 2)
        if (dist > 7) frame[y][x] = D
      }
    }
  }
}

/** Draw standard open eyes */
function drawEyes(frame: SpriteFrame, offsetY = 0) {
  // Left eye
  dot(frame, 12, 14 + offsetY, W)
  dot(frame, 13, 14 + offsetY, W)
  dot(frame, 12, 15 + offsetY, E)
  dot(frame, 13, 15 + offsetY, W)
  // Right eye
  dot(frame, 19, 14 + offsetY, W)
  dot(frame, 20, 14 + offsetY, W)
  dot(frame, 19, 15 + offsetY, E)
  dot(frame, 20, 15 + offsetY, W)
}

/** Draw blush marks on cheeks */
function drawBlush(frame: SpriteFrame, offsetY = 0) {
  dot(frame, 10, 18 + offsetY, B)
  dot(frame, 11, 18 + offsetY, B)
  dot(frame, 21, 18 + offsetY, B)
  dot(frame, 22, 18 + offsetY, B)
}

/** Draw a small smile */
function drawSmile(frame: SpriteFrame, offsetY = 0) {
  dot(frame, 14, 19 + offsetY, M)
  dot(frame, 15, 20 + offsetY, M)
  dot(frame, 16, 20 + offsetY, M)
  dot(frame, 17, 20 + offsetY, M)
  dot(frame, 18, 19 + offsetY, M)
}

/** Draw open mouth */
function drawOpenMouth(frame: SpriteFrame, offsetY = 0) {
  dot(frame, 14, 19 + offsetY, M)
  dot(frame, 15, 19 + offsetY, M)
  dot(frame, 16, 19 + offsetY, M)
  dot(frame, 17, 19 + offsetY, M)
  dot(frame, 18, 19 + offsetY, M)
  dot(frame, 14, 20 + offsetY, M)
  dot(frame, 15, 20 + offsetY, W)
  dot(frame, 16, 20 + offsetY, W)
  dot(frame, 17, 20 + offsetY, W)
  dot(frame, 18, 20 + offsetY, M)
  dot(frame, 14, 21 + offsetY, M)
  dot(frame, 15, 21 + offsetY, M)
  dot(frame, 16, 21 + offsetY, M)
  dot(frame, 17, 21 + offsetY, M)
  dot(frame, 18, 21 + offsetY, M)
}

/** Draw closed/sleepy eyes (horizontal lines) */
function drawClosedEyes(frame: SpriteFrame, offsetY = 0) {
  dot(frame, 11, 15 + offsetY, E)
  dot(frame, 12, 15 + offsetY, E)
  dot(frame, 13, 15 + offsetY, E)
  dot(frame, 19, 15 + offsetY, E)
  dot(frame, 20, 15 + offsetY, E)
  dot(frame, 21, 15 + offsetY, E)
}

/** Draw focused/determined eyes (smaller, sharper) */
function drawFocusedEyes(frame: SpriteFrame, offsetY = 0) {
  // Left eye - narrowed
  dot(frame, 11, 14 + offsetY, K)
  dot(frame, 12, 14 + offsetY, E)
  dot(frame, 13, 14 + offsetY, E)
  dot(frame, 14, 14 + offsetY, K)
  dot(frame, 12, 15 + offsetY, E)
  dot(frame, 13, 15 + offsetY, W)
  // Right eye - narrowed
  dot(frame, 18, 14 + offsetY, K)
  dot(frame, 19, 14 + offsetY, E)
  dot(frame, 20, 14 + offsetY, E)
  dot(frame, 21, 14 + offsetY, K)
  dot(frame, 19, 15 + offsetY, E)
  dot(frame, 20, 15 + offsetY, W)
}

/** Draw dizzy/spiral eyes */
function drawDizzyEyes(frame: SpriteFrame, offsetY = 0, alt = false) {
  if (alt) {
    // X eyes
    dot(frame, 11, 14 + offsetY, E)
    dot(frame, 13, 14 + offsetY, E)
    dot(frame, 12, 15 + offsetY, E)
    dot(frame, 11, 16 + offsetY, E)
    dot(frame, 13, 16 + offsetY, E)
    dot(frame, 19, 14 + offsetY, E)
    dot(frame, 21, 14 + offsetY, E)
    dot(frame, 20, 15 + offsetY, E)
    dot(frame, 19, 16 + offsetY, E)
    dot(frame, 21, 16 + offsetY, E)
  } else {
    // @ eyes
    dot(frame, 11, 14 + offsetY, E)
    dot(frame, 12, 14 + offsetY, E)
    dot(frame, 13, 14 + offsetY, E)
    dot(frame, 13, 15 + offsetY, E)
    dot(frame, 12, 15 + offsetY, E)
    dot(frame, 11, 16 + offsetY, E)
    dot(frame, 12, 16 + offsetY, E)
    dot(frame, 13, 16 + offsetY, E)
    dot(frame, 19, 14 + offsetY, E)
    dot(frame, 20, 14 + offsetY, E)
    dot(frame, 21, 14 + offsetY, E)
    dot(frame, 21, 15 + offsetY, E)
    dot(frame, 20, 15 + offsetY, E)
    dot(frame, 19, 16 + offsetY, E)
    dot(frame, 20, 16 + offsetY, E)
    dot(frame, 21, 16 + offsetY, E)
  }
}

/** Draw a wavy/sick mouth */
function drawSickMouth(frame: SpriteFrame, offsetY = 0) {
  dot(frame, 14, 19 + offsetY, G)
  dot(frame, 15, 20 + offsetY, G)
  dot(frame, 16, 19 + offsetY, G)
  dot(frame, 17, 20 + offsetY, G)
  dot(frame, 18, 19 + offsetY, G)
}

/** Draw "Zzz" text floating above */
function drawZzz(frame: SpriteFrame) {
  // Big Z
  dot(frame, 22, 3, Z)
  dot(frame, 23, 3, Z)
  dot(frame, 24, 3, Z)
  dot(frame, 24, 4, Z)
  dot(frame, 23, 5, Z)
  dot(frame, 22, 6, Z)
  dot(frame, 22, 7, Z)
  dot(frame, 23, 7, Z)
  dot(frame, 24, 7, Z)
  // Medium z
  dot(frame, 26, 5, Z)
  dot(frame, 27, 5, Z)
  dot(frame, 27, 6, Z)
  dot(frame, 26, 7, Z)
  dot(frame, 26, 8, Z)
  dot(frame, 27, 8, Z)
}

/** Draw typing hands below body */
function drawHands(frame: SpriteFrame, alt = false) {
  if (alt) {
    // Left hand up
    rect(frame, 10, 24, 2, 2, S)
    dot(frame, 10, 23, S)
    // Right hand down
    rect(frame, 20, 25, 2, 2, S)
    dot(frame, 21, 27, S)
  } else {
    // Left hand down
    rect(frame, 10, 25, 2, 2, S)
    dot(frame, 10, 27, S)
    // Right hand up
    rect(frame, 20, 24, 2, 2, S)
    dot(frame, 21, 23, S)
  }
  // Keyboard
  rect(frame, 9, 28, 14, 2, K)
  rect(frame, 10, 28, 12, 1, U)
  for (let x = 10; x < 22; x += 2) {
    dot(frame, x, 29, W)
  }
}

/** Draw a flat/neutral mouth */
function drawFlatMouth(frame: SpriteFrame, offsetY = 0) {
  dot(frame, 14, 19 + offsetY, M)
  dot(frame, 15, 19 + offsetY, M)
  dot(frame, 16, 19 + offsetY, M)
  dot(frame, 17, 19 + offsetY, M)
  dot(frame, 18, 19 + offsetY, M)
}

// --- Sprite generation for each state ---

function generateIdle(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawEyes(f1, 0)
  drawBlush(f1, 0)
  drawSmile(f1, 0)

  const f2 = blank()
  drawBody(f2, -1)
  drawEyes(f2, -1)
  drawBlush(f2, -1)
  drawSmile(f2, -1)

  return { frames: [f1, f2], frameDuration: 500 }
}

function generateTalking(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1)
  drawEyes(f1)
  drawBlush(f1)
  drawSmile(f1)

  const f2 = blank()
  drawBody(f2)
  drawEyes(f2)
  drawBlush(f2)
  drawOpenMouth(f2)

  return { frames: [f1, f2], frameDuration: 300 }
}

function generateCoding(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1)
  drawFocusedEyes(f1)
  drawFlatMouth(f1)
  drawHands(f1, false)

  const f2 = blank()
  drawBody(f2)
  drawFocusedEyes(f2)
  drawFlatMouth(f2)
  drawHands(f2, true)

  return { frames: [f1, f2], frameDuration: 400 }
}

function generateSleeping(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 1)
  drawClosedEyes(f1, 1)
  drawBlush(f1, 1)
  // Tiny sleeping mouth
  dot(f1, 15, 20, M)
  dot(f1, 16, 20, M)
  dot(f1, 17, 20, M)
  drawZzz(f1)

  const f2 = blank()
  drawBody(f2, 1)
  drawClosedEyes(f2, 1)
  drawBlush(f2, 1)
  dot(f2, 15, 20, M)
  dot(f2, 16, 20, M)
  dot(f2, 17, 20, M)
  // No Zzz in frame 2 (blink effect)

  return { frames: [f1, f2], frameDuration: 800 }
}

function generateSick(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawDizzyEyes(f1, 0, false)
  drawSickMouth(f1, 0)
  // Green tint on face
  dot(f1, 15, 12, G)
  dot(f1, 16, 12, G)

  const f2 = blank()
  drawBody(f2, 1)
  drawDizzyEyes(f2, 1, true)
  drawSickMouth(f2, 1)
  dot(f2, 15, 13, G)
  dot(f2, 16, 13, G)

  return { frames: [f1, f2], frameDuration: 600 }
}

// Pre-generate all sprites
const sprites: Record<CharacterState, SpriteAnimation> = {
  idle: generateIdle(),
  talking: generateTalking(),
  coding: generateCoding(),
  sleeping: generateSleeping(),
  sick: generateSick(),
}

/** Get the sprite animation for a given character state */
export function getSprite(state: CharacterState): SpriteAnimation {
  return sprites[state]
}
