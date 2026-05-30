import { describe, it, expect } from 'vitest'
import { loadIife } from './helpers/evalIife.js'

const ChordsDB = loadIife('js/chords.js', 'ChordsDB')

describe('ChordsDB — getChord', () => {
  it('returns C major chord', () => {
    const c = ChordsDB.getChord('C')
    expect(c).not.toBeNull()
    expect(c.name).toBe('C Major')
    expect(c.formula).toBe('1 – 3 – 5')
  })

  it('returns null for unknown chord', () => {
    expect(ChordsDB.getChord('XYZ')).toBeNull()
  })

  it('C major has 3 basic variations (root + 2 inversions)', () => {
    const c = ChordsDB.getChord('C')
    expect(c.variations.basic).toHaveLength(3)
  })

  it('Am minor chord exists and has correct formula', () => {
    const am = ChordsDB.getChord('Am')
    expect(am).not.toBeNull()
    expect(am.formula).toBe('1 – ♭3 – 5')
  })
})

describe('ChordsDB — getMidiNotes', () => {
  it('C major root position = [60, 64, 67]', () => {
    const midi = ChordsDB.getMidiNotes('C', 'basic', 0)
    expect(midi).toEqual([60, 64, 67])
  })

  it('C major 1st inversion = [64, 67, 72]', () => {
    const midi = ChordsDB.getMidiNotes('C', 'basic', 1)
    expect(midi).toEqual([64, 67, 72])
  })

  it('G major root position = [67, 71, 74]', () => {
    const midi = ChordsDB.getMidiNotes('G', 'basic', 0)
    expect(midi).toEqual([67, 71, 74])
  })

  it('Am minor root position = [57, 60, 64]', () => {
    const midi = ChordsDB.getMidiNotes('Am', 'basic', 0)
    expect(midi).toEqual([57, 60, 64])
  })

  it('returns [] for unknown chord', () => {
    expect(ChordsDB.getMidiNotes('XYZ', 'basic', 0)).toEqual([])
  })

  it('Cmaj7 intermediate has 4 notes', () => {
    const midi = ChordsDB.getMidiNotes('Cmaj7', 'intermediate', 0)
    expect(midi).toHaveLength(5)
  })
})

describe('ChordsDB — resolveChordKey', () => {
  it('resolves "C" to "C"', () => {
    expect(ChordsDB.resolveChordKey('C')).toBe('C')
  })

  it('resolves alias "Cmaj" to "C"', () => {
    expect(ChordsDB.resolveChordKey('Cmaj')).toBe('C')
  })

  it('resolves alias "Amin" to "Am"', () => {
    expect(ChordsDB.resolveChordKey('Amin')).toBe('Am')
  })

  it('returns null for unknown', () => {
    expect(ChordsDB.resolveChordKey('ZZZ')).toBeNull()
  })
})

describe('ChordsDB — searchChords', () => {
  it('empty query returns all chords', () => {
    const all = ChordsDB.searchChords('')
    expect(all.length).toBeGreaterThan(100)
  })

  it('query "maj7" returns only maj7 chords', () => {
    const results = ChordsDB.searchChords('maj7')
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => expect(r.key.toLowerCase()).toContain('maj7'))
  })

  it('query "Am" returns Am', () => {
    const results = ChordsDB.searchChords('Am')
    const keys = results.map(r => r.key)
    expect(keys).toContain('Am')
  })
})

describe('ChordsDB — getChordTree', () => {
  it('tree has 12 root entries', () => {
    const tree = ChordsDB.getChordTree()
    expect(tree).toHaveLength(12)
  })

  it('each root has chords array', () => {
    const tree = ChordsDB.getChordTree()
    tree.forEach(node => {
      expect(Array.isArray(node.chords)).toBe(true)
      expect(node.chords.length).toBeGreaterThan(0)
    })
  })

  it('first root is C', () => {
    const tree = ChordsDB.getChordTree()
    expect(tree[0].id).toBe('C')
  })
})

describe('ChordsDB — getAllChords', () => {
  it('returns 12 roots × 21 types = 252 chords', () => {
    const all = ChordsDB.getAllChords()
    expect(all.length).toBe(252)
  })

  it('every chord has aliases array', () => {
    const all = ChordsDB.getAllChords()
    all.forEach(c => expect(Array.isArray(c.aliases)).toBe(true))
  })
})
