export function googleMapsSearchUrl(placeName: string, cityName = '') {
  const query = [placeName, cityName].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
