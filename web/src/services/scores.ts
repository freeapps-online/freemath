import type { Score } from '../types.ts'

const SCORES_KEY = 'freemath-scores'
const PROBLEM_STATS_KEY = 'freemath-problem-stats'

const DEFAULT_SCORE: Score = { correct: 0, total: 0, streak: 0, bestStreak: 0 }

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export function normalizeScore(value: unknown): Score {
  if (!value || typeof value !== 'object') return DEFAULT_SCORE
  const raw = value as Partial<Score>
  const correct = isNonNegativeInteger(raw.correct) ? raw.correct : 0
  const total = isNonNegativeInteger(raw.total) ? raw.total : 0
  const streak = isNonNegativeInteger(raw.streak) ? raw.streak : 0
  const bestStreak = isNonNegativeInteger(raw.bestStreak) ? raw.bestStreak : 0

  return {
    correct: Math.min(correct, total),
    total,
    streak,
    bestStreak: Math.max(bestStreak, streak),
  }
}

function normalizeProblemStat(value: unknown): ProblemStat | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<ProblemStat>
  return {
    correct: isNonNegativeInteger(raw.correct) ? raw.correct : 0,
    wrong: isNonNegativeInteger(raw.wrong) ? raw.wrong : 0,
    lastSeen: isNonNegativeInteger(raw.lastSeen) ? raw.lastSeen : 0,
  }
}

export function normalizeProblemStats(value: unknown): ProblemStatsMap {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, stat]) => [key, normalizeProblemStat(stat)] as const)
      .filter((entry): entry is [string, ProblemStat] => entry[1] !== null),
  )
}

export function loadScores(): Score {
  try {
    const raw = localStorage.getItem(SCORES_KEY)
    if (raw) return normalizeScore(JSON.parse(raw))
  } catch { /* ignore */ }
  return DEFAULT_SCORE
}

function saveScores(scores: Score) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores))
}

export function recordAnswer(scores: Score, correct: boolean): Score {
  const streak = correct ? scores.streak + 1 : 0
  const bestStreak = Math.max(scores.bestStreak, streak)
  const next = {
    correct: scores.correct + (correct ? 1 : 0),
    total: scores.total + 1,
    streak,
    bestStreak,
  }
  saveScores(next)
  return next
}

// --- Per-problem-type stats ---

export interface ProblemStat {
  correct: number
  wrong: number
  lastSeen: number
}

export type ProblemStatsMap = Record<string, ProblemStat>

export function loadProblemStats(): ProblemStatsMap {
  try {
    const raw = localStorage.getItem(PROBLEM_STATS_KEY)
    if (raw) return normalizeProblemStats(JSON.parse(raw))
  } catch { /* ignore */ }
  return {}
}

function saveProblemStats(stats: ProblemStatsMap) {
  localStorage.setItem(PROBLEM_STATS_KEY, JSON.stringify(stats))
}

export function recordProblemAnswer(stats: ProblemStatsMap, key: string, correct: boolean): ProblemStatsMap {
  const prev = stats[key] ?? { correct: 0, wrong: 0, lastSeen: 0 }
  const next = {
    ...stats,
    [key]: {
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      lastSeen: Date.now(),
    },
  }
  saveProblemStats(next)
  return next
}

export function pickWeighted<T extends { id: string }>(
  pool: T[],
  stats: ProblemStatsMap,
  exclude?: T,
): T {
  const filtered = exclude ? pool.filter(p => p.id !== exclude.id) : pool
  if (filtered.length === 0) return pool[0]

  const now = Date.now()
  const weights = filtered.map((item) => {
    const s = stats[item.id]
    if (!s) return 3

    const total = s.correct + s.wrong
    const errorRate = total > 0 ? s.wrong / total : 0.5
    const hoursSince = (now - s.lastSeen) / (1000 * 60 * 60)
    const timeFactor = Math.min(hoursSince / 24, 2)

    return 1 + errorRate * 3 + timeFactor + (total < 3 ? 1 : 0)
  })

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * totalWeight
  for (let i = 0; i < filtered.length; i++) {
    r -= weights[i]
    if (r <= 0) return filtered[i]
  }
  return filtered[filtered.length - 1]
}
