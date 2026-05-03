import { describe, expect, it } from 'vitest'
import { generateRound, LEVEL_CATEGORIES, maxLevel } from '../src/services/problems.ts'

describe('problems', () => {
  it('reports the current max level', () => {
    expect(maxLevel()).toBe(40)
  })

  it('creates rounds with the answer on one side', () => {
    const round = generateRound(40)
    expect([round.leftOption, round.rightOption]).toContain(round.problem.answer)
    expect(round.leftOption).not.toBe(round.rightOption)
  })

  it('groups levels into named categories', () => {
    expect(LEVEL_CATEGORIES.map(category => category.label)).toEqual([
      'Core Arithmetic',
      'Fluency Challenge',
      'Geometry',
      'Number Theory',
      'Powers and Roots',
      'Algebra and Limits',
      'Mixed Advanced',
    ])
    expect(LEVEL_CATEGORIES.flatMap(category => category.levels)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1),
    )
  })

  it('keeps advanced generators mathematically consistent', () => {
    for (let i = 0; i < 25; i++) {
      const gcdRound = generateRound(30)
      const gcdMatch = gcdRound.problem.display.match(/gcd\((\d+),(\d+)\)/)
      expect(gcdMatch).not.toBeNull()
      if (gcdMatch) {
        const a = Number(gcdMatch[1])
        const b = Number(gcdMatch[2])
        expect(gcd(a, b)).toBe(gcdRound.problem.answer)
      }

      const lcmRound = generateRound(31)
      const lcmMatch = lcmRound.problem.display.match(/lcm\((\d+),(\d+)\)/)
      expect(lcmMatch).not.toBeNull()
      if (lcmMatch) {
        const a = Number(lcmMatch[1])
        const b = Number(lcmMatch[2])
        expect((a * b) / gcd(a, b)).toBe(lcmRound.problem.answer)
      }

      const spfRound = generateRound(33)
      const spfMatch = spfRound.problem.display.match(/spf\((\d+)\)/)
      expect(spfMatch).not.toBeNull()
      if (spfMatch) {
        const value = Number(spfMatch[1])
        expect(smallestPrimeFactor(value)).toBe(spfRound.problem.answer)
      }

      const linearRound = generateRound(39)
      const linearMatch = linearRound.problem.display.match(/(\d+)x ([+-]) (\d+) = (-?\d+)/)
      expect(linearMatch).not.toBeNull()
      if (linearMatch) {
        const coeff = Number(linearMatch[1])
        const sign = linearMatch[2] === '+' ? 1 : -1
        const constant = Number(linearMatch[3]) * sign
        const rhs = Number(linearMatch[4])
        expect(coeff * linearRound.problem.answer + constant).toBe(rhs)
      }
    }
  })
})

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const next = x % y
    x = y
    y = next
  }
  return x
}

function smallestPrimeFactor(value: number): number {
  for (let factor = 2; factor <= value; factor++) {
    if (value % factor === 0) return factor
  }
  return value
}
