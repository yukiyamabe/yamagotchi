import type { CharacterState } from "@/types/agent-status"
import type { TamagotchiExpression } from "@/types/tamagotchi"

// Color palette
const _ = "#00000000" // transparent
const K = "#1a1a2e" // black (outlines)
const W = "#ffffff" // white
const S = "#fff44f" // lemon yellow
const D = "#e6d840" // lemon shadow
const E = "#1a1a2e" // eye
const M = "#cc4444" // mouth
const B = "#ff8899" // blush
const U = "#4488ff" // blue
const G = "#44cc88" // green
const R = "#ff4444" // red
const Z = "#6666aa" // zzz
const O = "#ff8c00" // orange pants
const SP = "#ffee88" // sparkle

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
  // Round ears (with outline)
  circle(frame, 7, 9 + offsetY, 3, S, K)
  circle(frame, 25, 9 + offsetY, 3, S, K)
  // Main body circle (drawn after ears, skin fill covers inner ear outlines)
  circle(frame, 16, 16 + offsetY, 10, S, K)
  // Fill over any remaining ear-body border with skin
  for (let y = 6 + offsetY; y < 16 + offsetY; y++) {
    for (let x = 6; x < 26; x++) {
      const bodyDist = Math.sqrt((x - 16) ** 2 + (y - 16 - offsetY) ** 2)
      if (bodyDist < 10 - 0.8 && frame[y]?.[x] === K) {
        frame[y][x] = S
      }
    }
  }
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

/** Draw orange pants on the lower body */
function drawPants(frame: SpriteFrame, offsetY = 0) {
  // Pants cover the bottom part of the body
  for (let y = 22 + offsetY; y < 26 + offsetY; y++) {
    for (let x = 8; x < 24; x++) {
      const dist = Math.sqrt((x - 16) ** 2 + (y - 16 - offsetY) ** 2)
      if (dist < 10 - 0.8 && y >= 0 && y < 32) {
        frame[y][x] = O
      }
    }
  }
}

