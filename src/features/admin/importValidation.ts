export type ImportedAttraction = {
  name: string
  description: string
  imageUrl: string
  longDescription: string
  galleryImageUrls: string[]
  order: number
}

export type ImportedCity = {
  name: string
  description: string
  imageUrl: string
}

export type ImportedCityGuide = {
  city: ImportedCity
  places: ImportedAttraction[]
}

type ValidationResult =
  | { places: ImportedAttraction[]; error: null }
  | { places: null; error: string }

function normalizedName(name: string) {
  return name.trim().toLowerCase()
}

export function validateAttractionImport(
  jsonText: string,
  existingNames: readonly string[],
): ValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { places: null, error: 'Enter valid JSON.' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      places: null,
      error: 'The JSON must be an object with a places array.',
    }
  }

  const placesValue = (parsed as { places?: unknown }).places
  if (!Array.isArray(placesValue) || placesValue.length === 0) {
    return {
      places: null,
      error: 'Add at least one place to the places array.',
    }
  }
  if (placesValue.length > 500) {
    return { places: null, error: 'Import no more than 500 places at a time.' }
  }

  const places: ImportedAttraction[] = []
  const seenNames = new Set(existingNames.map(normalizedName))

  for (const [index, value] of placesValue.entries()) {
    const position = index + 1
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { places: null, error: `Place ${position} must be an object.` }
    }

    const place = value as Record<string, unknown>
    if (typeof place.name !== 'string' || !place.name.trim()) {
      return { places: null, error: `Place ${position} needs a name.` }
    }
    if (typeof place.description !== 'string') {
      return {
        places: null,
        error: `Place ${position} needs a description string.`,
      }
    }
    if (typeof place.imageUrl !== 'string') {
      return {
        places: null,
        error: `Place ${position} needs an imageUrl string.`,
      }
    }
    let imageUrl: URL
    try {
      imageUrl = new URL(place.imageUrl.trim())
    } catch {
      return {
        places: null,
        error: `Place ${position} needs a valid HTTPS imageUrl.`,
      }
    }
    if (imageUrl.protocol !== 'https:') {
      return {
        places: null,
        error: `Place ${position} needs a valid HTTPS imageUrl.`,
      }
    }
    if (
      typeof place.order !== 'number' ||
      !Number.isSafeInteger(place.order) ||
      place.order < 1
    ) {
      return {
        places: null,
        error: `Place ${position} order must be a positive whole number.`,
      }
    }

    const longDescription = place.longDescription ?? ''
    if (typeof longDescription !== 'string') {
      return {
        places: null,
        error: `Place ${position} longDescription must be a string when provided.`,
      }
    }
    const galleryImageUrls = place.galleryImageUrls ?? []
    if (
      !Array.isArray(galleryImageUrls) ||
      galleryImageUrls.some((url) => typeof url !== 'string')
    ) {
      return {
        places: null,
        error: `Place ${position} galleryImageUrls must be an array of HTTPS URLs.`,
      }
    }
    const normalizedGalleryUrls: string[] = []
    for (const galleryUrl of galleryImageUrls as string[]) {
      try {
        const url = new URL(galleryUrl.trim())
        if (url.protocol !== 'https:') throw new Error('invalid protocol')
        normalizedGalleryUrls.push(url.toString())
      } catch {
        return {
          places: null,
          error: `Place ${position} galleryImageUrls must contain valid HTTPS URLs.`,
        }
      }
    }

    const name = place.name.trim()
    const normalized = normalizedName(name)
    if (seenNames.has(normalized)) {
      return {
        places: null,
        error: `“${name}” already exists in this city or import.`,
      }
    }
    seenNames.add(normalized)
    places.push({
      name,
      description: place.description.trim(),
      imageUrl: imageUrl.toString(),
      longDescription: longDescription.trim(),
      galleryImageUrls: normalizedGalleryUrls,
      order: place.order,
    })
  }

  return { places, error: null }
}

export function validateCityGuideImport(jsonText: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { guide: null, error: 'Enter valid JSON.' } as const
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      guide: null,
      error: 'The JSON must be a city guide object.',
    } as const
  }
  const value = parsed as { city?: unknown; places?: unknown }
  if (
    !value.city ||
    typeof value.city !== 'object' ||
    Array.isArray(value.city)
  ) {
    return {
      guide: null,
      error: 'Add a city object with name, description, and imageUrl.',
    } as const
  }
  const city = value.city as Record<string, unknown>
  if (typeof city.name !== 'string' || !city.name.trim()) {
    return { guide: null, error: 'City needs a name.' } as const
  }
  if (
    typeof city.description !== 'string' ||
    typeof city.imageUrl !== 'string'
  ) {
    return {
      guide: null,
      error: 'City needs a description and imageUrl string.',
    } as const
  }
  let imageUrl = ''
  if (city.imageUrl.trim()) {
    try {
      const parsedUrl = new URL(city.imageUrl.trim())
      if (parsedUrl.protocol !== 'https:') throw new Error('invalid protocol')
      imageUrl = parsedUrl.toString()
    } catch {
      return {
        guide: null,
        error: 'City imageUrl must be a valid HTTPS URL.',
      } as const
    }
  }
  const result = validateAttractionImport(
    JSON.stringify({ places: value.places }),
    [],
  )
  if (!result.places) return { guide: null, error: result.error } as const
  return {
    guide: {
      city: {
        name: city.name.trim(),
        description: city.description.trim(),
        imageUrl,
      },
      places: result.places,
    },
    error: null,
  } as const
}
