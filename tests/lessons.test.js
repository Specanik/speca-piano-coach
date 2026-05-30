import { describe, it, expect } from 'vitest'
import { loadIife } from './helpers/evalIife.js'

const LessonsData = loadIife('data/lessons.js', 'LessonsData')

describe('LessonsData — structure', () => {
  it('has at least 10 lessons', () => {
    expect(LessonsData.getCount()).toBeGreaterThanOrEqual(10)
  })

  it('getAll() returns at least 10 lessons', () => {
    expect(LessonsData.getAll().length).toBeGreaterThanOrEqual(10)
  })

  it('first lesson is lesson-01', () => {
    const l = LessonsData.getById('lesson-01')
    expect(l).not.toBeNull()
    expect(l.id).toBe('lesson-01')
  })

  it('last lesson is lesson-10', () => {
    const l = LessonsData.getById('lesson-10')
    expect(l).not.toBeNull()
    expect(l.thumbnail).toBe('🏆')
  })

  it('returns null for unknown lesson', () => {
    expect(LessonsData.getById('lesson-99')).toBeNull()
  })
})

describe('LessonsData — each lesson structure', () => {
  it('every lesson has 4 steps', () => {
    LessonsData.getAll().forEach(l => {
      expect(l.steps).toHaveLength(4)
    })
  })

  it('step types are always: theory, practice, play, quiz', () => {
    const expected = ['theory', 'practice', 'play', 'quiz']
    LessonsData.getAll().forEach(l => {
      const types = l.steps.map(s => s.type)
      expect(types).toEqual(expected)
    })
  })

  it('every lesson has positive xp', () => {
    LessonsData.getAll().forEach(l => {
      expect(l.xp).toBeGreaterThan(0)
    })
  })

  it('every play step has a sequence array', () => {
    LessonsData.getAll().forEach(l => {
      const playStep = l.steps.find(s => s.type === 'play')
      expect(Array.isArray(playStep.sequence)).toBe(true)
      expect(playStep.sequence.length).toBeGreaterThan(0)
    })
  })

  it('every quiz step has a question with 4 options', () => {
    LessonsData.getAll().forEach(l => {
      const quizStep = l.steps.find(s => s.type === 'quiz')
      expect(quizStep.question).toBeDefined()
      expect(quizStep.question.options).toHaveLength(4)
      expect(quizStep.question.correct).toBeGreaterThanOrEqual(0)
      expect(quizStep.question.correct).toBeLessThan(4)
    })
  })
})

describe('LessonsData — MIDI note correctness', () => {
  it('lesson-03 practice step targets C major (60,64,67)', () => {
    const l = LessonsData.getById('lesson-03')
    const prac = l.steps.find(s => s.type === 'practice')
    expect(prac.notes).toEqual(expect.arrayContaining([60, 64, 67]))
  })

  it('lesson-02 play sequence starts with C4 (60)', () => {
    const l = LessonsData.getById('lesson-02')
    const play = l.steps.find(s => s.type === 'play')
    expect(play.sequence[0].midi).toBe(60)
  })
})
