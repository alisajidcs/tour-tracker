type ImportPromptCity = {
  name: string
  description: string
}

export function buildAttractionImportPrompt(
  city: ImportPromptCity,
  existingAttractionNames: readonly string[],
) {
  const context = city.description.trim()
    ? `\nCity context: ${city.description.trim()}`
    : ''
  const existingPlaces = existingAttractionNames.length
    ? existingAttractionNames.map((name) => `- ${name}`).join('\n')
    : '- None yet'

  return `Create a concise sightseeing guide for ${city.name}.${context}

Suggest around 10 notable attractions located in this city. Do not repeat any place in this existing list:
${existingPlaces}

Return valid JSON only, with no Markdown fences or extra commentary, using exactly this structure:
{
  "places": [
    {
      "name": "Attraction name",
      "description": "A concise, accurate description.",
      "imageUrl": "https://example.com/direct-image.jpg",
      "order": 1
    }
  ]
}

Requirements:
- Include 1 to 500 places. Use a positive whole-number order starting at 1 and increasing by 1.
- Keep each description to one or two factual sentences.
- Every imageUrl must be an HTTPS URL to an image. Do not use a page URL or invent a URL; if you cannot find a suitable image URL, choose another attraction with one.
- Use only the four fields shown for each place. The places array must not contain duplicate names.
- Check the names and image URLs before importing; generated details and links may need verification.`
}

export function buildCityGuideImportPrompt(cityName: string) {
  const name = cityName.trim()
  return `Create a concise sightseeing guide for ${name}.

Return valid JSON only, with no Markdown fences or extra commentary, using this structure:
{
  "city": {
    "name": ${JSON.stringify(name)},
    "description": "A concise introduction to the city.",
    "imageUrl": "https://example.com/direct-city-cover-image.jpg"
  },
  "places": [
    {
      "name": "Place name",
      "description": "A concise card description.",
      "longDescription": "A fuller visitor-friendly description with useful context.",
      "imageUrl": "https://example.com/direct-cover-image.jpg",
      "galleryImageUrls": ["https://example.com/direct-gallery-image.jpg"],
      "order": 1
    }
  ]
}

Requirements:
- The city name must remain exactly “${name}”. Include 1 to 500 notable places located in this city.
- Use a positive whole-number order starting at 1 and increasing by 1.
- Use accurate, useful descriptions. longDescription may be an empty string if reliable detail is unavailable.
- imageUrl and every galleryImageUrls entry must be HTTPS URLs directly to images. Do not invent URLs; use an empty city imageUrl or an empty gallery array when a reliable image cannot be found. Each place imageUrl is required.
- Return only the fields shown. Place names must be unique.
- Verify generated facts and links before importing.`
}
