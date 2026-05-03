import { useState, useEffect, useCallback, useRef } from 'react'
import { Flame, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { generateRound } from '../services/problems.ts'
import { loadScores, recordAnswer, loadProblemStats, recordProblemAnswer } from '../services/scores.ts'
import { reportAnswer } from '../services/cloud.ts'
import { getStrings, type SupportedLanguage } from '../services/i18n.ts'
import { problemToSpeech, speakProblem, spokenTextToIntent, stopSpeaking } from '../services/speech.ts'
import type { ProblemRound, Score } from '../types.ts'
import type { ProblemStatsMap } from '../services/scores.ts'
import type { AudioPreference, MicrophonePreference } from '../services/settings.ts'

interface Props {
  level: number
  showStats: boolean
  language: SupportedLanguage
  audio: AudioPreference
  microphone: MicrophonePreference
  onToggleAudio: () => void
  onToggleMicrophone: () => void
}

export function PracticeTab({ level, showStats, language, audio, microphone, onToggleAudio, onToggleMicrophone }: Props) {
  const strings = getStrings(language)
  const [round, setRound] = useState<ProblemRound | null>(null)
  const [scores, setScores] = useState<Score>(loadScores)
  const [problemStats, setProblemStats] = useState<ProblemStatsMap>(loadProblemStats)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [voiceStatus, setVoiceStatus] = useState<'off' | 'starting' | 'prompting' | 'listening' | 'unsupported' | 'denied'>('off')
  const [heardText, setHeardText] = useState('')
  const [cardReady, setCardReady] = useState(true)
  const [dragX, setDragX] = useState(0)
  const dragging = useRef(false)
  const startX = useRef(0)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const restartTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const acceptVoiceRef = useRef(false)

  const nextRound = useCallback(() => {
    setRound(generateRound(level))
    setFeedback(null)
    setDragX(0)
    setHeardText('')
    setCardReady(microphone !== 'on')
  }, [level, microphone])

  useEffect(() => {
    nextRound()
  }, [nextRound])

  useEffect(() => {
    return () => {
      clearTimeout(feedbackTimer.current)
      clearTimeout(restartTimer.current)
      stopSpeaking()
      recognitionRef.current?.stop()
    }
  }, [])

  const handleAnswer = useCallback((side: 'left' | 'right') => {
    if (!round || feedback) return
    const correct = side === round.correctSide
    setFeedback(correct ? 'correct' : 'wrong')
    setScores(prev => recordAnswer(prev, correct))
    setProblemStats(prev => recordProblemAnswer(prev, round.problem.id, correct))
    void reportAnswer({
      language,
      level,
      problemId: round.problem.id,
      correct,
    })

    clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(nextRound, correct ? 600 : 1200)
  }, [round, feedback, nextRound, language, level])

  const submitSpokenAnswer = useCallback((spokenNumber: number) => {
    if (!round || feedback) return false
    if (spokenNumber === round.leftOption) {
      handleAnswer('left')
      return true
    }
    if (spokenNumber === round.rightOption) {
      handleAnswer('right')
      return true
    }
    return false
  }, [round, feedback, handleAnswer])

  useEffect(() => {
    const recognition = recognitionRef.current
    const recognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition

    clearTimeout(restartTimer.current)
    stopSpeaking()
    acceptVoiceRef.current = false
    if (recognition) {
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.stop()
      recognitionRef.current = null
    }

    if (!round || showStats || feedback) {
      setVoiceStatus(microphone === 'on' && !recognitionCtor ? 'unsupported' : 'off')
      setCardReady(true)
      return
    }

    const startRecognition = () => {
      if (microphone !== 'on') {
        setVoiceStatus('off')
        setCardReady(true)
        return
      }

      if (!recognitionCtor) {
        setVoiceStatus('unsupported')
        setCardReady(true)
        return
      }

      const nextRecognition = new recognitionCtor()
      recognitionRef.current = nextRecognition
      nextRecognition.lang = language
      nextRecognition.continuous = true
      nextRecognition.interimResults = true
      nextRecognition.maxAlternatives = 3

      setVoiceStatus('starting')
      setCardReady(false)

      nextRecognition.onstart = () => {
        setCardReady(true)
        setVoiceStatus(audio === 'on' ? 'prompting' : 'listening')
        if (audio === 'on') {
          speakProblem(round.problem, language, () => {
            acceptVoiceRef.current = true
            setHeardText('')
            setVoiceStatus('listening')
          })
        } else {
          acceptVoiceRef.current = true
        }
      }
      nextRecognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceStatus('denied')
          setCardReady(true)
          return
        }
        if (event.error === 'no-speech') return
        setVoiceStatus('off')
        setCardReady(true)
      }
      nextRecognition.onresult = (event) => {
        for (let i = event.results.length - 1; i >= 0; i--) {
          const result = event.results[i]
          const transcript = result[0]?.transcript?.trim()
          if (transcript) setHeardText(transcript)
          if (!result.isFinal || !acceptVoiceRef.current) continue

          const intent = spokenTextToIntent(result[0]?.transcript ?? '', language)
          if (intent.side) {
            handleAnswer(intent.side)
            return
          }

          for (let j = 0; j < result.length; j++) {
            const nextIntent = spokenTextToIntent(result[j].transcript, language)
            if (nextIntent.side) {
              handleAnswer(nextIntent.side)
              return
            }
            if (nextIntent.number !== null && submitSpokenAnswer(nextIntent.number)) return
          }
        }
      }
      nextRecognition.onend = () => {
        if (recognitionRef.current !== nextRecognition) return
        recognitionRef.current = null

        if (microphone !== 'on' || showStats || feedback) {
          setVoiceStatus('off')
          return
        }

        restartTimer.current = window.setTimeout(() => {
          if (recognitionRef.current || microphone !== 'on' || showStats || feedback) return
          startRecognition()
        }, 180)
      }

      nextRecognition.start()
    }

    if (microphone === 'on') {
      startRecognition()
    } else {
      setCardReady(true)
      if (audio === 'on') speakProblem(round.problem, language)
    }

    return () => {
      clearTimeout(restartTimer.current)
      stopSpeaking()
      acceptVoiceRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [round, audio, microphone, showStats, feedback, submitSpokenAnswer, language, handleAnswer])

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleAnswer('left')
      else if (e.key === 'ArrowRight') handleAnswer('right')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleAnswer])

  // Drag/swipe handling
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (feedback) return
    dragging.current = true
    startX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [feedback])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    setDragX(e.clientX - startX.current)
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    const threshold = 60
    if (dragX < -threshold) handleAnswer('left')
    else if (dragX > threshold) handleAnswer('right')
    else setDragX(0)
  }, [dragX, handleAnswer])

  if (showStats) return <StatsView scores={scores} problemStats={problemStats} language={language} />

  if (!round) return null

  const pct = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0
  const micLabel = microphone === 'off'
    ? strings.practice.micOff
    : voiceStatus === 'starting'
      ? strings.practice.micStarting
      : voiceStatus === 'prompting'
        ? strings.practice.micReady
    : voiceStatus === 'listening'
      ? strings.practice.micLive
      : voiceStatus === 'denied'
        ? strings.practice.micBlocked
        : voiceStatus === 'unsupported'
          ? strings.practice.micUnsupported
          : strings.practice.micOn

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {/* Score bar */}
      <div className="flex w-full max-w-md items-center justify-between px-2 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[var(--ink)]">{scores.correct}/{scores.total}</span>
          <span className="text-[var(--muted)]">{pct}%</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            aria-label={audio === 'on' ? strings.practice.soundOn : strings.practice.muted}
            className={`rounded-full border px-2.5 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
              audio === 'on'
                ? 'border-[var(--line-strong)] bg-[var(--glass)] text-[var(--ink)]'
                : 'border-[var(--line)] bg-[var(--glass-soft)] text-[var(--muted)]'
            }`}
            onClick={onToggleAudio}
            type="button"
          >
            <span className="sm:hidden">
              {audio === 'on' ? <Volume2 className="h-4 w-4" strokeWidth={2.2} /> : <VolumeX className="h-4 w-4" strokeWidth={2.2} />}
            </span>
            <span className="hidden sm:inline">{audio === 'on' ? strings.practice.soundOn : strings.practice.muted}</span>
          </button>
          <button
            aria-label={micLabel}
            className={`rounded-full border px-2.5 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
              microphone === 'on'
                ? 'border-[var(--line-strong)] bg-[var(--glass)] text-[var(--ink)]'
                : 'border-[var(--line)] bg-[var(--glass-soft)] text-[var(--muted)]'
            }`}
            onClick={onToggleMicrophone}
            type="button"
          >
            <span className="sm:hidden">
              {microphone === 'on' ? <Mic className="h-4 w-4" strokeWidth={2.2} /> : <MicOff className="h-4 w-4" strokeWidth={2.2} />}
            </span>
            <span className="hidden sm:inline">{micLabel}</span>
          </button>
          <span className="flex items-center gap-1 text-[var(--warning)]">
            {scores.streak > 0 && (
              <>
                <Flame className="h-4 w-4" strokeWidth={2.2} />
                <span className="hidden sm:inline">{scores.streak} {strings.practice.streak}</span>
                <span className="sm:hidden font-bold">{scores.streak}</span>
              </>
            )}
          </span>
          {scores.bestStreak > 0 && (
            <span className="hidden text-[var(--muted)] text-xs sm:inline">{strings.practice.best} {scores.bestStreak}</span>
          )}
        </div>
      </div>

      <div className="w-full max-w-md px-4">
        {microphone === 'on' && (
          <div className="mb-4 rounded-[1.4rem] border border-[var(--line)] bg-[var(--glass-soft)] px-4 py-3 shadow-[var(--shadow-card)]">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{strings.practice.voiceInput}</div>
            <div className="mt-2 min-h-[1.75rem] text-sm font-semibold text-[var(--ink)]">
              {heardText || '...'}
            </div>
            <div className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {{
                starting: strings.practice.micBeforeCard,
                prompting: strings.practice.promptPlaying,
                listening: `${strings.practice.listeningForAnswer}. ${strings.practice.saySideOrNumber}`,
                denied: strings.practice.micPermissionBlocked,
                unsupported: strings.practice.voiceUnsupported,
                off: strings.practice.micPaused,
              }[voiceStatus]}
            </div>
          </div>
        )}

        {cardReady ? (
          <>
            {/* Problem card */}
            <div
              className="relative select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{ touchAction: 'none' }}
            >
              <div
                className={`flex h-48 w-full items-center justify-center rounded-[2rem] border transition-colors duration-200 sm:h-56 ${
                  feedback === 'correct'
                    ? 'border-[var(--success)] bg-[var(--mint-soft)]'
                    : feedback === 'wrong'
                      ? 'border-[var(--error)] bg-[var(--error)]/10'
                      : 'border-[var(--line-strong)] bg-[var(--card-gradient)]'
                } shadow-[var(--shadow-card)]`}
                style={{
                  transform: feedback ? undefined : `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
                }}
              >
                <span
                  className="display-font text-5xl font-bold text-[var(--ink)] sm:text-6xl"
                  style={{ fontSize: `calc(${round.problem.display.length > 8 ? '2.5rem' : '3.5rem'} * var(--content-scale))` }}
                >
                  {round.problem.display} = ?
                </span>
              </div>

              <div className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {problemToSpeech(round.problem, language)}
              </div>

              {/* Drag hints */}
              {!feedback && Math.abs(dragX) > 20 && (
                <div className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-2xl font-bold ${
                  dragX < 0 ? 'left-[-3rem]' : 'right-[-3rem]'
                }`}>
                  <span className={dragX < 0
                    ? (round.correctSide === 'left' ? 'text-[var(--success)]' : 'text-[var(--error)]')
                    : (round.correctSide === 'right' ? 'text-[var(--success)]' : 'text-[var(--error)]')
                  }>
                    {dragX < 0 ? round.leftOption : round.rightOption}
                  </span>
                </div>
              )}
            </div>

            {/* Answer buttons */}
            <div className="mt-6 flex gap-4">
              <AnswerButton
                side="left"
                language={language}
                value={round.leftOption}
                feedback={feedback}
                isCorrect={round.correctSide === 'left'}
                onClick={() => handleAnswer('left')}
              />
              <AnswerButton
                side="right"
                language={language}
                value={round.rightOption}
                feedback={feedback}
                isCorrect={round.correctSide === 'right'}
                onClick={() => handleAnswer('right')}
              />
            </div>
          </>
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-[2rem] border border-dashed border-[var(--line-strong)] bg-[var(--glass-soft)] text-center shadow-[var(--shadow-card)] sm:h-56">
            <div className="space-y-2 px-6">
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{strings.practice.voiceMode}</div>
              <div className="display-font text-2xl font-bold text-[var(--ink)]">{strings.practice.startingMicrophone}</div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback text */}
      {feedback && (
        <div className={`text-sm font-semibold ${feedback === 'correct' ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
          {feedback === 'correct' ? strings.practice.correct : `${round.problem.display} = ${round.problem.answer}`}
        </div>
      )}
    </div>
  )
}

function StatsView({ scores, problemStats, language }: { scores: Score; problemStats: ProblemStatsMap; language: SupportedLanguage }) {
  const strings = getStrings(language)
  const entries = Object.entries(problemStats)
  const totalProblems = entries.length
  const mastered = entries.filter(([, s]) => s.correct >= 3 && s.wrong === 0).length
  const struggling = entries.filter(([, s]) => s.wrong > s.correct).length

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-1">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={strings.stats.correct} value={scores.correct} color="success" />
        <StatCard label={strings.stats.total} value={scores.total} color="sky" />
        <StatCard label={strings.stats.bestStreak} value={scores.bestStreak} color="warning" />
        <StatCard label={strings.stats.accuracy} value={scores.total > 0 ? `${Math.round((scores.correct / scores.total) * 100)}%` : '-'} color="accent" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={strings.stats.problemsSeen} value={totalProblems} color="sky" />
        <StatCard label={strings.stats.mastered} value={mastered} color="success" />
        <StatCard label={strings.stats.struggling} value={struggling} color="error" />
      </div>

      {entries.length > 0 && (
        <div className="mt-2 rounded-[1.25rem] border border-[var(--line)] bg-[var(--glass-soft)] p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">{strings.stats.recentProblems}</div>
          <div className="grid gap-1">
            {entries
              .sort(([, a], [, b]) => b.lastSeen - a.lastSeen)
              .slice(0, 20)
              .map(([key, stat]) => (
                <div key={key} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm">
                  <span className="font-mono text-[var(--ink)]">{key}</span>
                  <span className={stat.wrong > stat.correct ? 'text-[var(--error)]' : 'text-[var(--success)]'}>
                    {stat.correct}/{stat.correct + stat.wrong}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--line)] bg-[var(--glass-soft)] px-3 py-2.5 text-center">
      <div className={`text-xl font-bold text-[var(--${color})]`}>{value}</div>
      <div className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div>
    </div>
  )
}

function AnswerButton({
  side,
  language,
  value,
  feedback,
  isCorrect,
  onClick,
}: {
  side: 'left' | 'right'
  language: SupportedLanguage
  value: number
  feedback: 'correct' | 'wrong' | null
  isCorrect: boolean
  onClick: () => void
}) {
  const strings = getStrings(language)
  const arrow = side === 'left' ? '\u2190' : '\u2192'
  const hint = side === 'left' ? strings.practice.swipeLeft : strings.practice.swipeRight

  return (
    <button
      className={`flex flex-1 flex-col items-center justify-center rounded-[1.5rem] border py-3 transition-all duration-200 ${
        feedback
          ? isCorrect
            ? 'border-[var(--success)] bg-[var(--success)]/15 text-[var(--success)]'
            : feedback === 'wrong'
              ? 'border-[var(--error)] bg-[var(--error)]/10 text-[var(--error)]'
              : 'border-[var(--line)] bg-[var(--glass)] text-[var(--muted)]'
          : 'border-[var(--line-strong)] bg-[var(--glass)] text-[var(--ink)] hover:bg-[var(--glass-hover)] hover:shadow-[var(--shadow-card)]'
      }`}
      onClick={onClick}
      disabled={!!feedback}
    >
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] opacity-80">
        {arrow} {hint}
      </span>
      <span
        className="font-bold"
        style={{ fontSize: `calc(1.5rem * var(--content-scale))` }}
      >
        {value}
      </span>
    </button>
  )
}
