import { validateCatalogName, validateImageUrl } from './api'

export function validatePlaceEdit(text: string) {
  try {
    const value: unknown = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Enter a place object.')
    const place = value as Record<string, unknown>
    const allowed = [
      'name',
      'description',
      'imageUrl',
      'longDescription',
      'galleryImageUrls',
    ]
    if (Object.keys(place).some((key) => !allowed.includes(key)))
      throw new Error(
        'Only name, description, imageUrl, longDescription, and galleryImageUrls can be edited here.',
      )
    for (const key of ['name', 'description', 'imageUrl', 'longDescription']) {
      if (typeof place[key] !== 'string')
        throw new Error(`${key} must be a string.`)
    }
    if (
      !Array.isArray(place.galleryImageUrls) ||
      place.galleryImageUrls.some((url) => typeof url !== 'string')
    )
      throw new Error('galleryImageUrls must be an array of HTTPS URLs.')
    const name = place.name as string
    const imageUrl = place.imageUrl as string
    const gallery = place.galleryImageUrls as string[]
    const error =
      validateCatalogName(name) ??
      validateImageUrl(imageUrl) ??
      gallery
        .map((url) =>
          url.trim() ? validateImageUrl(url) : 'Gallery URLs cannot be blank.',
        )
        .find(Boolean)
    if (error) throw new Error(error)
    return {
      input: {
        name: name.trim(),
        description: place.description as string,
        image_url: imageUrl.trim(),
        long_description: place.longDescription as string,
        gallery_image_urls: gallery.map((url) => url.trim()),
      },
      error: null,
    }
  } catch (error) {
    return {
      input: null,
      error:
        error instanceof SyntaxError
          ? 'Enter valid JSON.'
          : error instanceof Error
            ? error.message
            : 'Invalid place JSON.',
    }
  }
}
