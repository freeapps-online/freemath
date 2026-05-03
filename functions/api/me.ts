import { cleanDeviceId, fetchUser, json, options, requireDb } from './_lib'

export const onRequestOptions = () => options()

export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const db = requireDb(env)
  if (db instanceof Response) return db

  const url = new URL(request.url)
  const deviceId = cleanDeviceId(url.searchParams.get('deviceId'))
  if (!deviceId) return json({ error: 'deviceId required' }, 400)

  const user = await fetchUser(db, deviceId)
  if (!user) return json({ error: 'not found' }, 404)

  const { results: problemStats } = await db.prepare(`
    SELECT problem_id, level, correct_count, wrong_count, last_seen
    FROM problem_stats
    WHERE user_id = ?
    ORDER BY last_seen DESC
    LIMIT 50
  `).bind(deviceId).all()

  const rankResult = await db.prepare(`
    SELECT COUNT(*) + 1 AS rank
    FROM users
    WHERE total_answers > 0
      AND (
        math_rating > (SELECT math_rating FROM users WHERE id = ?)
        OR (
          math_rating = (SELECT math_rating FROM users WHERE id = ?)
          AND total_score > (SELECT total_score FROM users WHERE id = ?)
        )
        OR (
          math_rating = (SELECT math_rating FROM users WHERE id = ?)
          AND total_score = (SELECT total_score FROM users WHERE id = ?)
          AND best_streak > (SELECT best_streak FROM users WHERE id = ?)
        )
      )
  `).bind(deviceId, deviceId, deviceId, deviceId, deviceId, deviceId).first<{ rank: number }>()

  const sizeResult = await db.prepare(`
    SELECT COUNT(*) AS total
    FROM users
    WHERE total_answers > 0
  `).first<{ total: number }>()

  return json({
    user,
    rank: user.total_answers > 0 ? rankResult?.rank ?? null : null,
    leaderboardSize: sizeResult?.total ?? 0,
    problemStats: resultsOrEmpty(problemStats),
  })
}

function resultsOrEmpty<T>(value: T[] | undefined) {
  return value ?? []
}
