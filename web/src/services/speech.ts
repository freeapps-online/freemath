import { detectSideCommand, getStrings, normalizeTranscript, type AnswerSide, type SupportedLanguage } from './i18n.ts'
import type { MathProblem } from '../types.ts'

const SMALL_NUMBER_MAP: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
}

const TENS_MAP: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

function wordsToNumber(text: string): number | null {
  const normalized = text
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')

  const digitMatch = normalized.match(/\d+/)
  if (digitMatch) return Number(digitMatch[0])

  const tokens = normalized
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => !['answer', 'equals', 'equal', 'is', 'the', 'a', 'an', 'and'].includes(token))

  if (tokens.length === 0) return null

  let total = 0
  let current = 0
  let matched = false

  for (const token of tokens) {
    if (token in SMALL_NUMBER_MAP) {
      current += SMALL_NUMBER_MAP[token]
      matched = true
      continue
    }

    if (token in TENS_MAP) {
      current += TENS_MAP[token]
      matched = true
      continue
    }

    if (token === 'hundred') {
      current = (current || 1) * 100
      matched = true
      continue
    }

    if (token === 'thousand') {
      total += (current || 1) * 1000
      current = 0
      matched = true
      continue
    }

    return null
  }

  return matched ? total + current : null
}

function normalizeLocaleDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, char => String(char.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, char => String(char.charCodeAt(0) - 0x06F0))
    .replace(/[०-९]/g, char => String(char.charCodeAt(0) - 0x0966))
}

export function problemToSpeech(problem: MathProblem, language: SupportedLanguage): string {
  if (problem.speech) return problem.speech
  const strings = getStrings(language)
  return `${problem.a} ${strings.opWords[problem.op]} ${problem.b}`
}

export function spokenTextToIntent(text: string, language: SupportedLanguage): { side: AnswerSide | null; number: number | null } {
  const side = detectSideCommand(text, language)
  const normalized = normalizeLocaleDigits(normalizeTranscript(text))
  const digitMatch = normalized.match(/\d+/)
  if (digitMatch) {
    return { side, number: Number(digitMatch[0]) }
  }

  if (language === 'en-US') {
    return { side, number: wordsToNumber(normalized) }
  }

  return { side, number: null }
}

export function speakProblem(problem: MathProblem, language: SupportedLanguage, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(problemToSpeech(problem, language))
  utterance.rate = 0.92
  utterance.pitch = 1
  utterance.lang = language
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
}
