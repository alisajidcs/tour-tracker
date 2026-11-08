function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

function metaTag(key, content, attribute = 'property') {
  return `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`
}

async function readRow(url, key, signal) {
  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    signal,
  })
  if (!response.ok) return null
  const rows = await response.json()
  return Array.isArray(rows) ? (rows[0] ?? null) : null
}

function absoluteImageUrl(imageUrl, origin) {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return ''
  try {
    const url = new URL(imageUrl, origin)
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

async function getPageMetadata(pathSegments, env, origin, signal) {
  const baseUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!baseUrl || !publicKey) return null

  const [cityId, type, placeId] = pathSegments
  if (!cityId) return null

  const cityUrl = new URL(`${baseUrl}/rest/v1/cities`)
  cityUrl.searchParams.set('select', 'id,name,description,image_url')
  cityUrl.searchParams.set('id', `eq.${cityId}`)
  const city = await readRow(cityUrl, publicKey, signal)
  if (!city) return null

  if (type === 'places' && placeId) {
    const placeUrl = new URL(`${baseUrl}/rest/v1/attractions`)
    placeUrl.searchParams.set(
      'select',
      'id,city_id,name,description,long_description,image_url',
    )
    placeUrl.searchParams.set('id', `eq.${placeId}`)
    placeUrl.searchParams.set('city_id', `eq.${cityId}`)
    const place = await readRow(placeUrl, publicKey, signal)
    if (!place) return null
    return {
      title: `${place.name} · ${city.name} · Tour Tracker`,
      description:
        place.long_description?.trim() || place.description || city.description,
      image: absoluteImageUrl(place.image_url, origin),
    }
  }

  if (type) return null
  return {
    title: `${city.name} city guide · Tour Tracker`,
    description:
      city.description || `Explore recommended places in ${city.name}.`,
    image: absoluteImageUrl(city.image_url, origin),
  }
}

function insertSocialMetadata(html, metadata, pageUrl) {
  const description = metadata.description.slice(0, 240)
  const tags = [
    metaTag('description', description, 'name'),
    metaTag('og:type', 'website'),
    metaTag('og:site_name', 'Tour Tracker'),
    metaTag('og:title', metadata.title),
    metaTag('og:description', description),
    metaTag('og:url', pageUrl),
    metaTag('twitter:card', 'summary_large_image', 'name'),
    metaTag('twitter:title', metadata.title, 'name'),
    metaTag('twitter:description', description, 'name'),
  ]
  if (metadata.image) {
    tags.push(
      metaTag('og:image', metadata.image),
      metaTag('og:image:alt', metadata.title),
      metaTag('twitter:image', metadata.image, 'name'),
    )
  }
  return html.replace('</head>', `${tags.join('\n    ')}\n  </head>`)
}

export async function onRequest(context) {
  const response = await context.next()
  if (
    response.status !== 200 ||
    !response.headers.get('content-type')?.includes('text/html')
  ) {
    return response
  }

  const requestUrl = new URL(context.request.url)
  const segments = requestUrl.pathname.split('/').filter(Boolean)
  if (segments[0] !== 'cities' || segments.length < 2 || segments.length > 4) {
    return response
  }

  try {
    const metadata = await getPageMetadata(
      segments.slice(1),
      context.env,
      requestUrl.origin,
      context.request.signal,
    )
    if (!metadata) return response

    const html = await response.text()
    const headers = new Headers(response.headers)
    headers.set('content-type', 'text/html; charset=utf-8')
    headers.set('cache-control', 'no-store')
    headers.delete('content-encoding')
    headers.delete('content-length')
    headers.delete('etag')
    return new Response(insertSocialMetadata(html, metadata, requestUrl.href), {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch {
    return response
  }
}
