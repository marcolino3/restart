import { describe, it, expect } from 'vitest'
import { toSlug } from './to-slug'

describe('toSlug', () => {
  it('should convert basic text to slug', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })

  it('should trim and lowercase', () => {
    expect(toSlug('  Hello  ')).toBe('hello')
  })

  it('should replace German umlauts', () => {
    expect(toSlug('Ärzte und Über')).toBe('aerzte-und-ueber')
    expect(toSlug('Öffentlich')).toBe('oeffentlich')
    expect(toSlug('Grüße')).toBe('gruesse')
  })

  it('should handle ß', () => {
    expect(toSlug('Straße')).toBe('strasse')
  })

  it('should replace special characters with hyphens', () => {
    expect(toSlug('foo@bar.com')).toBe('foo-bar-com')
  })

  it('should remove leading/trailing hyphens', () => {
    expect(toSlug('--hello--')).toBe('hello')
  })

  it('should collapse multiple hyphens', () => {
    expect(toSlug('hello   world   test')).toBe('hello-world-test')
  })

  it('should handle accented characters (non-German)', () => {
    expect(toSlug('café résumé')).toBe('cafe-resume')
  })

  it('should return empty string for empty input', () => {
    expect(toSlug('')).toBe('')
  })

  it('should handle numbers', () => {
    expect(toSlug('Team 42')).toBe('team-42')
  })
})
