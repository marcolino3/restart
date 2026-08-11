import { describe, it, expect } from 'vitest'
import {
  PERMISSION_CATALOG,
  CATEGORY_ORDER,
  codesForLevel,
  detectLevel,
  categoryLevelCounts,
} from './permission-catalog'

const allCodes = new Set(PERMISSION_CATALOG.map((e) => e.code))

describe('permission-catalog levels', () => {
  it('every non-hidden entry has a level', () => {
    for (const entry of PERMISSION_CATALOG) {
      if (entry.hidden) {
        expect(entry.level).toBeUndefined()
        continue
      }
      expect(entry.level).toBeDefined()
      expect([1, 2, 3]).toContain(entry.level)
    }
  })

  it('codesForLevel is monotonically increasing per category', () => {
    for (const category of CATEGORY_ORDER) {
      const l0 = codesForLevel(category, 0, allCodes)
      const l1 = codesForLevel(category, 1, allCodes)
      const l2 = codesForLevel(category, 2, allCodes)
      const l3 = codesForLevel(category, 3, allCodes)
      expect(l0.length).toBe(0)
      expect(l1.length).toBeLessThanOrEqual(l2.length)
      expect(l2.length).toBeLessThanOrEqual(l3.length)
      for (const code of l1) expect(l2).toContain(code)
      for (const code of l2) expect(l3).toContain(code)
    }
  })

  it('detectLevel roundtrips codesForLevel for every category and distinguishable level', () => {
    for (const category of CATEGORY_ORDER) {
      for (const level of [0, 1, 2, 3] as const) {
        const codes = codesForLevel(category, level, allCodes)
        // A level whose code set is identical to the level below it is
        // ambiguous by construction (no code distinguishes them) - detectLevel
        // always resolves to the lowest matching level, so skip those.
        if (level > 0 && codes.length === codesForLevel(category, (level - 1) as 0 | 1 | 2, allCodes).length) {
          continue
        }
        expect(detectLevel(category, new Set(codes), allCodes)).toBe(level)
      }
    }
  })

  it('detectLevel returns null ("Individuell") for a non-matching mix', () => {
    const category = 'employees'
    const codes = new Set(codesForLevel(category, 3, allCodes))
    // remove one level-1 code, keep the rest -> no level matches exactly
    const level1 = codesForLevel(category, 1, allCodes)
    if (level1.length > 0) {
      codes.delete(level1[0])
      expect(detectLevel(category, codes, allCodes)).toBeNull()
    }
  })

  it('categoryLevelCounts sums to the category total', () => {
    for (const category of CATEGORY_ORDER) {
      const counts = categoryLevelCounts(category, allCodes)
      const total = counts[1] + counts[2] + counts[3]
      expect(codesForLevel(category, 3, allCodes).length).toBe(total)
    }
  })

  it('availableCodes filtering excludes unavailable codes from levels', () => {
    const restricted = new Set<string>()
    expect(codesForLevel('employees', 3, restricted)).toEqual([])
    expect(detectLevel('employees', new Set(), restricted)).toBe(0)
  })
})
