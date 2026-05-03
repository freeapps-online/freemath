import type { MathProblem, ProblemRound, Operation } from '../types.ts'

export interface LevelCategory {
  id: string
  label: string
  levels: number[]
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeId(a: number, b: number, op: Operation): string {
  return `${a}${op}${b}`
}

function customId(prefix: string, ...parts: Array<number | string>): string {
  return [prefix, ...parts].join('-')
}

function gcdInt(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const next = x % y
    x = y
    y = next
  }
  return x
}

function opSymbol(op: Operation): string {
  switch (op) {
    case '+': return '+'
    case '-': return '-'
    case '*': return '\u00d7'
    case '/': return '\u00f7'
  }
}

function generateProblem(level: number): MathProblem {
  let a!: number
  let b!: number
  let op!: Operation
  let answer!: number
  let display: string | null = null
  let speech: string | undefined
  let id: string | null = null

  switch (level) {
    case 1:
      a = rand(1, 10)
      b = rand(1, 10)
      op = '+'
      answer = a + b
      break
    case 2:
      a = rand(2, 10)
      b = rand(1, a)
      op = '-'
      answer = a - b
      break
    case 3:
      a = rand(1, 10)
      b = rand(1, 10)
      op = '*'
      answer = a * b
      break
    case 4:
      b = rand(1, 10)
      answer = rand(1, 10)
      a = b * answer
      op = '/'
      break
    case 5:
      op = Math.random() < 0.5 ? '+' : '-'
      if (op === '+') {
        a = rand(1, 20)
        b = rand(1, 20)
        answer = a + b
      } else {
        a = rand(2, 20)
        b = rand(1, a)
        answer = a - b
      }
      break
    case 6:
      op = Math.random() < 0.5 ? '*' : '/'
      if (op === '*') {
        a = rand(1, 12)
        b = rand(1, 12)
        answer = a * b
      } else {
        b = rand(1, 12)
        answer = rand(1, 12)
        a = b * answer
      }
      break
    case 7:
      op = Math.random() < 0.5 ? '+' : '-'
      if (op === '+') {
        a = rand(10, 99)
        b = rand(10, 99)
        answer = a + b
      } else {
        a = rand(20, 99)
        b = rand(10, a)
        answer = a - b
      }
      break
    case 8:
      a = rand(10, 50)
      b = rand(2, 9)
      op = '*'
      answer = a * b
      break
    case 9:
      a = rand(2, 15)
      b = a
      op = '*'
      answer = a * b
      break
    case 10: {
      const ops: Operation[] = ['+', '-', '*', '/']
      op = ops[rand(0, 3)]
      if (op === '+') {
        a = rand(10, 100)
        b = rand(10, 100)
        answer = a + b
      } else if (op === '-') {
        a = rand(20, 100)
        b = rand(10, a)
        answer = a - b
      } else if (op === '*') {
        a = rand(2, 20)
        b = rand(2, 20)
        answer = a * b
      } else {
        b = rand(2, 15)
        answer = rand(2, 15)
        a = b * answer
      }
      break
    }
    case 11:
      a = rand(100, 999)
      b = rand(100, 999)
      op = '+'
      answer = a + b
      break
    case 12:
      a = rand(200, 999)
      b = rand(100, a)
      op = '-'
      answer = a - b
      break
    case 13:
      a = rand(11, 25)
      b = rand(11, 25)
      op = '*'
      answer = a * b
      break
    case 14:
      b = rand(3, 25)
      answer = rand(3, 30)
      a = b * answer
      op = '/'
      break
    case 15: {
      const ops: Operation[] = ['+', '-', '*', '/']
      op = ops[rand(0, 3)]
      if (op === '+') {
        a = rand(100, 999)
        b = rand(50, 999)
        answer = a + b
      } else if (op === '-') {
        a = rand(200, 999)
        b = rand(50, a)
        answer = a - b
      } else if (op === '*') {
        a = rand(12, 35)
        b = rand(6, 20)
        answer = a * b
      } else {
        b = rand(4, 30)
        answer = rand(4, 30)
        a = b * answer
      }
      break
    }
    case 16:
      a = rand(2, 50)
      b = a
      op = '+'
      answer = a + b
      break
    case 17:
      answer = rand(2, 75)
      b = 2
      a = answer * b
      op = '/'
      break
    case 18:
      a = rand(80, 199)
      b = rand(8, 35)
      op = '+'
      answer = a + b
      break
    case 19:
      a = rand(25, 99)
      b = rand(3, 9)
      op = '*'
      answer = a * b
      break
    case 20:
      op = Math.random() < 0.5 ? '+' : '-'
      if (op === '+') {
        a = rand(100, 999)
        b = rand(100, 999)
        answer = a + b
      } else {
        a = rand(300, 999)
        b = rand(100, a)
        answer = a - b
      }
      break
    case 21:
      a = rand(13, 19)
      b = rand(13, 19)
      op = '*'
      answer = a * b
      break
    case 22:
      a = rand(2, 20) * 10
      b = rand(2, 12) * 10
      op = '*'
      answer = a * b
      break
    case 23:
      b = rand(6, 40)
      answer = rand(6, 40)
      a = b * answer
      op = '/'
      break
    case 24: {
      const ops: Operation[] = ['+', '-', '*', '/']
      op = ops[rand(0, 3)]
      if (op === '+') {
        a = rand(250, 1500)
        b = rand(100, 999)
        answer = a + b
      } else if (op === '-') {
        a = rand(400, 1500)
        b = rand(100, a)
        answer = a - b
      } else if (op === '*') {
        a = rand(15, 45)
        b = rand(8, 25)
        answer = a * b
      } else {
        b = rand(8, 45)
        answer = rand(8, 45)
        a = b * answer
      }
      break
    }
    case 25: {
      const ops: Operation[] = ['+', '-', '*', '/']
      op = ops[rand(0, 3)]
      if (op === '+') {
        a = rand(500, 2500)
        b = rand(250, 1800)
        answer = a + b
      } else if (op === '-') {
        a = rand(700, 2500)
        b = rand(200, a)
        answer = a - b
      } else if (op === '*') {
        a = rand(20, 60)
        b = rand(12, 30)
        answer = a * b
      } else {
        b = rand(10, 50)
        answer = rand(10, 50)
        a = b * answer
      }
      break
    }
    case 26:
      a = rand(4, 25)
      b = rand(3, 18)
      answer = 2 * (a + b)
      display = `perim ${a}\u00d7${b}`
      speech = `perimeter of a rectangle ${a} by ${b}`
      id = customId('perim', a, b)
      break
    case 27:
      a = rand(4, 24)
      b = rand(3, 18)
      answer = a * b
      display = `area ${a}\u00d7${b}`
      speech = `area of a rectangle ${a} by ${b}`
      id = customId('area', a, b)
      break
    case 28: {
      const angleA = rand(20, 80)
      const angleB = rand(20, 80 - Math.max(0, angleA - 40))
      answer = 180 - angleA - angleB
      display = `\u25b3 ${angleA}\u00b0 ${angleB}\u00b0 x`
      speech = `triangle angles ${angleA} degrees and ${angleB} degrees, find the missing angle`
      id = customId('angle', angleA, angleB)
      break
    }
    case 29: {
      const x1 = rand(-4, 4)
      const stepX = rand(1, 5)
      const slope = rand(1, 5)
      const y1 = rand(-5, 8)
      const x2 = x1 + stepX
      const y2 = y1 + slope * stepX
      answer = slope
      display = `m(${x1},${y1})\u2192(${x2},${y2})`
      speech = `slope from point ${x1}, ${y1} to point ${x2}, ${y2}`
      id = customId('slope', x1, y1, x2, y2)
      break
    }
    case 30: {
      const gcd = rand(2, 15)
      const factorA = rand(1, 8)
      let factorB = rand(1, 8)
      while (gcdInt(factorA, factorB) !== 1) factorB = rand(1, 8)
      a = gcd * factorA
      b = gcd * factorB
      answer = gcd
      display = `gcd(${a},${b})`
      speech = `greatest common divisor of ${a} and ${b}`
      id = customId('gcd', a, b)
      break
    }
    case 31: {
      const gcd = rand(1, 6)
      const factorA = rand(2, 9)
      let factorB = rand(2, 9)
      while (factorB === factorA || gcdInt(factorA, factorB) !== 1) factorB = rand(2, 9)
      a = gcd * factorA
      b = gcd * factorB
      answer = gcd * factorA * factorB
      display = `lcm(${a},${b})`
      speech = `least common multiple of ${a} and ${b}`
      id = customId('lcm', a, b)
      break
    }
    case 32: {
      b = rand(3, 12)
      const q = rand(3, 16)
      const r = rand(0, b - 1)
      a = q * b + r
      answer = r
      display = `${a} mod ${b}`
      speech = `${a} mod ${b}`
      id = customId('mod', a, b)
      break
    }
    case 33: {
      const primes = [2, 3, 5, 7, 11, 13]
      const smallestIndex = rand(0, primes.length - 1)
      const smallest = primes[smallestIndex]
      const other = primes[rand(smallestIndex, primes.length - 1)]
      const extra = Math.random() < 0.5 ? 1 : smallest
      a = smallest * other * extra
      answer = smallest
      display = `spf(${a})`
      speech = `smallest prime factor of ${a}`
      id = customId('spf', a)
      break
    }
    case 34:
      a = rand(2, 9)
      b = rand(2, 5)
      answer = a ** b
      display = `${a}^${b}`
      speech = `${a} to the power of ${b}`
      id = customId('pow', a, b)
      break
    case 35:
      if (Math.random() < 0.65) {
        answer = rand(3, 20)
        a = answer * answer
        display = `\u221a${a}`
        speech = `square root of ${a}`
        id = customId('sqrt', a)
      } else {
        answer = rand(2, 10)
        a = answer * answer * answer
        display = `\u221b${a}`
        speech = `cube root of ${a}`
        id = customId('cbrt', a)
      }
      break
    case 36: {
      const x = rand(2, 8)
      const c = rand(1, 12)
      const constantAtX = x * x + c * x
      answer = 2 * x + c
      display = `lim x\u2192${x} (x^2+${c}x-${constantAtX})/(x-${x})`
      speech = `limit as x approaches ${x} of x squared plus ${c} x minus ${constantAtX}, over x minus ${x}`
      id = customId('limit', x, c)
      break
    }
    case 37: {
      const percent = [5, 10, 20, 25, 50, 75][rand(0, 5)]
      const whole = rand(4, 24) * 5
      answer = Math.round((percent / 100) * whole)
      display = `${percent}% of ${whole}`
      speech = `${percent} percent of ${whole}`
      id = customId('percent', percent, whole)
      break
    }
    case 38: {
      const numerator = rand(2, 9)
      const denominator = rand(numerator + 1, 12)
      const total = denominator * rand(3, 15)
      answer = (numerator * total) / denominator
      display = `${numerator}/${denominator} of ${total}`
      speech = `${numerator} over ${denominator} of ${total}`
      id = customId('ratio', numerator, denominator, total)
      break
    }
    case 39: {
      const x = rand(0, 12)
      const coeff = rand(2, 9)
      const constant = rand(-15, 20)
      const rhs = coeff * x + constant
      answer = x
      display = `${coeff}x ${constant >= 0 ? '+' : '-'} ${Math.abs(constant)} = ${rhs}`
      speech = `solve ${coeff} x ${constant >= 0 ? 'plus' : 'minus'} ${Math.abs(constant)} equals ${rhs}`
      id = customId('linear', coeff, constant, rhs)
      break
    }
    case 40:
      return generateProblem(rand(26, 39))
    default:
      a = rand(1, 10)
      b = rand(1, 10)
      op = '+'
      answer = a + b
  }

  if (display && id) {
    return { id, a, b, op, answer, display, speech }
  }

  return {
    id: makeId(a, b, op),
    a,
    b,
    op,
    answer,
    display: `${a} ${opSymbol(op)} ${b}`,
    speech,
  }
}

