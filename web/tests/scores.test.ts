import { describe, expect, it } from 'vitest'
import { normalizeProblemStats, normalizeScore } from '../src/services/scores.ts'

describe('normalizeScore', () => {
  it('caps correct answers to total and preserves best streak', () => {
    expect(normalizeScore({
      correct: 9,
      total: 4,
      streak: 3,
      bestStreak: 1,
    })).toEqual({
      correct: 4,
      total: 4,
      streak: 3,
      bestStreak: 3,
    })
  })

  it('drops malformed values', () => {
    expect(normalizeScore({
      correct: -1,
      total: '4',
      streak: 2.4,
      bestStreak: null,
    })).toEqual({
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
    })
  })
})

describe('normalizeProblemStats', () => {
  it('keeps valid per-problem stats and drops invalid entries', () => {
    expect(normalizeProblemStats({
      '1+1': { correct: 2, wrong: 1, lastSeen: 123 },
      broken: 'nope',
    })).toEqual({
      '1+1': { correct: 2, wrong: 1, lastSeen: 123 },
    })
  })
})

