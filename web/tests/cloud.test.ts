import { describe, expect, it } from 'vitest'
import { makeDefaultDisplayName } from '../src/services/cloud.ts'

describe('makeDefaultDisplayName', () => {
  it('is deterministic for a given device id', () => {
    expect(makeDefaultDisplayName('device-123')).toBe(makeDefaultDisplayName('device-123'))
  })

  it('produces a readable fallback name', () => {
    expect(makeDefaultDisplayName('device-abc')).toMatch(/^[A-Za-z]+ [A-Za-z]+ \d{3}$/)
  })
})

