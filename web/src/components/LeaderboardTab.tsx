import { useCallback, useEffect, useState } from 'react'
import { fetchLeaderboard, fetchMyStats, getStoredDisplayName, registerPlayer, setStoredDisplayName, type CloudLeaderboardEntry, type CloudMyStats, type LeaderboardSort } from '../services/cloud.ts'
import { getStrings, type SupportedLanguage } from '../services/i18n.ts'
import { activityRate, formatStartedDate, getMathTitle } from '../services/rating.ts'
import { loadScores } from '../services/scores.ts'

interface Props {
  language: SupportedLanguage
}

export function LeaderboardTab({ language }: Props) {
  const strings = getStrings(language)
  const copy = strings.leaderboard ?? getStrings('en-US').leaderboard!
  const [displayName, setDisplayName] = useState(getStoredDisplayName)
  const [savedName, setSavedName] = useState(getStoredDisplayName)
  const [sort, setSort] = useState<LeaderboardSort>('level')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [leaderboard, setLeaderboard] = useState<CloudLeaderboardEntry[]>([])
  const [myStats, setMyStats] = useState<CloudMyStats | null>(null)
  const [cloudOffline, setCloudOffline] = useState(false)
  const localScores = loadScores()

  const readCloud = useCallback(async (nextSort: LeaderboardSort) => {
    const snapshot = await Promise.all([
      fetchMyStats(),
      fetchLeaderboard(nextSort, 25),
    ])

    const [me, board] = snapshot
    const needsRetry = localScores.total > 0 && (
      !me ||
      me.user.totalAnswers === 0 ||
      (me.user.totalAnswers > 0 && (board?.length ?? 0) === 0)
    )

    if (!needsRetry) return snapshot

    await new Promise(resolve => window.setTimeout(resolve, 1200))
    return await Promise.all([
      fetchMyStats(),
      fetchLeaderboard(nextSort, 25),
    ])
  }, [localScores.total])

  const refresh = useCallback(async (nextSort: LeaderboardSort, nextName = savedName) => {
    setLoading(true)
    const trimmedName = setStoredDisplayName(nextName)
    const registered = await registerPlayer(trimmedName, language)
    const [me, board] = await readCloud(nextSort)

    setSavedName(trimmedName)
    setDisplayName(trimmedName)
    setMyStats(me ?? (registered ? {
      user: registered,
      rank: null,
      leaderboardSize: 0,
      problemStats: [],
    } : null))
    setLeaderboard(board ?? [])
    setCloudOffline(!registered && !me && !board)
    setLoading(false)
  }, [language, readCloud, savedName])

  useEffect(() => {
    void refresh(sort)
  }, [sort, refresh])

  const saveName = useCallback(async () => {
    setSaving(true)
    await refresh(sort, displayName)
    setSaving(false)
  }, [displayName, refresh, sort])

  const accuracy = myStats?.user.totalAnswers
    ? Math.round((myStats.user.correctAnswers / myStats.user.totalAnswers) * 100)
    : 0
  const started = myStats ? formatStartedDate(myStats.user.createdAt) : '-'
  const practiceRate = myStats ? activityRate(myStats.user.activeDays, myStats.user.createdAt) : 0

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 p-1">
      <section className="rounded-[1.8rem] border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(130,219,255,0.12),rgba(113,239,198,0.12))] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--accent-deep)]">{copy.title}</div>
            <h2 className="display-font text-3xl font-bold text-[var(--ink)] sm:text-4xl">{copy.subtitle}</h2>
            <p className="max-w-2xl text-sm text-[var(--muted)]">{copy.syncNote}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SortButton active={sort === 'level'} onClick={() => setSort('level')}>{copy.levelSort}</SortButton>
            <SortButton active={sort === 'score'} onClick={() => setSort('score')}>{copy.score}</SortButton>
            <SortButton active={sort === 'streak'} onClick={() => setSort('streak')}>{copy.streak}</SortButton>
            <SortButton active={sort === 'accuracy'} onClick={() => setSort('accuracy')}>{copy.accuracySort}</SortButton>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="space-y-5">
          <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--glass-soft)] p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{copy.profile}</div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--ink)]">{copy.displayName}</span>
              <input
                className="w-full rounded-[1rem] border border-[var(--line)] bg-[var(--glass)] px-4 py-3 text-base font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--line-strong)]"
                maxLength={32}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <button
              className="mt-3 w-full rounded-[1rem] bg-[var(--ink)] px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--paper)] shadow-[var(--shadow-card)] transition hover:opacity-90 disabled:opacity-60"
              disabled={saving}
              onClick={() => void saveName()}
            >
              {saving ? copy.loading : copy.saveName}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label={strings.stats.correct} value={localScores.correct} tone="success" />
            <StatCard label={strings.stats.total} value={localScores.total} tone="sky" />
            <StatCard label={strings.stats.bestStreak} value={localScores.bestStreak} tone="warning" />
            <StatCard label={copy.globalScore} value={myStats?.user.totalScore ?? 0} tone="accent" />
            <StatCard label={copy.yourRank} value={myStats?.rank ? `#${myStats.rank}` : copy.notRanked} tone="ink" />
            <StatCard label={copy.mathLevel} value={myStats ? getMathTitle(myStats.user.mathRating) : '-'} tone="sky" />
            <StatCard label={copy.rating} value={myStats?.user.mathRating ?? 400} tone="accent" />
            <StatCard label={copy.highestLevel} value={myStats?.user.highestLevel ?? 1} tone="sky" />
            <StatCard label={copy.accuracy} value={`${accuracy}%`} tone="success" />
            <StatCard label={copy.totalAnswers} value={myStats?.user.totalAnswers ?? 0} tone="warning" />
            <StatCard label={copy.started} value={started} tone="ink" />
            <StatCard label={copy.practiceDays} value={myStats?.user.activeDays ?? 0} tone="warning" />
            <StatCard label={copy.activityRate} value={`${practiceRate}%`} tone="success" />
          </div>

          {cloudOffline && (
            <div className="rounded-[1.2rem] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm font-semibold text-[var(--ink)]">
              {copy.offline}
            </div>
          )}
        </section>

        <section className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--glass-soft)] p-4 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{copy.topPlayers}</div>
              <div className="text-sm text-[var(--muted)]">{savedName}</div>
            </div>
            {loading && <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{copy.loading}</div>}
          </div>

          <div className="space-y-2">
            {!loading && leaderboard.length === 0 && (
              <div className="rounded-[1rem] border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm font-semibold text-[var(--muted)]">
                {copy.noPlayers}
              </div>
            )}

            {leaderboard.map((entry) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                active={entry.id === myStats?.user.id}
                copy={copy}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function SortButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
        active
          ? 'border-[var(--line-strong)] bg-[var(--ink)] text-[var(--paper)]'
          : 'border-[var(--line)] bg-[var(--glass)] text-[var(--muted)] hover:text-[var(--ink)]'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: 'success' | 'sky' | 'warning' | 'accent' | 'ink' }) {
  const className = tone === 'ink' ? 'text-[var(--ink)]' : `text-[var(--${tone})]`
  return (
    <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--glass)] px-3 py-3 text-center">
      <div className={`text-lg font-bold ${className}`}>{value}</div>
      <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
    </div>
  )
}

function LeaderboardRow({
  entry,
  active,
  copy,
}: {
  entry: CloudLeaderboardEntry
  active: boolean
  copy: NonNullable<ReturnType<typeof getStrings>['leaderboard']>
}) {
  return (
    <div className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.1rem] border px-3 py-3 ${
      active
        ? 'border-[var(--accent-soft)] bg-[var(--accent-gradient)] text-[var(--ink)] shadow-[var(--shadow-card)]'
        : 'border-[var(--line)] bg-[var(--glass)]'
    }`}>
      <div className="text-center text-lg font-black">#{entry.rank}</div>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{entry.displayName}</div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">
          <span>{getMathTitle(entry.mathRating)} {entry.mathRating}</span>
          <span>{entry.correctAnswers}/{entry.totalAnswers}</span>
          <span>{Math.round(entry.accuracy)}%</span>
          <span>L{entry.highestLevel}</span>
          <span>{entry.bestStreak} {copy.streak.toLowerCase()}</span>
          <span>{copy.started} {formatStartedDate(entry.createdAt)}</span>
          <span>{copy.practiceDays} {entry.activeDays}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-black">{entry.totalScore}</div>
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{copy.score}</div>
      </div>
    </div>
  )
}
