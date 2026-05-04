import { getLanguageFlag, getLanguageName, getLanguageNativeLabel, getStrings, resolveLanguage, SUPPORTED_LANGUAGES } from '../services/i18n.ts'
import type { Settings, ThemePreference, FontSizePreference, MotionPreference, SurfacePreference, AudioPreference, MicrophonePreference } from '../services/settings.ts'

interface Props {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

export function PreferencesTab({ settings, update }: Props) {
  const language = resolveLanguage(settings.language)
  const strings = getStrings(language)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-1">
      <Section title={strings.preferences.appearance}>
        <LanguageSelector settings={settings} update={update} />
        <SegmentRow<ThemePreference>
          label={strings.preferences.theme}
          value={settings.theme}
          options={[
            { value: 'system', label: strings.preferences.system },
            { value: 'light', label: strings.preferences.light },
            { value: 'dark', label: strings.preferences.dark },
          ]}
          onChange={(v) => update({ theme: v })}
        />
        <SegmentRow<SurfacePreference>
          label={strings.preferences.surface}
          value={settings.surface}
          options={[
            { value: 'soft', label: strings.preferences.soft },
            { value: 'bold', label: strings.preferences.bold },
          ]}
          onChange={(v) => update({ surface: v })}
        />
        <SegmentRow<MotionPreference>
          label={strings.preferences.motion}
          value={settings.motion}
          options={[
            { value: 'full', label: strings.preferences.full },
            { value: 'reduced', label: strings.preferences.reduced },
          ]}
          onChange={(v) => update({ motion: v })}
        />
        <SegmentRow<AudioPreference>
          label={strings.preferences.sound}
          value={settings.audio}
          options={[
            { value: 'on', label: strings.preferences.on },
            { value: 'muted', label: strings.preferences.muted },
          ]}
          onChange={(v) => update({ audio: v })}
        />
        <SegmentRow<MicrophonePreference>
          label={strings.preferences.microphone}
          value={settings.microphone}
          options={[
            { value: 'off', label: strings.preferences.off },
            { value: 'on', label: strings.preferences.on },
          ]}
          onChange={(v) => update({ microphone: v })}
        />
      </Section>

      <Section title={strings.preferences.sizing}>
        <SegmentRow<FontSizePreference>
          label={strings.preferences.labelSize}
          value={settings.labelSize}
          options={[
            { value: 'small', label: 'S' },
            { value: 'medium', label: 'M' },
            { value: 'large', label: 'L' },
            { value: 'xlarge', label: 'XL' },
          ]}
          onChange={(v) => update({ labelSize: v })}
        />
        <SegmentRow<FontSizePreference>
          label={strings.preferences.contentSize}
          value={settings.contentSize}
          options={[
            { value: 'small', label: 'S' },
            { value: 'medium', label: 'M' },
            { value: 'large', label: 'L' },
            { value: 'xlarge', label: 'XL' },
          ]}
          onChange={(v) => update({ contentSize: v })}
        />
      </Section>

      <div className="pt-4 text-center">
        <a href="https://freeappstore.online" target="_blank" rel="noopener" className="text-[0.7rem] font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
          Part of FreeAppStore — free forever
        </a>
      </div>
    </div>
  )
}

function LanguageSelector({ settings, update }: Props) {
  const language = resolveLanguage(settings.language)
  const strings = getStrings(language)
  const options = ['system', ...SUPPORTED_LANGUAGES] as const

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--ink)]">{strings.preferences.language}</span>
        <div className="rounded-full border border-[var(--line)] bg-[var(--glass-soft)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          {getLanguageFlag(settings.language)} {getLanguageNativeLabel(settings.language, language)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const active = settings.language === option
          return (
            <button
              key={option}
              className={`rounded-[1rem] border px-3 py-3 text-left transition-all duration-150 ${
                active
                  ? 'border-[var(--accent-soft)] bg-[var(--accent-gradient)] text-[var(--ink)] shadow-[var(--shadow-card)]'
                  : 'border-[var(--line)] bg-[var(--glass-soft)] text-[var(--muted)] hover:bg-[var(--glass-hover)] hover:text-[var(--ink)]'
              }`}
              onClick={() => update({ language: option as Settings['language'] })}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="text-base">{getLanguageFlag(option)}</span>
                <span>{getLanguageNativeLabel(option, language)}</span>
              </div>
              <div className="mt-1 text-xs opacity-75">
                {getLanguageName(option, language)}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SegmentRow<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
      <div className="flex gap-1 rounded-full border border-[var(--line)] bg-[var(--glass-soft)] p-0.5">
        {options.map(opt => (
          <button
            key={opt.value}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
              value === opt.value
                ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
