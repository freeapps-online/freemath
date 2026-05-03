interface Env {
  DB?: D1Database
}

export interface ApiContext {
  env: Env
  request: Request
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

export function options() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export function requireDb(env: Env): D1Database | Response {
  if (!env.DB) {
    return json({ error: 'Leaderboard database is not configured' }, 503)
  }
  return env.DB
}

export function clampInteger(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return min
  return Math.min(Math.max(value, min), max)
}

export function cleanDisplayName(value: unknown): string {
  if (typeof value !== 'string') return 'Math Player'
  const trimmed = value.trim().replace(/\s+/g, ' ').slice(0, 32)
  return trimmed || 'Math Player'
}

export function cleanLanguage(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 16) : 'en-US'
}

export function cleanDeviceId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 64) : null
}

export function cleanProblemId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 64) : null
}

export function accuracyExpression() {
  return `CASE
    WHEN total_answers > 0 THEN ROUND((correct_answers * 100.0) / total_answers, 1)
    ELSE 0
  END`
}

export function activityRateExpression() {
  return `CASE
    WHEN julianday(date('now')) - julianday(date(created_at)) + 1 > 0
      THEN ROUND((active_days * 100.0) / (julianday(date('now')) - julianday(date(created_at)) + 1), 1)
    ELSE 0
  END`
}

export async function upsertUser(db: D1Database, params: { deviceId: string; displayName: string; language: string }) {
  await db.prepare(`
    INSERT INTO users (id, display_name, language)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      display_name = excluded.display_name,
      language = excluded.language,
      updated_at = datetime('now')
  `).bind(params.deviceId, params.displayName, params.language).run()
}

export async function fetchUser(db: D1Database, deviceId: string) {
  return await db.prepare(`
    SELECT id, display_name, language, total_score, math_rating, total_answers, correct_answers, streak, best_streak, highest_level, active_days, last_practiced_on, created_at, updated_at
    FROM users
    WHERE id = ?
  `).bind(deviceId).first()
}
