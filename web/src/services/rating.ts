export interface RatingBand {
  min: number
  title: string
}

const RATING_BANDS: RatingBand[] = [
  { min: 0, title: 'Beginner' },
  { min: 500, title: 'Apprentice' },
  { min: 700, title: 'Rising Solver' },
  { min: 900, title: 'Pattern Reader' },
  { min: 1100, title: 'Problem Builder' },
  { min: 1300, title: 'Math Specialist' },
  { min: 1550, title: 'Math Master' },
  { min: 1850, title: 'Math Grandmaster' },
  { min: 2200, title: 'Legend' },
]

export function getMathTitle(rating: number): string {
  let current = RATING_BANDS[0].title
  for (const band of RATING_BANDS) {
    if (rating >= band.min) current = band.title
    else break
  }
  return current
}

export function daysSince(dateText: string): number {
  const started = new Date(dateText)
  const now = new Date()
  const diff = now.getTime() - started.getTime()
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1)
}

export function activityRate(activeDays: number, createdAt: string): number {
  return Math.round((activeDays / daysSince(createdAt)) * 100)
}

export function formatStartedDate(dateText: string): string {
  const date = new Date(dateText)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

