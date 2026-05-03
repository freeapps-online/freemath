import { describe, expect, it } from 'vitest'
import { activityRate, getMathTitle } from '../src/services/rating.ts'

describe('rating helpers', () => {
  it('maps ratings to math titles', () => {
    expect(getMathTitle(400)).toBe('Beginner')
    expect(getMathTitle(760)).toBe('Rising Solver')
    expect(getMathTitle(1600)).toBe('Math Master')
  })

  it('computes a sensible activity rate', () => {
    const createdAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    expect(activityRate(3, createdAt)).toBeGreaterThanOrEqual(50)
    expect(activityRate(3, createdAt)).toBeLessThanOrEqual(100)
  })
})

