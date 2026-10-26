import { describe, expect, it } from 'vitest'
import { validateAttractionImport } from './importValidation'

const validPlace = {
  name: ' Frauenkirche ',
  description: ' Historic church. ',
  imageUrl: 'https://example.com/frauenkirche.jpg',
  order: 1,
}

function toJson(places: unknown) {
  return JSON.stringify({ places })
}

describe('attraction JSON import validation', () => {
  it('validates fields, trims text, and normalizes the image URL', () => {
    expect(validateAttractionImport(toJson([validPlace]), [])).toEqual({
      places: [
        {
          name: 'Frauenkirche',
          description: 'Historic church.',
          imageUrl: 'https://example.com/frauenkirche.jpg',
          order: 1,
        },
      ],
      error: null,
    })
  })

  it('reports malformed JSON and a missing places list', () => {
    expect(validateAttractionImport('{', []).error).toBe('Enter valid JSON.')
    expect(validateAttractionImport('{}', []).error).toContain('places array')
  })

  it('rejects invalid field types, non-HTTPS URLs, and invalid order values', () => {
    expect(
      validateAttractionImport(toJson([{ ...validPlace, name: '' }]), []).error,
    ).toContain('needs a name')
    expect(
      validateAttractionImport(
        toJson([{ ...validPlace, imageUrl: 'http://example.com' }]),
        [],
      ).error,
    ).toContain('HTTPS')
    expect(
      validateAttractionImport(toJson([{ ...validPlace, order: 1.5 }]), [])
        .error,
    ).toContain('positive whole number')
    expect(
      validateAttractionImport(
        toJson([
          { ...validPlace, imageUrl: 'https://example.com:99999/image.jpg' },
        ]),
        [],
      ).error,
    ).toContain('valid HTTPS')
    expect(
      validateAttractionImport(
        toJson([{ ...validPlace, imageUrl: 'https://exa%mple.com/image.jpg' }]),
        [],
      ).error,
    ).toContain('valid HTTPS')
    expect(
      validateAttractionImport(
        toJson([
          { ...validPlace, imageUrl: 'https://999.999.999.999/image.jpg' },
        ]),
        [],
      ).error,
    ).toContain('valid HTTPS')
    expect(
      validateAttractionImport(
        toJson([{ ...validPlace, description: null }]),
        [],
      ).error,
    ).toContain('description string')
  })

  it('rejects normalized duplicates in the batch and current city', () => {
    expect(
      validateAttractionImport(
        toJson([validPlace, { ...validPlace, name: ' frauenkirche ' }]),
        [],
      ).error,
    ).toContain('already exists')
    expect(
      validateAttractionImport(toJson([validPlace]), ['FRAUENKIRCHE']).error,
    ).toContain('already exists')
    expect(
      validateAttractionImport(
        toJson([{ ...validPlace, name: '\u00a0Frauenkirche\u00a0' }]),
        ['Frauenkirche'],
      ).error,
    ).toContain('already exists')
    expect(
      validateAttractionImport(
        toJson([{ ...validPlace, name: ' \t\u00a0' }]),
        [],
      ).error,
    ).toContain('needs a name')
  })

  it('rejects empty and oversized imports', () => {
    expect(validateAttractionImport(toJson([]), []).error).toContain(
      'at least one',
    )
    expect(
      validateAttractionImport(toJson(Array(501).fill(validPlace)), []).error,
    ).toContain('500')
  })
})
