import { describe, expect, it } from 'vitest'
import {
  buildAttractionImportPrompt,
  buildCityGuideImportPrompt,
} from './importPrompt'

describe('buildAttractionImportPrompt', () => {
  it('includes the selected city, context, and existing places', () => {
    const prompt = buildAttractionImportPrompt(
      {
        name: 'Dresden',
        description: 'A historic city on the Elbe.',
      },
      ['Zwinger Palace', 'Frauenkirche'],
    )

    expect(prompt).toContain('sightseeing guide for Dresden')
    expect(prompt).toContain('City context: A historic city on the Elbe.')
    expect(prompt).toContain('- Zwinger Palace\n- Frauenkirche')
    expect(prompt).toContain('"imageUrl"')
    expect(prompt).toContain('Return valid JSON only')
  })

  it('handles a city without a description or existing attractions', () => {
    const prompt = buildAttractionImportPrompt(
      { name: 'Prague', description: '' },
      [],
    )

    expect(prompt).toContain('sightseeing guide for Prague')
    expect(prompt).toContain('- None yet')
    expect(prompt).not.toContain('City context:')
  })
})

describe('buildCityGuideImportPrompt', () => {
  it('uses the entered city name and requests one combined JSON schema', () => {
    const prompt = buildCityGuideImportPrompt('Lisbon')
    expect(prompt).toContain('sightseeing guide for Lisbon')
    expect(prompt).toContain('"name": "Lisbon"')
    expect(prompt).toContain('"longDescription"')
    expect(prompt).toContain('"galleryImageUrls"')
    expect(prompt).toContain('"places"')
  })
})
