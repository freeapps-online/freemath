import { useState, useEffect } from 'react'
import { BarChart3, Calculator, Layers3, Settings2, Trophy } from 'lucide-react'
import { useApplySettings, useSettings } from './hooks.ts'
import { PracticeTab } from './components/PracticeTab.tsx'
import { PreferencesTab } from './components/PreferencesTab.tsx'
import { LeaderboardTab } from './components/LeaderboardTab.tsx'
import { LEVELS, LEVEL_CATEGORIES } from './services/problems.ts'
import { getLevelLabel, getStrings, resolveLanguage } from './services/i18n.ts'
import type { Mode } from './types.ts'

const MODES: Mode[] = ['practice', 'leaderboard', 'preferences']

const PATH_TO_MODE: Record<string, Mode> = {
  '/': 'practice',
  '/practice': 'practice',
  '/leaderboard': 'leaderboard',
  '/preferences': 'preferences',
}

const MODE_TO_PATH: Record<Mode, string> = {
  practice: '/practice',
  leaderboard: '/leaderboard',
  preferences: '/preferences',
}

function getModeFromPath(): Mode {
  return PATH_TO_MODE[window.location.pathname] ?? 'practice'
}

export default function App() {
  const [mode, setMode] = useState<Mode>(getModeFromPath)
  const { settings, update } = useSettings()
  useApplySettings(settings)
  const language = resolveLanguage(settings.language)
  const strings = getStrings(language)
  const [levelOpen, setLevelOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const navigate = (m: Mode) => {
    setMode(m)
    setShowStats(false)
    window.history.pushState(null, '', MODE_TO_PATH[m])
  }

  useEffect(() => {
    const onPop = () => setMode(getModeFromPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const isFullscreen = mode === 'practice'

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-18%] top-[-8%] h-72 w-72 rounded-full bg-[var(--accent-soft)]/35 blur-3xl lg:h-[34rem] lg:w-[34rem]" />
        <div className="absolute right-[-14%] top-[18%] h-72 w-72 rounded-full bg-[var(--sky-soft)]/30 blur-3xl lg:top-[-2%] lg:h-[28rem] lg:w-[28rem]" />
        <div className="absolute bottom-[-10%] left-[10%] h-80 w-80 rounded-full bg-[var(--mint-soft)]/25 blur-3xl lg:left-[45%] lg:h-[26rem] lg:w-[26rem]" />
      </div>

      <div className={`relative mx-auto max-w-[1540px] px-2 pt-1 sm:px-4 lg:px-8 lg:py-8 ${isFullscreen ? 'flex min-h-[100dvh] flex-col pb-14' : 'min-h-[100dvh] pb-14'}`}>
        <div className={`${isFullscreen ? 'flex flex-1 flex-col lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-7' : 'lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-7'}`}>
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex lg:min-h-[calc(100dvh-4rem)] lg:flex-col lg:gap-5 lg:rounded-[2rem] lg:border lg:border-[var(--line)] lg:bg-[var(--glass-strong)] lg:p-6 lg:shadow-[var(--shadow-soft)] lg:backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--glass)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 3A23.933 23.933 0 0 0 3 12c0 3.183.62 6.22 1.745 9M19.255 3C20.38 5.78 21 8.817 21 12s-.62 6.22-1.745 9M12 3v18m-4.5-9h9" />
              </svg>
              {strings.appTagline}
            </div>

            <nav className="space-y-1">
              {MODES.map((item) => (
                <button
                  key={item}
                  className={`w-full rounded-[1rem] px-4 py-3 text-left text-sm font-semibold transition duration-200 ${
                    mode === item
                      ? 'border border-[var(--accent-soft)] bg-[var(--accent-gradient)] text-[var(--ink)] shadow-[var(--shadow-card)]'
                      : 'border border-transparent text-[var(--muted)] hover:bg-[var(--glass-hover)] hover:text-[var(--ink)]'
                  }`}
                  onClick={() => navigate(item)}
                >
                  {strings.modes[item] ?? strings.modes.practice}
                </button>
              ))}
              {mode === 'practice' && (
                <button
                  className={`w-full rounded-[1rem] px-4 py-3 text-left text-sm font-semibold transition duration-200 ${
                    showStats
                      ? 'border border-[var(--sky-soft)] bg-[var(--cool-gradient)] text-[var(--ink)] shadow-[var(--shadow-card)]'
                      : 'border border-transparent text-[var(--muted)] hover:bg-[var(--glass-hover)] hover:text-[var(--ink)]'
                  }`}
                  onClick={() => setShowStats(!showStats)}
                >
                  {showStats ? strings.backToPractice : strings.statsToggle}
                </button>
              )}
            </nav>

            {/* Level picker sidebar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                <span>{strings.levels}</span>
                <span>{LEVELS.length} {strings.total}</span>
              </div>
              <div className="scroll-panel max-h-72 space-y-3 overflow-y-auto pr-2">
                {LEVEL_CATEGORIES.map((category) => (
                  <LevelCategorySection
                    key={category.id}
                    title={category.label}
                    levels={category.levels}
                    selectedLevel={settings.level}
                    language={language}
                    onSelect={(level) => update({ level })}
                  />
                ))}
              </div>
            </div>

            {mode === 'practice' && (
              <div className="mt-auto space-y-3 rounded-[1rem] border border-[var(--line)] bg-[var(--glass-soft)] p-3 text-[0.75rem] text-[var(--muted)]">
                <div className="font-bold uppercase tracking-[0.15em]">{strings.keyboard}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-[var(--line)] bg-[var(--glass)] px-3 py-2">
                    <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                      <span className="rounded-md border border-[var(--line-strong)] px-2 py-1">&larr;</span>
                    </div>
                    <span>{strings.pickLeftAnswer}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-[var(--line)] bg-[var(--glass)] px-3 py-2">
                    <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                      <span className="rounded-md border border-[var(--line-strong)] px-2 py-1">&rarr;</span>
                    </div>
                    <span>{strings.pickRightAnswer}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Mobile header */}
          <header className="mb-1 flex items-center gap-2 lg:hidden">
            <div className="relative">
              <button
                aria-label={`${strings.levels}: ${settings.level} ${getLevelLabel(settings.level, language)}`}
                className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--glass)] px-2.5 py-2 text-xs font-semibold text-[var(--muted)]"
                onClick={() => setLevelOpen(!levelOpen)}
              >
                <Layers3 className="h-4 w-4" strokeWidth={2.2} />
                <span className="font-bold text-[var(--ink)]">{settings.level}</span>
                <svg className={`h-3 w-3 transition-transform ${levelOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {levelOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLevelOpen(false)} />
                  <div className="scroll-panel absolute left-0 top-full z-50 mt-1 max-h-[26rem] w-72 overflow-y-auto rounded-[1rem] border border-[var(--line-strong)] bg-[var(--panel-strong)] p-2 pr-3 shadow-[var(--shadow-soft)] backdrop-blur-xl">
                    <div className="space-y-3">
                      {LEVEL_CATEGORIES.map((category) => (
                        <LevelCategorySection
                          key={category.id}
                          title={category.label}
                          levels={category.levels}
                          selectedLevel={settings.level}
                          language={language}
                          onSelect={(level) => {
                            update({ level })
                            setLevelOpen(false)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {mode === 'practice' && (
                <button
                  aria-label={showStats ? strings.modes.practice : strings.statsToggle}
                  className={`rounded-full border px-2.5 py-2 text-xs font-semibold ${
                    showStats
                      ? 'border-[var(--sky)] bg-[var(--sky)] text-[var(--paper)]'
                      : 'border-[var(--line)] bg-[var(--glass)] text-[var(--muted)]'
                  }`}
                  onClick={() => setShowStats(!showStats)}
                >
                  {showStats ? <Calculator className="h-4 w-4" strokeWidth={2.2} /> : <BarChart3 className="h-4 w-4" strokeWidth={2.2} />}
                </button>
              )}
            </div>
          </header>

          {/* Content */}
          <main className={`min-w-0 ${isFullscreen ? 'flex min-h-0 flex-1 flex-col lg:block' : ''}`}>
            <section className={`backdrop-blur-xl lg:rounded-[1.5rem] lg:bg-[var(--panel-quiet)] lg:p-5 ${isFullscreen ? 'flex min-h-0 flex-1 flex-col' : 'rounded-[1.25rem] bg-[var(--panel-quiet)] p-3 sm:p-4'}`}>
              <div className={`${isFullscreen ? 'flex min-h-0 flex-1 flex-col' : 'min-h-[34rem] sm:min-h-[36rem] lg:min-h-0'}`}>
                {mode === 'practice' && (
                  <PracticeTab
                    level={settings.level}
                    showStats={showStats}
                    language={language}
                    audio={settings.audio}
                    microphone={settings.microphone}
                    onToggleAudio={() => update({ audio: settings.audio === 'on' ? 'muted' : 'on' })}
                    onToggleMicrophone={() => update({ microphone: settings.microphone === 'on' ? 'off' : 'on' })}
                  />
                )}
                {mode === 'leaderboard' && <LeaderboardTab language={language} />}
                {mode === 'preferences' && <PreferencesTab settings={settings} update={update} />}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Mobile dock */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--dock)]/92 px-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-3">
          <TabButton icon="practice" label={strings.modes.practice} active={mode === 'practice'} onClick={() => navigate('practice')} />
          <TabButton icon="leaderboard" label={strings.modes.leaderboard ?? 'Leaderboard'} active={mode === 'leaderboard'} onClick={() => navigate('leaderboard')} />
          <TabButton icon="preferences" label={strings.modes.preferences} active={mode === 'preferences'} onClick={() => navigate('preferences')} />
        </div>
      </nav>
    </div>
  )
}

function LevelCategorySection({
  title,
  levels,
  selectedLevel,
  language,
  onSelect,
}: {
  title: string
  levels: number[]
  selectedLevel: number
  language: ReturnType<typeof resolveLanguage>
  onSelect: (level: number) => void
}) {
  return (
    <section className="space-y-1">
      <div className="px-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{title}</div>
      <div className="space-y-0.5">
        {levels.map((level) => (
          <button
            key={level}
            className={`flex w-full items-center gap-2 rounded-[0.75rem] px-3 py-2 text-left text-sm ${
              level === selectedLevel
                ? 'bg-[var(--accent-gradient)] font-semibold text-[var(--ink)]'
                : 'text-[var(--muted)] hover:bg-[var(--glass-hover)] hover:text-[var(--ink)]'
            }`}
            onClick={() => onSelect(level)}
          >
            <span className="font-bold">{level}</span>
            <span>{getLevelLabel(level, language)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function TabButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className={`relative flex flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-center ${
        active
          ? 'bg-[var(--ink)] text-[var(--paper)] shadow-[var(--shadow-card)]'
          : 'text-[var(--muted)]'
      }`}
      onClick={onClick}
    >
      <TabIcon name={icon} />
      <span className="sr-only">{label}</span>
    </button>
  )
}

function TabIcon({ name }: { name: string }) {
  switch (name) {
    case 'practice':
      return <Calculator className="h-5 w-5" strokeWidth={2} />
    case 'preferences':
      return <Settings2 className="h-5 w-5" strokeWidth={2} />
    case 'leaderboard':
      return <Trophy className="h-5 w-5" strokeWidth={2} />
    default:
      return null
  }
}
