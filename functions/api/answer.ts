import {
  clampInteger,
  cleanDeviceId,
  cleanDisplayName,
  cleanLanguage,
  cleanProblemId,
  fetchUser,
  json,
  options,
  requireDb,
  upsertUser,
} from './_lib'
import { nextMathRating, pointsForLevel } from './_rating'

export const onRequestOptions = () => options()

export const onRequestPost: PagesFunction = async ({ env, request }) => {
  const db = requireDb(env)
  if (db instanceof Response) return db

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const deviceId = cleanDeviceId(body?.deviceId)
  const problemId = cleanProblemId(body?.problemId)
  const level = clampInteger(body?.level, 1, 40)
  const correct = body?.correct === true

  if (!deviceId || !problemId) return json({ error: 'deviceId and problemId required' }, 400)

  await upsertUser(db, {
    deviceId,
    displayName: cleanDisplayName(body?.displayName),
    language: cleanLanguage(body?.language),
  })

  const currentUser = await fetchUser(db, deviceId)
  if (!currentUser) return json({ error: 'user not found after upsert' }, 500)

  await db.prepare(`
    INSERT INTO problem_stats (user_id, problem_id, level, correct_count, wrong_count, last_seen)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, problem_id) DO UPDATE SET
      level = excluded.level,
      correct_count = correct_count + ?,
      wrong_count = wrong_count + ?,
      last_seen = datetime('now')
  `).bind(
    deviceId,
    problemId,
    level,
    correct ? 1 : 0,
    correct ? 0 : 1,
    correct ? 1 : 0,
    correct ? 0 : 1,
  ).run()

  const nextRating = nextMathRating({
    currentRating: currentUser.math_rating ?? 400,
    totalAnswers: currentUser.total_answers ?? 0,
    level,
    correct,
  })

  if (correct) {
    const gain = pointsForLevel(level)
    await db.prepare(`
      UPDATE users SET
        total_score = total_score + ?,
        math_rating = ?,
        total_answers = total_answers + 1,
        correct_answers = correct_answers + 1,
        streak = streak + 1,
        best_streak = MAX(best_streak, streak + 1),
        highest_level = MAX(highest_level, ?),
        active_days = active_days + CASE WHEN last_practiced_on IS NULL OR last_practiced_on <> date('now') THEN 1 ELSE 0 END,
        last_practiced_on = date('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(gain, nextRating, level, deviceId).run()
  } else {
    await db.prepare(`
      UPDATE users SET
        math_rating = ?,
        total_answers = total_answers + 1,
        streak = 0,
        highest_level = MAX(highest_level, ?),
        active_days = active_days + CASE WHEN last_practiced_on IS NULL OR last_practiced_on <> date('now') THEN 1 ELSE 0 END,
        last_practiced_on = date('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(nextRating, level, deviceId).run()
  }

  const user = await fetchUser(db, deviceId)
  return json({ user })
}
