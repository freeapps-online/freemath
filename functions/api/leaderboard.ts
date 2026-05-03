import { accuracyExpression, activityRateExpression, json, options, requireDb } from './_lib'

const SORT_COLUMNS = {
  level: 'math_rating DESC, total_score DESC, best_streak DESC',
  score: 'total_score DESC, best_streak DESC, correct_answers DESC',
  streak: 'best_streak DESC, total_score DESC, correct_answers DESC',
  accuracy: `${accuracyExpression()} DESC, math_rating DESC, total_answers DESC`,
} as const

export const onRequestOptions = () => options()

export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const db = requireDb(env)
  if (db instanceof Response) return db

  const url = new URL(request.url)
  const requestedSort = url.searchParams.get('sort')
  const sort = requestedSort === 'level'
    ? 'level'
    : requestedSort === 'streak'
    ? 'streak'
    : requestedSort === 'accuracy'
      ? 'accuracy'
      : 'score'
  const rawLimit = Number.parseInt(url.searchParams.get('limit') ?? '25', 10)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 25

  const { results } = await db.prepare(`
    SELECT
      id,
      display_name,
      language,
      total_score,
      math_rating,
      total_answers,
      correct_answers,
      streak,
      best_streak,
      highest_level,
      active_days,
      last_practiced_on,
      created_at,
      updated_at,
      ${accuracyExpression()} AS accuracy,
      ${activityRateExpression()} AS activity_rate
    FROM users
    WHERE total_answers > 0
    ORDER BY ${SORT_COLUMNS[sort]}
    LIMIT ?
  `).bind(limit).all()

  return json({
    entries: (results ?? []).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })),
  })
}
