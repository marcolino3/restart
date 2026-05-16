import { describe, it, expect } from 'vitest'
import { sanitizeFormData } from './sanitize-form-data'

describe('sanitizeFormData', () => {
  it('should convert null values to undefined', () => {
    const result = sanitizeFormData({ name: 'Test', domain: null })
    expect(result).toEqual({ name: 'Test', domain: undefined })
  })

  it('should convert empty strings to undefined', () => {
    const result = sanitizeFormData({ name: 'Test', phone: '' })
    expect(result).toEqual({ name: 'Test', phone: undefined })
  })

  it('should leave non-empty values unchanged', () => {
    const result = sanitizeFormData({ name: 'Test', count: 42, active: true })
    expect(result).toEqual({ name: 'Test', count: 42, active: true })
  })

  it('should handle nested objects', () => {
    const result = sanitizeFormData({
      org: { name: 'Acme', phone: '' },
    })
    expect(result).toEqual({
      org: { name: 'Acme', phone: undefined },
    })
  })

  it('should handle arrays', () => {
    const result = sanitizeFormData([{ name: 'A', x: null }, { name: 'B', x: '' }])
    expect(result).toEqual([
      { name: 'A', x: undefined },
      { name: 'B', x: undefined },
    ])
  })

  it('should return primitives as-is', () => {
    expect(sanitizeFormData('hello')).toBe('hello')
    expect(sanitizeFormData(42)).toBe(42)
    expect(sanitizeFormData(true)).toBe(true)
    expect(sanitizeFormData(null)).toBe(null)
  })

  it('should preserve zero and false', () => {
    const result = sanitizeFormData({ count: 0, active: false })
    expect(result).toEqual({ count: 0, active: false })
  })
})
