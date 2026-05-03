import { SUPPORTED_LANGUAGES, type LanguagePreference } from './i18n.ts'
import { maxLevel } from './problems.ts'

const STORAGE_KEY = 'freemath-settings'

export type ThemePreference = 'system' | 'light' | 'dark'
export type FontSizePreference = 'small' | 'medium' | 'large' | 'xlarge'
export type MotionPreference = 'full' | 'reduced'
export type SurfacePreference = 'soft' | 'bold'
export type AudioPreference = 'on' | 'muted'
export type MicrophonePreference = 'off' | 'on'

export interface Settings {
  language: LanguagePreference
  theme: ThemePreference
  labelSize: FontSizePreference
  contentSize: FontSizePreference
  motion: MotionPreference
  surface: SurfacePreference
  audio: AudioPreference
  microphone: MicrophonePreference
  level: number
}

const defaults: Settings = {
  language: 'system',
  theme: 'dark',
  labelSize: 'medium',
  contentSize: 'medium',
  motion: 'full',
  surface: 'soft',
  audio: 'on',
  microphone: 'off',
  level: 1,
}

const themeValues = new Set<ThemePreference>(['system', 'light', 'dark'])
const sizeValues = new Set<FontSizePreference>(['small', 'medium', 'large', 'xlarge'])
const motionValues = new Set<MotionPreference>(['full', 'reduced'])
const surfaceValues = new Set<SurfacePreference>(['soft', 'bold'])
const audioValues = new Set<AudioPreference>(['on', 'muted'])
const microphoneValues = new Set<MicrophonePreference>(['off', 'on'])
function coerceEnum<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  return typeof value === 'string' && allowed.has(value as T) ? value as T : fallback
}

function normalizeLanguage(value: unknown): LanguagePreference {
  if (typeof value !== 'string') return defaults.language
  if (value === 'system') return value
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value) ? value as LanguagePreference : defaults.language
}

function normalizeLevel(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return defaults.level
  return Math.min(Math.max(value, 1), maxLevel())
}

export function normalizeSettings(value: unknown): Settings {
  const raw = value && typeof value === 'object' ? value as Partial<Settings> : {}

  return {
    language: normalizeLanguage(raw.language),
    theme: coerceEnum(raw.theme, themeValues, defaults.theme),
    labelSize: coerceEnum(raw.labelSize, sizeValues, defaults.labelSize),
    contentSize: coerceEnum(raw.contentSize, sizeValues, defaults.contentSize),
    motion: coerceEnum(raw.motion, motionValues, defaults.motion),
    surface: coerceEnum(raw.surface, surfaceValues, defaults.surface),
    audio: coerceEnum(raw.audio, audioValues, defaults.audio),
    microphone: coerceEnum(raw.microphone, microphoneValues, defaults.microphone),
    level: normalizeLevel(raw.level),
  }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeSettings(JSON.parse(raw))
  } catch { /* ignore */ }
  return defaults
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
