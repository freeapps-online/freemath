import { describe, expect, it } from 'vitest'
import { problemToSpeech, spokenTextToIntent } from '../src/services/speech.ts'

describe('spokenTextToIntent', () => {
  it('parses english number words', () => {
    expect(spokenTextToIntent('twenty one', 'en-US')).toEqual({
      side: null,
      number: 21,
    })
  })

  it('parses localized digits and side commands', () => {
    expect(spokenTextToIntent('الجواب ١٢', 'en-US')).toEqual({
      side: null,
      number: 12,
    })
    expect(spokenTextToIntent('izquierda', 'es-ES')).toEqual({
      side: 'left',
      number: null,
    })
  })
})

describe('problemToSpeech', () => {
  it('uses the locale operator word', () => {
    expect(problemToSpeech({
      id: '10+10',
      a: 10,
      b: 10,
      op: '+',
      answer: 20,
      display: '10 + 10',
    }, 'en-US')).toBe('10 plus 10')
  })
})

