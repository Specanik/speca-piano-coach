import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadIife } from './helpers/evalIife.js'

// ProgressStore needs localStorage — mock it
const localStorageMock = (() => {
  let store = {}
  return {
    getItem:    key       => store[key] ?? null,
    setItem:    (key, v)  => { store[key] = String(v) },
    removeItem: key       => { delete store[key] },
    clear:      ()        => { store = {} },
  }
})()

// Inject mocks before loading the IIFE
global.localStorage = localStorageMock

// Also provide LessonsData stub
global.LessonsData = {
  getById: id => ({ id, xp: 100, title: 'Test Lesson' })
}

const ProgressStore = loadIife('js/progressStore.js', 'ProgressStore')

beforeEach(() => {
  localStorageMock.clear()
})

describe('ProgressStore — completeLesson', () => {
  it('saves first completion', () => {
    ProgressStore.completeLesson('lesson-01', { totalScore: 80, stars: 2, accuracy: 80 })
    expect(ProgressStore.isCompleted('lesson-01')).toBe(true)
  })

  it('updates if new score is higher', () => {
    ProgressStore.completeLesson('lesson-01', { totalScore: 70, stars: 2, accuracy: 70 })
    ProgressStore.completeLesson('lesson-01', { totalScore: 90, stars: 3, accuracy: 90 })
    const r = ProgressStore.getLessonResult('lesson-01')
    expect(r.score).toBe(90)
    expect(r.stars).toBe(3)
  })

  it('does NOT downgrade if lower score', () => {
    ProgressStore.completeLesson('lesson-01', { totalScore: 90, stars: 3, accuracy: 90 })
    ProgressStore.completeLesson('lesson-01', { totalScore: 50, stars: 1, accuracy: 50 })
    const r = ProgressStore.getLessonResult('lesson-01')
    expect(r.score).toBe(90)
  })

  it('awards XP proportional to score', () => {
    ProgressStore.completeLesson('lesson-01', { totalScore: 100, stars: 3, accuracy: 100 })
    expect(ProgressStore.getXP()).toBe(100)  // 100% of 100xp
  })

  it('returns new badges earned', () => {
    const { newBadges } = ProgressStore.completeLesson('lesson-01', { totalScore: 100, stars: 3, accuracy: 100 })
    const ids = newBadges.map(b => b.id)
    expect(ids).toContain('first-note')
    expect(ids).toContain('xp-100')
  })
})

describe('ProgressStore — streak', () => {
  it('starts at 1 on first session', () => {
    ProgressStore.completeLesson('lesson-01', { totalScore: 80, stars: 2, accuracy: 80 })
    expect(ProgressStore.getStreakDays()).toBe(1)
  })
})

describe('ProgressStore — getStats', () => {
  it('returns zeroes when empty', () => {
    const s = ProgressStore.getStats()
    expect(s.totalCompleted).toBe(0)
    expect(s.xp).toBe(0)
    expect(s.avgScore).toBe(0)
  })

  it('computes avgScore correctly', () => {
    ProgressStore.completeLesson('lesson-01', { totalScore: 80, stars: 2, accuracy: 80 })
    ProgressStore.completeLesson('lesson-02', { totalScore: 60, stars: 1, accuracy: 60 })
    const s = ProgressStore.getStats()
    expect(s.avgScore).toBe(70)
    expect(s.totalCompleted).toBe(2)
  })
})

describe('ProgressStore — getAllBadges', () => {
  it('returns all badges with earned=false initially', () => {
    const bs = ProgressStore.getAllBadges()
    expect(bs.length).toBeGreaterThan(0)
    bs.forEach(b => expect(b.earned).toBe(false))
  })

  it('first-note badge earned after completing 1 lesson', () => {
    ProgressStore.completeLesson('lesson-01', { totalScore: 80, stars: 2, accuracy: 80 })
    const bs = ProgressStore.getAllBadges()
    const fn = bs.find(b => b.id === 'first-note')
    expect(fn.earned).toBe(true)
  })
})

describe('ProgressStore — reset', () => {
  it('clears all data', () => {
    ProgressStore.completeLesson('lesson-01', { totalScore: 90, stars: 3, accuracy: 90 })
    ProgressStore.reset()
    expect(ProgressStore.isCompleted('lesson-01')).toBe(false)
    expect(ProgressStore.getXP()).toBe(0)
  })
})
