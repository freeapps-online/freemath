import { cleanDeviceId, cleanDisplayName, cleanLanguage, fetchUser, json, options, requireDb, upsertUser } from './_lib'

export const onRequestOptions = () => options()

export const onRequestPost: PagesFunction = async ({ env, request }) => {
  const db = requireDb(env)
  if (db instanceof Response) return db

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const deviceId = cleanDeviceId(body?.deviceId)
  if (!deviceId) return json({ error: 'deviceId required' }, 400)

  await upsertUser(db, {
    deviceId,
    displayName: cleanDisplayName(body?.displayName),
    language: cleanLanguage(body?.language),
  })

  const user = await fetchUser(db, deviceId)
  return json({ user })
}

