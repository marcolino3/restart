import { describe, it, expect } from 'vitest'
import { OrganizationFormSchema } from './organization-form.schema'

describe('OrganizationFormSchema', () => {
  const validInput = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Acme Corp',
    slug: 'acme-corp',
    timezone: 'Europe/Berlin',
  }

  it('should accept valid minimal input', () => {
    const result = OrganizationFormSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should accept full input with all optional fields', () => {
    const result = OrganizationFormSchema.safeParse({
      ...validInput,
      domain: 'acme.com',
      street: 'Musterstraße 1',
      zip: '10115',
      city: 'Berlin',
      country: 'DE',
      phone: '+49 30 123456',
      email: 'info@acme.com',
      website: 'https://acme.com',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid UUID for id', () => {
    const result = OrganizationFormSchema.safeParse({
      ...validInput,
      id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  // slug validation
  describe('slug', () => {
    it('should accept lowercase letters, numbers, hyphens', () => {
      const result = OrganizationFormSchema.safeParse({
        ...validInput,
        slug: 'acme-corp-42',
      })
      expect(result.success).toBe(true)
    })

    it('should reject uppercase letters in slug', () => {
      const result = OrganizationFormSchema.safeParse({
        ...validInput,
        slug: 'Acme-Corp',
      })
      expect(result.success).toBe(false)
    })

    it('should reject spaces in slug', () => {
      const result = OrganizationFormSchema.safeParse({
        ...validInput,
        slug: 'acme corp',
      })
      expect(result.success).toBe(false)
    })

    it('should reject special characters in slug', () => {
      const result = OrganizationFormSchema.safeParse({
        ...validInput,
        slug: 'acme_corp!',
      })
      expect(result.success).toBe(false)
    })
  })

  // email validation
  describe('email', () => {
    it('should accept valid email', () => {
      const result = OrganizationFormSchema.safeParse({
        ...validInput,
        email: 'test@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty string for email', () => {
      const result = OrganizationFormSchema.safeParse({
        ...validInput,
        email: '',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = OrganizationFormSchema.safeParse({
        ...validInput,
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })
  })

  // defaults
  describe('defaults', () => {
    it('should default timezone to Europe/Berlin', () => {
      const result = OrganizationFormSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.timezone).toBe('Europe/Berlin')
    })

    it('should default optional strings to empty string', () => {
      const result = OrganizationFormSchema.parse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.name).toBe('')
      expect(result.slug).toBe('')
      expect(result.domain).toBe('')
    })
  })
})
