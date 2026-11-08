import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequest } from './[[path]].js'

const staticResponse = () =>
  new Response(
    '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
    {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    },
  )

function createContext(pathname) {
  return {
    request: new Request(`https://tour.example${pathname}`),
    env: {
      VITE_SUPABASE_URL: 'https://database.example',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'public-key',
    },
    next: vi.fn(async () => staticResponse()),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('city social metadata', () => {
  it('renders city title, description, and cover image in the HTML response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json([
          {
            id: 'city-1',
            name: 'Dresden <script>',
            description: 'A riverside guide.',
            image_url: 'https://images.example/dresden.jpg',
          },
        ]),
      ),
    )
    const context = createContext('/cities/city-1')

    const response = await onRequest(context)
    const html = await response.text()

    expect(html).toContain(
      'og:title" content="Dresden &lt;script&gt; city guide',
    )
    expect(html).toContain('og:description" content="A riverside guide."')
    expect(html).toContain(
      'og:image" content="https://images.example/dresden.jpg"',
    )
    expect(html).toContain('twitter:card" content="summary_large_image"')
  })

  it('renders a place page with its own image and extended description', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        const url = new URL(String(input))
        if (url.pathname.endsWith('/cities')) {
          return Response.json([
            {
              id: 'city-1',
              name: 'Dresden',
              description: 'A riverside guide.',
              image_url: 'https://images.example/dresden.jpg',
            },
          ])
        }
        return Response.json([
          {
            id: 'place-1',
            city_id: 'city-1',
            name: 'Frauenkirche',
            description: 'A church.',
            long_description: 'A place of peace and renewal.',
            image_url: 'https://images.example/church.jpg',
          },
        ])
      }),
    )
    const context = createContext('/cities/city-1/places/place-1')

    const response = await onRequest(context)
    const html = await response.text()

    expect(html).toContain('Frauenkirche · Dresden · Tour Tracker')
    expect(html).toContain('A place of peace and renewal.')
    expect(html).toContain(
      'og:image" content="https://images.example/church.jpg"',
    )
  })

  it('serves the SPA unchanged when a city is not found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json([])),
    )
    const context = createContext('/cities/missing')

    const response = await onRequest(context)

    expect(await response.text()).toContain('<div id="root"></div>')
    expect(context.next).toHaveBeenCalledOnce()
  })
})
