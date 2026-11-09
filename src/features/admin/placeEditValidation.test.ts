import { describe, expect, it } from 'vitest'
import { validatePlaceEdit } from './placeEditValidation'
const place = {
  name: ' Temple ',
  description: 'A temple',
  imageUrl: '',
  longDescription: 'Details',
  galleryImageUrls: ['https://example.com/photo.jpg'],
}
describe('place JSON editing', () => {
  it('accepts content with an optional empty cover and trims its name', () => {
    expect(validatePlaceEdit(JSON.stringify(place)).input).toMatchObject({
      name: 'Temple',
      image_url: '',
      gallery_image_urls: place.galleryImageUrls,
    })
  })
  it.each([
    '{',
    'null',
    '[]',
    JSON.stringify({ ...place, name: '' }),
    JSON.stringify({ ...place, imageUrl: 'javascript:alert(1)' }),
    JSON.stringify({ ...place, galleryImageUrls: [''] }),
    JSON.stringify({ ...place, galleryImageUrls: [1] }),
    JSON.stringify({ ...place, id: 'other' }),
    JSON.stringify({ ...place, sort_order: 3 }),
  ])('rejects invalid content or changes to identity/order: %s', (json) => {
    expect(validatePlaceEdit(json).input).toBeNull()
    expect(validatePlaceEdit(json).error).toBeTruthy()
  })
})