function generateWrongAnswer(correct: number, level: number): number {
  const spread = level <= 4 ? 5 : level <= 7 ? 15 : level <= 10 ? 30 : level <= 12 ? 75 : level <= 15 ? 150 : level <= 20 ? 250 : level <= 25 ? 400 : level <= 30 ? 120 : level <= 35 ? 180 : 240
  let wrong: number
  let attempts = 0
  do {
    const offset = rand(1, spread) * (Math.random() < 0.5 ? 1 : -1)
    wrong = correct + offset
    attempts++
  } while ((wrong === correct || wrong < 0) && attempts < 20)
  if (wrong === correct) wrong = correct + 1
  if (wrong < 0) wrong = correct + rand(1, spread)
  return wrong
}

export function generateRound(level: number): ProblemRound {
  const problem = generateProblem(level)
  const wrong = generateWrongAnswer(problem.answer, level)
  const correctSide = Math.random() < 0.5 ? 'left' : 'right' as const

  return {
    problem,
    correctSide,
    leftOption: correctSide === 'left' ? problem.answer : wrong,
    rightOption: correctSide === 'right' ? problem.answer : wrong,
  }
}

export function generatePool(level: number, size: number): MathProblem[] {
  const seen = new Set<string>()
  const pool: MathProblem[] = []
  let attempts = 0
  while (pool.length < size && attempts < size * 3) {
    const p = generateProblem(level)
    if (!seen.has(p.id)) {
      seen.add(p.id)
      pool.push(p)
    }
    attempts++
  }
  return pool
}

