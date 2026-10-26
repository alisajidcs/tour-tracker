export type ImportedAttraction = {
  name: string
  description: string
  imageUrl: string
  order: number
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
      order: place.order,
    })
  }

  return { places, error: null }
}
