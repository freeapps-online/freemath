import type { SupportedLanguage } from './i18n.ts'

const DEVICE_ID_KEY = 'freemath-device-id'
const DISPLAY_NAME_KEY = 'freemath-display-name'
const API_BASE = '/api'

const NAME_PREFIXES = ['Swift', 'Bright', 'Quick', 'Clever', 'Bold', 'Sunny', 'Brave', 'Happy']
const NAME_ANIMALS = ['Fox', 'Panda', 'Tiger', 'Otter', 'Falcon', 'Koala', 'Whale', 'Lion']

export type LeaderboardSort = 'level' | 'score' | 'streak' | 'accuracy'

export interface CloudPlayer {
  id: string
  displayName: string
  language: string
  totalScore: number
  mathRating: number
  totalAnswers: number
  correctAnswers: number
  streak: number
  bestStreak: number
  highestLevel: number
  activeDays: number
  lastPracticedOn: string | null
  createdAt: string
  updatedAt: string
}

export interface CloudProblemStat {
  problemId: string
  level: number
  correctCount: number
  wrongCount: number
  lastSeen: string
}

export interface CloudLeaderboardEntry extends CloudPlayer {
  accuracy: number
  activityRate: number
  rank: number
}

export interface CloudMyStats {
  user: CloudPlayer
  rank: number | null
  leaderboardSize: number
  problemStats: CloudProblemStat[]
}

interface PlayerResponse {
  user: RawPlayer
}

interface LeaderboardResponse {
  entries: RawLeaderboardEntry[]
}

interface MyStatsResponse {
  user: RawPlayer
  rank: number | null
  leaderboardSize: number
  problemStats: RawProblemStat[]
}

interface RawPlayer {
  id: string
  display_name: string
  language: string
  total_score: number
  math_rating: number
  total_answers: number
  correct_answers: number
  streak: number
  best_streak: number
  highest_level: number
  active_days: number
  last_practiced_on: string | null
  created_at: string
  updated_at: string
}

interface RawProblemStat {
  problem_id: string
  level: number
  correct_count: number
  wrong_count: number
  last_seen: string
}

interface RawLeaderboardEntry extends RawPlayer {
  accuracy: number
  activity_rate: number
  rank: number
}

function mapPlayer(raw: RawPlayer): CloudPlayer {
  return {
    id: raw.id,
    displayName: raw.display_name,
    language: raw.language,
    totalScore: raw.total_score,
    mathRating: raw.math_rating,
    totalAnswers: raw.total_answers,
    correctAnswers: raw.correct_answers,
    streak: raw.streak,
    bestStreak: raw.best_streak,
    highestLevel: raw.highest_level,
    activeDays: raw.active_days,
    lastPracticedOn: raw.last_practiced_on,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function mapProblemStat(raw: RawProblemStat): CloudProblemStat {
  return {
    problemId: raw.problem_id,
    level: raw.level,
    correctCount: raw.correct_count,
    wrongCount: raw.wrong_count,
    lastSeen: raw.last_seen,
  }
}

function mapLeaderboardEntry(raw: RawLeaderboardEntry): CloudLeaderboardEntry {
  return {
    ...mapPlayer(raw),
    accuracy: raw.accuracy,
    activityRate: raw.activity_rate,
    rank: raw.rank,
  }
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

function hashDeviceId(id: string): number {
  return Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function makeDefaultDisplayName(deviceId = getDeviceId()): string {
  const seed = hashDeviceId(deviceId)
  const prefix = NAME_PREFIXES[seed % NAME_PREFIXES.length]
  const animal = NAME_ANIMALS[Math.floor(seed / NAME_PREFIXES.length) % NAME_ANIMALS.length]
  const suffix = String(100 + (seed % 900))
  return `${prefix} ${animal} ${suffix}`
}

export function getStoredDisplayName(): string {
  const stored = localStorage.getItem(DISPLAY_NAME_KEY)?.trim()
  if (stored) return stored
  const fallback = makeDefaultDisplayName()
  localStorage.setItem(DISPLAY_NAME_KEY, fallback)
  return fallback
}

export function setStoredDisplayName(displayName: string): string {
  const trimmed = displayName.trim().slice(0, 32)
  const next = trimmed || makeDefaultDisplayName()
  localStorage.setItem(DISPLAY_NAME_KEY, next)
  return next
}

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    })
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

export async function registerPlayer(displayName = getStoredDisplayName(), language: SupportedLanguage): Promise<CloudPlayer | null> {
  const payload = {
    deviceId: getDeviceId(),
    displayName: setStoredDisplayName(displayName),
    language,
  }
  const res = await request<PlayerResponse>('/player', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res ? mapPlayer(res.user) : null
}

export async function reportAnswer(params: {
  displayName?: string
  language: SupportedLanguage
  level: number
  problemId: string
  correct: boolean
}): Promise<CloudPlayer | null> {
  const res = await request<PlayerResponse>('/answer', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: getDeviceId(),
      displayName: setStoredDisplayName(params.displayName ?? getStoredDisplayName()),
      language: params.language,
      level: params.level,
      problemId: params.problemId,
      correct: params.correct,
    }),
  })
  return res ? mapPlayer(res.user) : null
}

export async function fetchLeaderboard(sort: LeaderboardSort = 'level', limit = 25): Promise<CloudLeaderboardEntry[] | null> {
  const query = new URLSearchParams({
    sort,
    limit: String(limit),
  })
  const res = await request<LeaderboardResponse>(`/leaderboard?${query.toString()}`)
  return res ? res.entries.map(mapLeaderboardEntry) : null
}

export async function fetchMyStats(): Promise<CloudMyStats | null> {
  const query = new URLSearchParams({
    deviceId: getDeviceId(),
  })
  const res = await request<MyStatsResponse>(`/me?${query.toString()}`)
  return res
    ? {
        user: mapPlayer(res.user),
        rank: res.rank,
        leaderboardSize: res.leaderboardSize,
        problemStats: res.problemStats.map(mapProblemStat),
      }
    : null
}
