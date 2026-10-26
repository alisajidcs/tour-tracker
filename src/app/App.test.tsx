import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchAttractions, fetchCities, fetchCity } from '@/features/cities/api'
import type { Database } from '@/types/database'
import App from './App'

vi.mock('@/features/cities/api', () => ({
  fetchAttractions: vi.fn(),
  fetchCities: vi.fn(),
  fetchCity: vi.fn(),
}))

type City = Database['public']['Tables']['cities']['Row']
type Attraction = Database['public']['Tables']['attractions']['Row']

const city: City = {
  id: 'city-1',
  name: 'Dresden',
  description: 'A riverside city with Baroque architecture.',
  image_url: 'https://example.com/dresden.jpg',
  created_at: '2026-01-01T00:00:00Z',
}

const firstAttraction: Attraction = {
  id: 'attraction-1',
  city_id: city.id,
  name: 'Frauenkirche',
  description: 'A landmark church in the old town.',
  image_url: 'https://example.com/church.jpg',
  sort_order: 1,
  created_at: '2026-01-01T00:00:00Z',
}

const secondAttraction: Attraction = {
  ...firstAttraction,
  id: 'attraction-2',
  name: 'Zwinger Palace',
  sort_order: 2,
}

function renderApp(initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('city explorer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('lists available cities and opens their detail page', async () => {
    vi.mocked(fetchCities).mockResolvedValue([city])
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttractions).mockResolvedValue([
      firstAttraction,
      secondAttraction,
    ])

    renderApp()

    const cityLink = await screen.findByRole('link', { name: /dresden/i })
    expect(
      within(cityLink).getByRole('heading', { name: 'Dresden' }),
    ).toBeInTheDocument()
    fireEvent.click(cityLink)

    expect(
      await screen.findByRole('heading', { name: 'Recommended stops' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Frauenkirche')).toBeInTheDocument()
    expect(screen.getByText('Zwinger Palace')).toBeInTheDocument()

    const attractionNames = screen
      .getAllByText(/Frauenkirche|Zwinger Palace/)
      .map((element) => element.textContent)
    expect(attractionNames).toEqual(['Frauenkirche', 'Zwinger Palace'])
  })

  it('shows an empty state when the catalog has no cities', async () => {
    vi.mocked(fetchCities).mockResolvedValue([])

    renderApp()

    expect(await screen.findByText('No city guides yet')).toBeInTheDocument()
  })

  it('shows a not-found state for a removed or unknown city', async () => {
    vi.mocked(fetchCity).mockResolvedValue(null)

    renderApp('/cities/missing-city')

    expect(await screen.findByText('City guide not found')).toBeInTheDocument()
    expect(fetchAttractions).not.toHaveBeenCalled()
  })

  it('shows an empty state when a city has no attractions', async () => {
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttractions).mockResolvedValue([])

    renderApp('/cities/city-1')

    expect(
      await screen.findByText('No stops in this guide yet'),
    ).toBeInTheDocument()
  })

  it('shows an error and retries a failed catalog request', async () => {
    vi.mocked(fetchCities)
      .mockRejectedValueOnce(new Error('Catalog unavailable'))
      .mockResolvedValueOnce([city])

    renderApp()

    expect(await screen.findByText('Catalog unavailable')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Dresden' }),
      ).toBeInTheDocument()
    })
  })

  it('shows a fallback when a city image cannot load', async () => {
    vi.mocked(fetchCities).mockResolvedValue([city])

    renderApp()

    const image = await screen.findByRole('img', { name: 'View of Dresden' })
    fireEvent.error(image)

    expect(
      await screen.findByRole('img', {
        name: 'View of Dresden image unavailable',
      }),
    ).toBeInTheDocument()
  })
})
