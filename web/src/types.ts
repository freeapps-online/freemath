export type Mode = 'practice' | 'leaderboard' | 'preferences'

export type Operation = '+' | '-' | '*' | '/'

export interface MathProblem {
  id: string
  a: number
  b: number
  op: Operation
  answer: number
  display: string
  speech?: string
}

export interface ProblemRound {
  problem: MathProblem
  correctSide: 'left' | 'right'
  leftOption: number
  rightOption: number
}

export interface Score {
  correct: number
  total: number
  streak: number
  bestStreak: number
}
