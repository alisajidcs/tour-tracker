import { describe, expect, it } from 'vitest'
import { validateCatalogName, validateImageUrl, validateSortOrder } from './api'

describe('catalog form validation', () => {
  it('rejects blank names after trimming whitespace', () => {
    expect(validateCatalogName('   ')).toBe('Enter a name before saving.')
    expect(validateCatalogName('Dresden')).toBeNull()
  })

  it('allows empty image URLs and requires valid HTTPS URLs when provided', () => {
    expect(validateImageUrl('')).toBeNull()
    expect(validateImageUrl('https://example.com/image.jpg')).toBeNull()
    expect(validateImageUrl('http://example.com/image.jpg')).toContain('HTTPS')
    expect(validateImageUrl('not a url')).toContain('valid HTTPS')
  })

  it('requires attraction order to be a positive integer', () => {
    expect(validateSortOrder(1)).toBeNull()
    expect(validateSortOrder(0)).toContain('positive whole number')
    expect(validateSortOrder(1.5)).toContain('positive whole number')
  })
})
