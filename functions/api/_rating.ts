export function pointsForLevel(level: number): number {
  if (level <= 5) return 10 + level * 2
  if (level <= 10) return 22 + (level - 6) * 4
  if (level <= 15) return 45 + (level - 11) * 7
  if (level <= 20) return 85 + (level - 16) * 9
  if (level <= 25) return 135 + (level - 21) * 11
  if (level <= 29) return 210 + (level - 26) * 16
  if (level <= 33) return 285 + (level - 30) * 18
  if (level <= 35) return 365 + (level - 34) * 22
  if (level <= 39) return 420 + (level - 36) * 28
  return 560
}

export function targetRatingForLevel(level: number): number {
  if (level <= 5) return 320 + level * 28
  if (level <= 10) return 470 + (level - 6) * 34
  if (level <= 15) return 640 + (level - 11) * 36
  if (level <= 20) return 840 + (level - 16) * 38
  if (level <= 25) return 1060 + (level - 21) * 42
  if (level <= 29) return 1310 + (level - 26) * 48
  if (level <= 33) return 1510 + (level - 30) * 52
  if (level <= 35) return 1730 + (level - 34) * 58
  if (level <= 39) return 1880 + (level - 36) * 64
  return 2140
}

export function nextMathRating(params: {
  currentRating: number
  totalAnswers: number
  level: number
  correct: boolean
}): number {
  const target = targetRatingForLevel(params.level)
  const expected = 1 / (1 + 10 ** ((target - params.currentRating) / 400))
  const k = Math.max(10, 34 - Math.min(params.totalAnswers, 140) * 0.12)
  const outcome = params.correct ? 1 : 0
  const difficultyTilt = params.correct
    ? Math.max(2, params.level * 0.45)
    : -Math.max(6, params.level * 0.3)

  const next = Math.round(params.currentRating + k * (outcome - expected) + difficultyTilt)
  return Math.min(Math.max(next, 300), 2600)
}