/** Draw standard open eyes */
function drawEyes(frame: SpriteFrame, offsetY = 0) {
  // Left eye 2x3 (black with white highlight top-right)
  dot(frame, 13, 13 + offsetY, E)
  dot(frame, 14, 13 + offsetY, W)
  dot(frame, 13, 14 + offsetY, E)
  dot(frame, 14, 14 + offsetY, E)
  dot(frame, 13, 15 + offsetY, E)
  dot(frame, 14, 15 + offsetY, E)
  // Right eye 2x3 (black with white highlight top-right)
  dot(frame, 18, 13 + offsetY, E)
  dot(frame, 19, 13 + offsetY, W)
  dot(frame, 18, 14 + offsetY, E)
  dot(frame, 19, 14 + offsetY, E)
  dot(frame, 18, 15 + offsetY, E)
  dot(frame, 19, 15 + offsetY, E)
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

/** Draw thinking eyes (one eye slightly squinted) */
function drawThinkingEyes(frame: SpriteFrame, offsetY = 0) {
  // Left eye - normal open
  dot(frame, 13, 13 + offsetY, E)
  dot(frame, 14, 13 + offsetY, W)
  dot(frame, 13, 14 + offsetY, E)
  dot(frame, 14, 14 + offsetY, E)
  dot(frame, 13, 15 + offsetY, E)
  dot(frame, 14, 15 + offsetY, E)
  // Right eye - slightly squinted
  dot(frame, 18, 14 + offsetY, K)
  dot(frame, 19, 14 + offsetY, E)
  dot(frame, 20, 14 + offsetY, K)
  dot(frame, 18, 15 + offsetY, E)
  dot(frame, 19, 15 + offsetY, W)
  dot(frame, 20, 15 + offsetY, E)
}

/** Draw frustrated/angry eyes (angled eyebrows) */
function drawFrustratedEyes(frame: SpriteFrame, offsetY = 0) {
  // Left eyebrow - angled down toward center
  dot(frame, 11, 11 + offsetY, K)
  dot(frame, 12, 12 + offsetY, K)
  dot(frame, 13, 12 + offsetY, K)
  // Left eye
  dot(frame, 12, 14 + offsetY, E)
  dot(frame, 13, 14 + offsetY, E)
  dot(frame, 12, 15 + offsetY, E)
  dot(frame, 13, 15 + offsetY, W)
  // Right eyebrow - angled down toward center
  dot(frame, 21, 11 + offsetY, K)
  dot(frame, 20, 12 + offsetY, K)
  dot(frame, 19, 12 + offsetY, K)
  // Right eye
  dot(frame, 19, 14 + offsetY, E)
  dot(frame, 20, 14 + offsetY, E)
  dot(frame, 19, 15 + offsetY, W)
  dot(frame, 20, 15 + offsetY, E)
}

/** Draw gritted teeth mouth */
function drawGrittedMouth(frame: SpriteFrame, offsetY = 0) {
  dot(frame, 13, 19 + offsetY, K)
  dot(frame, 14, 19 + offsetY, W)
  dot(frame, 15, 19 + offsetY, K)
  dot(frame, 16, 19 + offsetY, W)
  dot(frame, 17, 19 + offsetY, K)
  dot(frame, 18, 19 + offsetY, W)
  dot(frame, 19, 19 + offsetY, K)
  dot(frame, 13, 20 + offsetY, K)
  dot(frame, 14, 20 + offsetY, W)
  dot(frame, 15, 20 + offsetY, K)
  dot(frame, 16, 20 + offsetY, W)
  dot(frame, 17, 20 + offsetY, K)
  dot(frame, 18, 20 + offsetY, W)
  dot(frame, 19, 20 + offsetY, K)
}

/** Draw happy closed eyes (curved, content) */
function drawHappyClosedEyes(frame: SpriteFrame, offsetY = 0) {
  // Left eye - upward curve (happy)
  dot(frame, 11, 15 + offsetY, E)
  dot(frame, 12, 14 + offsetY, E)
  dot(frame, 13, 14 + offsetY, E)
  dot(frame, 14, 15 + offsetY, E)
  // Right eye - upward curve (happy)
  dot(frame, 18, 15 + offsetY, E)
  dot(frame, 19, 14 + offsetY, E)
  dot(frame, 20, 14 + offsetY, E)
  dot(frame, 21, 15 + offsetY, E)
}

/** Draw gentle smile (smaller, softer) */
function drawGentleSmile(frame: SpriteFrame, offsetY = 0) {
  dot(frame, 15, 19 + offsetY, M)
  dot(frame, 16, 20 + offsetY, M)
  dot(frame, 17, 19 + offsetY, M)
}

/** Draw sparkles around the character */
function drawSparkles(frame: SpriteFrame, alt = false) {
  if (alt) {
    // Sparkle positions set 2
    dot(frame, 5, 5, SP)
    dot(frame, 27, 8, SP)
    dot(frame, 3, 14, SP)
    dot(frame, 28, 3, SP)
  } else {
    // Sparkle positions set 1
    dot(frame, 4, 8, SP)
    dot(frame, 26, 5, SP)
    dot(frame, 2, 12, SP)
    dot(frame, 29, 6, SP)
  }
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

/** Draw small stubby arms on both sides of the body */
function drawArms(
  frame: SpriteFrame,
  offsetY = 0,
  style: "relaxed" | "gesture-left" | "tucked" | "droopy" | "chin" = "relaxed",
) {
  if (style === "relaxed") {
    // Left arm - stubby, hanging at side
    dot(frame, 6, 18 + offsetY, K)
    dot(frame, 5, 19 + offsetY, K)
    dot(frame, 6, 19 + offsetY, S)
    dot(frame, 5, 20 + offsetY, K)
    dot(frame, 6, 20 + offsetY, S)
    dot(frame, 5, 21 + offsetY, K)
    dot(frame, 6, 21 + offsetY, K)
    // Right arm
    dot(frame, 25, 18 + offsetY, K)
    dot(frame, 26, 19 + offsetY, K)
    dot(frame, 25, 19 + offsetY, S)
    dot(frame, 26, 20 + offsetY, K)
    dot(frame, 25, 20 + offsetY, S)
    dot(frame, 26, 21 + offsetY, K)
    dot(frame, 25, 21 + offsetY, K)
  } else if (style === "gesture-left") {
    // Left arm raised up (gesturing)
    dot(frame, 5, 16 + offsetY, K)
    dot(frame, 4, 16 + offsetY, K)
    dot(frame, 5, 17 + offsetY, S)
    dot(frame, 4, 17 + offsetY, K)
    dot(frame, 6, 17 + offsetY, K)
    dot(frame, 3, 16 + offsetY, K)
    dot(frame, 3, 17 + offsetY, S)
    // Right arm relaxed
    dot(frame, 25, 18 + offsetY, K)
    dot(frame, 26, 19 + offsetY, K)
    dot(frame, 25, 19 + offsetY, S)
    dot(frame, 26, 20 + offsetY, K)
    dot(frame, 25, 20 + offsetY, S)
    dot(frame, 26, 21 + offsetY, K)
    dot(frame, 25, 21 + offsetY, K)
  } else if (style === "tucked") {
    // Arms tucked close to body
    dot(frame, 7, 19 + offsetY, K)
    dot(frame, 7, 20 + offsetY, S)
    dot(frame, 7, 21 + offsetY, K)
    dot(frame, 24, 19 + offsetY, K)
    dot(frame, 24, 20 + offsetY, S)
    dot(frame, 24, 21 + offsetY, K)
  } else if (style === "droopy") {
    // Arms hanging limply, lower than normal
    dot(frame, 6, 19 + offsetY, K)
    dot(frame, 5, 20 + offsetY, K)
    dot(frame, 6, 20 + offsetY, S)
    dot(frame, 5, 21 + offsetY, K)
    dot(frame, 6, 21 + offsetY, S)
    dot(frame, 5, 22 + offsetY, K)
    dot(frame, 6, 22 + offsetY, K)
    dot(frame, 25, 19 + offsetY, K)
    dot(frame, 26, 20 + offsetY, K)
    dot(frame, 25, 20 + offsetY, S)
    dot(frame, 26, 21 + offsetY, K)
    dot(frame, 25, 21 + offsetY, S)
    dot(frame, 26, 22 + offsetY, K)
    dot(frame, 25, 22 + offsetY, K)
  } else if (style === "chin") {
    // Left arm relaxed
    dot(frame, 6, 18 + offsetY, K)
    dot(frame, 5, 19 + offsetY, K)
    dot(frame, 6, 19 + offsetY, S)
    dot(frame, 5, 20 + offsetY, K)
    dot(frame, 6, 20 + offsetY, S)
    dot(frame, 5, 21 + offsetY, K)
    dot(frame, 6, 21 + offsetY, K)
    // Right arm raised to chin (thinking pose)
    dot(frame, 25, 17 + offsetY, K)
    dot(frame, 26, 17 + offsetY, K)
    dot(frame, 25, 18 + offsetY, S)
    dot(frame, 26, 18 + offsetY, K)
    dot(frame, 25, 19 + offsetY, S)
    dot(frame, 26, 19 + offsetY, K)
  }
}

/** Draw small stubby legs at the bottom of the body */
function drawLegs(
  frame: SpriteFrame,
  offsetY = 0,
  style: "standing" | "curled" | "wobbly" = "standing",
) {
  if (style === "standing") {
    // Left leg
    dot(frame, 13, 26 + offsetY, K)
    dot(frame, 14, 26 + offsetY, K)
    dot(frame, 13, 27 + offsetY, K)
    dot(frame, 14, 27 + offsetY, S)
    dot(frame, 13, 28 + offsetY, K)
    dot(frame, 14, 28 + offsetY, S)
    // Left foot (round)
    dot(frame, 12, 29 + offsetY, K)
    dot(frame, 13, 29 + offsetY, S)
    dot(frame, 14, 29 + offsetY, S)
    dot(frame, 15, 29 + offsetY, K)
    dot(frame, 12, 30 + offsetY, K)
    dot(frame, 13, 30 + offsetY, K)
    dot(frame, 14, 30 + offsetY, K)
    dot(frame, 15, 30 + offsetY, K)
    // Right leg
    dot(frame, 18, 26 + offsetY, K)
    dot(frame, 19, 26 + offsetY, K)
    dot(frame, 18, 27 + offsetY, S)
    dot(frame, 19, 27 + offsetY, K)
    dot(frame, 18, 28 + offsetY, S)
    dot(frame, 19, 28 + offsetY, K)
    // Right foot (round)
    dot(frame, 17, 29 + offsetY, K)
    dot(frame, 18, 29 + offsetY, S)
    dot(frame, 19, 29 + offsetY, S)
    dot(frame, 20, 29 + offsetY, K)
    dot(frame, 17, 30 + offsetY, K)
    dot(frame, 18, 30 + offsetY, K)
    dot(frame, 19, 30 + offsetY, K)
    dot(frame, 20, 30 + offsetY, K)
  } else if (style === "curled") {
    // Legs curled up slightly (sleeping)
    dot(frame, 13, 26 + offsetY, K)
    dot(frame, 14, 26 + offsetY, K)
    dot(frame, 12, 27 + offsetY, K)
    dot(frame, 13, 27 + offsetY, S)
    dot(frame, 11, 28 + offsetY, K)
    dot(frame, 12, 28 + offsetY, S)
    dot(frame, 13, 28 + offsetY, K)
    dot(frame, 11, 29 + offsetY, K)
    dot(frame, 12, 29 + offsetY, K)
    dot(frame, 18, 26 + offsetY, K)
    dot(frame, 19, 26 + offsetY, K)
    dot(frame, 19, 27 + offsetY, K)
    dot(frame, 20, 27 + offsetY, S)
    dot(frame, 19, 28 + offsetY, K)
    dot(frame, 20, 28 + offsetY, S)
    dot(frame, 21, 28 + offsetY, K)
    dot(frame, 20, 29 + offsetY, K)
    dot(frame, 21, 29 + offsetY, K)
  } else if (style === "wobbly") {
    // Wobbly legs (sick) - slightly offset/uneven
    dot(frame, 12, 26 + offsetY, K)
    dot(frame, 13, 26 + offsetY, K)
    dot(frame, 12, 27 + offsetY, K)
    dot(frame, 13, 27 + offsetY, S)
    dot(frame, 12, 28 + offsetY, K)
    dot(frame, 13, 28 + offsetY, S)
    dot(frame, 11, 29 + offsetY, K)
    dot(frame, 12, 29 + offsetY, S)
    dot(frame, 13, 29 + offsetY, S)
    dot(frame, 14, 29 + offsetY, K)
    dot(frame, 11, 30 + offsetY, K)
    dot(frame, 12, 30 + offsetY, K)
    dot(frame, 13, 30 + offsetY, K)
    dot(frame, 14, 30 + offsetY, K)
    dot(frame, 19, 26 + offsetY, K)
    dot(frame, 20, 26 + offsetY, K)
    dot(frame, 19, 27 + offsetY, S)
    dot(frame, 20, 27 + offsetY, K)
    dot(frame, 19, 28 + offsetY, S)
    dot(frame, 20, 28 + offsetY, K)
    dot(frame, 18, 29 + offsetY, K)
    dot(frame, 19, 29 + offsetY, S)
    dot(frame, 20, 29 + offsetY, S)
    dot(frame, 21, 29 + offsetY, K)
    dot(frame, 18, 30 + offsetY, K)
    dot(frame, 19, 30 + offsetY, K)
    dot(frame, 20, 30 + offsetY, K)
    dot(frame, 21, 30 + offsetY, K)
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

/** Draw an onigiri held in right hand */
function drawOnigiri(frame: SpriteFrame, offsetY = 0) {
  // Nori (seaweed wrap) at bottom
  rect(frame, 23, 19 + offsetY, 4, 2, K)
  // White rice triangle
  dot(frame, 25, 15 + offsetY, W)
  dot(frame, 24, 16 + offsetY, W)
  dot(frame, 25, 16 + offsetY, W)
  dot(frame, 26, 16 + offsetY, W)
  dot(frame, 23, 17 + offsetY, W)
  dot(frame, 24, 17 + offsetY, W)
  dot(frame, 25, 17 + offsetY, W)
  dot(frame, 26, 17 + offsetY, W)
  dot(frame, 27, 17 + offsetY, W)
  dot(frame, 23, 18 + offsetY, W)
  dot(frame, 24, 18 + offsetY, W)
  dot(frame, 25, 18 + offsetY, W)
  dot(frame, 26, 18 + offsetY, W)
  dot(frame, 27, 18 + offsetY, W)
  // Outline
  dot(frame, 25, 14 + offsetY, K)
  dot(frame, 24, 15 + offsetY, K)
  dot(frame, 26, 15 + offsetY, K)
  dot(frame, 23, 16 + offsetY, K)
  dot(frame, 27, 16 + offsetY, K)
  dot(frame, 22, 17 + offsetY, K)
  dot(frame, 28, 17 + offsetY, K)
  dot(frame, 22, 18 + offsetY, K)
  dot(frame, 28, 18 + offsetY, K)
  dot(frame, 22, 19 + offsetY, K)
  dot(frame, 27, 19 + offsetY, K)
  dot(frame, 22, 20 + offsetY, K)
  dot(frame, 27, 20 + offsetY, K)
  dot(frame, 23, 21 + offsetY, K)
  dot(frame, 24, 21 + offsetY, K)
  dot(frame, 25, 21 + offsetY, K)
  dot(frame, 26, 21 + offsetY, K)
}

// Poop color
const P = "#8B4513" // brown

/** Draw a small poop on the frame */
export function drawPoop(frame: SpriteFrame, x: number, y: number) {
  // Top swirl
  dot(frame, x + 1, y, P)
  // Middle
  dot(frame, x, y + 1, P)
  dot(frame, x + 1, y + 1, P)
  dot(frame, x + 2, y + 1, P)
  // Bottom
  dot(frame, x, y + 2, P)
  dot(frame, x + 1, y + 2, P)
  dot(frame, x + 2, y + 2, P)
  // Outline bottom
  dot(frame, x - 1, y + 3, K)
  dot(frame, x, y + 3, P)
  dot(frame, x + 1, y + 3, P)
  dot(frame, x + 2, y + 3, P)
  dot(frame, x + 3, y + 3, K)
}

// --- Sprite generation for each state ---

function generateNormal(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawEyes(f1, 0)
  drawSmile(f1, 0)
  drawArms(f1, 0, "relaxed")

  drawLegs(f1, 0, "standing")
  drawOnigiri(f1, 0)

  const f2 = blank()
  drawBody(f2, -1)
  drawEyes(f2, -1)
  drawSmile(f2, -1)
  drawArms(f2, -1, "relaxed")

  drawLegs(f2, -1, "standing")
  drawOnigiri(f2, -1)

  return { frames: [f1, f2], frameDuration: 500 }
}

function generateProcessing(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1)
  drawThinkingEyes(f1)
  drawFlatMouth(f1)
  drawArms(f1, 0, "chin")

  drawLegs(f1, 0, "standing")

  const f2 = blank()
  drawBody(f2, -1)
  drawThinkingEyes(f2, -1)
  drawFlatMouth(f2, -1)
  drawArms(f2, -1, "chin")

  drawLegs(f2, -1, "standing")

  return { frames: [f1, f2], frameDuration: 400 }
}

function generateError(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawFrustratedEyes(f1, 0)
  drawGrittedMouth(f1, 0)
  drawArms(f1, 0, "droopy")

  drawLegs(f1, 0, "wobbly")

  const f2 = blank()
  drawBody(f2, 1)
  drawFrustratedEyes(f2, 1)
  drawGrittedMouth(f2, 1)
  drawArms(f2, 1, "droopy")

  drawLegs(f2, 1, "wobbly")

  return { frames: [f1, f2], frameDuration: 600 }
}

function generateResolved(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawHappyClosedEyes(f1, 0)
  drawGentleSmile(f1, 0)
  drawBlush(f1, 0)
  drawArms(f1, 0, "relaxed")
  drawLegs(f1, 0, "standing")
  drawSparkles(f1, false)

  const f2 = blank()
  drawBody(f2, -1)
  drawHappyClosedEyes(f2, -1)
  drawGentleSmile(f2, -1)
  drawBlush(f2, -1)
  drawArms(f2, -1, "relaxed")
  drawLegs(f2, -1, "standing")
  drawSparkles(f2, true)

  return { frames: [f1, f2], frameDuration: 500 }
}

function generateIdle(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 1)
  drawClosedEyes(f1, 1)
  // Tiny sleeping mouth
  dot(f1, 15, 20, M)
  dot(f1, 16, 20, M)
  dot(f1, 17, 20, M)
  drawArms(f1, 1, "tucked")

  drawLegs(f1, 1, "curled")
  drawZzz(f1)

  const f2 = blank()
  drawBody(f2, 1)
  drawClosedEyes(f2, 1)
  dot(f2, 15, 20, M)
  dot(f2, 16, 20, M)
  dot(f2, 17, 20, M)
  drawArms(f2, 1, "tucked")

  drawLegs(f2, 1, "curled")
  // No Zzz in frame 2 (blink effect)

  return { frames: [f1, f2], frameDuration: 800 }
}

// --- Tamagotchi expression sprites ---

function generateHungry(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawEyes(f1, 0)
  dot(f1, 15, 19, M)
  dot(f1, 16, 19, M)
  dot(f1, 17, 19, M)
  dot(f1, 15, 20, M)
  dot(f1, 16, 20, W)
  dot(f1, 17, 20, M)
  drawArms(f1, 0, "relaxed")
  drawPants(f1, 0)
  drawLegs(f1, 0, "standing")

  const f2 = blank()
  drawBody(f2, 0)
  drawEyes(f2, 0)
  drawFlatMouth(f2, 0)
  drawArms(f2, 0, "relaxed")
  drawPants(f2, 0)
  drawLegs(f2, 0, "standing")

  return { frames: [f1, f2], frameDuration: 400 }
}

function generateSad(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 1)
  drawClosedEyes(f1, 1)
  dot(f1, 14, 21, M)
  dot(f1, 15, 20, M)
  dot(f1, 16, 20, M)
  dot(f1, 17, 20, M)
  dot(f1, 18, 21, M)
  drawArms(f1, 1, "droopy")
  drawPants(f1, 1)
  drawLegs(f1, 1, "standing")

  const f2 = blank()
  drawBody(f2, 1)
  drawClosedEyes(f2, 1)
  dot(f2, 14, 21, M)
  dot(f2, 15, 20, M)
  dot(f2, 16, 20, M)
  dot(f2, 17, 20, M)
  dot(f2, 18, 21, M)
  drawArms(f2, 1, "droopy")
  drawPants(f2, 1)
  drawLegs(f2, 1, "standing")
  dot(f2, 10, 17, U)
  dot(f2, 22, 17, U)

  return { frames: [f1, f2], frameDuration: 700 }
}

function generateDirty(): SpriteAnimation {
  const f1 = blank()
  drawBody(f1, 0)
  drawFrustratedEyes(f1, 0)
  drawGrittedMouth(f1, 0)
  drawArms(f1, 0, "tucked")
  drawPants(f1, 0)
  drawLegs(f1, 0, "standing")
  dot(f1, 5, 10, U)
  dot(f1, 5, 11, U)

  const f2 = blank()
  drawBody(f2, -1)
  drawFrustratedEyes(f2, -1)
  drawGrittedMouth(f2, -1)
  drawArms(f2, -1, "tucked")
  drawPants(f2, -1)
  drawLegs(f2, -1, "standing")
  dot(f2, 27, 10, U)
  dot(f2, 27, 11, U)

  return { frames: [f1, f2], frameDuration: 500 }
}

// Pre-generate all sprites
const sprites: Record<CharacterState, SpriteAnimation> = {
  normal: generateNormal(),
  processing: generateProcessing(),
  error: generateError(),
  resolved: generateResolved(),
  idle: generateIdle(),
}

const expressionSprites: Record<TamagotchiExpression, SpriteAnimation> = {
  happy: sprites.normal,
  hungry: generateHungry(),
  sad: generateSad(),
  dirty: generateDirty(),
  drowsy: sprites.idle,
  sick: sprites.error,
  sleeping: sprites.idle,
}

/** Get the sprite animation for a given state or expression */
export function getSprite(
  state: CharacterState | TamagotchiExpression,
): SpriteAnimation {
  if (state in sprites) return sprites[state as CharacterState]
  return expressionSprites[state as TamagotchiExpression]
}
