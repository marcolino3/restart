import { describe, it, expect } from 'vitest'
import {
  PROTECTED_FIELD_CATALOG,
  PROTECTED_FIELD_KEYS,
  isSpecialCategory,
  SPECIAL_CATEGORY_FIELD_COUNT,
  categoryForResource,
  groupFieldCatalog,
  protectedFieldKey,
} from './field-catalog'

describe('field-catalog', () => {
  it('SPECIAL_CATEGORY_FIELD_COUNT matches the number of DSG-5 flagged fields', () => {
    const flagged = PROTECTED_FIELD_CATALOG.filter(isSpecialCategory)
    expect(SPECIAL_CATEGORY_FIELD_COUNT).toBe(flagged.length)
    expect(SPECIAL_CATEGORY_FIELD_COUNT).toBe(13)
  })

  it('admissionAuditLog fields are registered and read-only', () => {
    const key = protectedFieldKey('admissionAuditLog', 'oldValue')
    expect(PROTECTED_FIELD_KEYS.has(key)).toBe(true)
    const entry = PROTECTED_FIELD_CATALOG.find(
      (f) => f.resource === 'admissionAuditLog' && f.field === 'oldValue',
    )
    expect(entry?.actions).toEqual(['read'])
  })

  it('every resource maps to a permission-catalog category', () => {
    const resources = new Set(PROTECTED_FIELD_CATALOG.map((f) => f.resource))
    for (const resource of resources) {
      expect(categoryForResource(resource)).toBeDefined()
    }
  })

  it('groupFieldCatalog carries the category alongside each group', () => {
    const groups = groupFieldCatalog()
    for (const group of groups) {
      expect(group.category).toBe(categoryForResource(group.resource))
    }
  })
})
