import { describe, expect, it } from 'vitest'
import { normalizeSettings } from '../src/services/settings.ts'

describe('normalizeSettings', () => {
  it('falls back for invalid values', () => {
    expect(normalizeSettings(null)).toMatchObject({
      language: 'system',
      theme: 'dark',
      level: 1,
    })
  })

  it('keeps valid values and clamps level to the max', () => {
    expect(normalizeSettings({
      language: 'es-ES',
      theme: 'light',
      labelSize: 'large',
      contentSize: 'xlarge',
      motion: 'reduced',
      surface: 'bold',
      audio: 'muted',
      microphone: 'on',
      level: 999,
    })).toEqual({
      language: 'es-ES',
      theme: 'light',
      labelSize: 'large',
      contentSize: 'xlarge',
      motion: 'reduced',
      surface: 'bold',
      audio: 'muted',
      microphone: 'on',
      level: 40,
    })
  })
})