export const LEVEL_LABELS: Record<number, string> = {
  1: 'Addition',
  2: 'Subtraction',
  3: 'Multiplication',
  4: 'Division',
  5: 'Mixed +/-',
  6: 'Mixed \u00d7/\u00f7',
  7: 'Two-digit +/-',
  8: 'Two-digit \u00d7',
  9: 'Squares',
  10: 'Mixed All',
  11: 'Three-digit +',
  12: 'Three-digit -',
  13: 'Two-digit \u00d7\u00d7',
  14: 'Big \u00f7',
  15: 'Challenge',
  16: 'Doubles',
  17: 'Halves',
  18: 'Near 100s +',
  19: 'Big single \u00d7',
  20: 'Three-digit +/- mix',
  21: 'Teen \u00d7 teen',
  22: '10s \u00d7 10s',
  23: 'Large exact \u00f7',
  24: 'Big mixed',
  25: 'Master mix',
  26: 'Geometry perimeter',
  27: 'Geometry area',
  28: 'Angles',
  29: 'Coordinate slope',
  30: 'GCD',
  31: 'LCM',
  32: 'Mod arithmetic',
  33: 'Prime factors',
  34: 'Exponents',
  35: 'Roots',
  36: 'Limits',
  37: 'Percentages',
  38: 'Ratios',
  39: 'Linear equations',
  40: 'Advanced mixed',
}

export const LEVELS = Array.from({ length: 40 }, (_, i) => i + 1)

export const LEVEL_CATEGORIES: LevelCategory[] = [
  { id: 'core', label: 'Core Arithmetic', levels: LEVELS.filter(level => level >= 1 && level <= 10) },
  { id: 'fluency', label: 'Fluency Challenge', levels: LEVELS.filter(level => level >= 11 && level <= 25) },
  { id: 'geometry', label: 'Geometry', levels: LEVELS.filter(level => level >= 26 && level <= 29) },
  { id: 'number-theory', label: 'Number Theory', levels: LEVELS.filter(level => level >= 30 && level <= 33) },
  { id: 'powers', label: 'Powers and Roots', levels: LEVELS.filter(level => level >= 34 && level <= 35) },
  { id: 'algebra', label: 'Algebra and Limits', levels: LEVELS.filter(level => level >= 36 && level <= 39) },
  { id: 'mixed', label: 'Mixed Advanced', levels: [40] },
]

export function maxLevel(): number {
  return LEVELS[LEVELS.length - 1] ?? 1
}
