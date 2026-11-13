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
import {
  fetchAttraction,
  fetchAttractions,
  fetchCities,
  fetchCity,
} from '@/features/cities/api'
import type { Database } from '@/types/database'
import App from './App'

vi.mock('@/features/cities/api', () => ({
  fetchAttraction: vi.fn(),
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
  long_description:
    'A landmark church in the old town, rebuilt as a symbol of peace and renewal.',
  image_url: 'https://example.com/church.jpg',
  gallery_image_urls: ['https://example.com/church-interior.jpg'],
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
    window.localStorage.clear()
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
      await screen.findByRole('heading', { name: 'Recommended places' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Frauenkirche')).toBeInTheDocument()
    expect(screen.getByText('Zwinger Palace')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'View Frauenkirche' }),
    ).toHaveAttribute('href', '/cities/city-1/places/attraction-1')
    expect(
      screen.getAllByRole('link', { name: 'Open in Maps' })[0],
    ).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=Frauenkirche%2C%20Dresden',
    )
    expect(screen.getAllByText('Mark visited')).toHaveLength(2)

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

  it('opens a place detail page with its gallery and map link', async () => {
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttraction).mockResolvedValue(firstAttraction)

    renderApp('/cities/city-1/places/attraction-1')

    expect(
      await screen.findByRole('heading', { name: 'Frauenkirche' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/symbol of peace and renewal/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Find on Google Maps' }),
    ).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=Frauenkirche%2C%20Dresden',
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Show image 2 of Frauenkirche' }),
    )
    expect(
      screen.getByRole('img', { name: 'Frauenkirche, image 2' }),
    ).toBeInTheDocument()
  })

  it('shows an empty state when a city has no attractions', async () => {
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttractions).mockResolvedValue([])

    renderApp('/cities/city-1')

    expect(
      await screen.findByText('No places in this guide yet'),
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

  it('moves a visited attraction below unvisited attractions and restores it when unchecked', async () => {
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttractions).mockResolvedValue([
      firstAttraction,
      secondAttraction,
    ])

    renderApp('/cities/city-1')

    const checkbox = await screen.findByRole('checkbox', {
      name: /mark visited.*frauenkirche/i,
    })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.getByText('1 of 2 places visited')).toBeInTheDocument()
      expect(
        screen
          .getAllByRole('article')
          .map((article) => within(article).getByRole('heading').textContent),
      ).toEqual(['Zwinger Palace', 'Frauenkirche'])
    })
    const visitedCheckbox = screen.getByRole('checkbox', {
      name: /^visited:.*frauenkirche/i,
    })
    expect(visitedCheckbox).toBeChecked()
    expect(
      screen.getByRole('region', { name: 'Visited places' }),
    ).toContainElement(visitedCheckbox)

    fireEvent.click(visitedCheckbox)

    await waitFor(() => {
      expect(screen.getByText('0 of 2 places visited')).toBeInTheDocument()
      expect(
        screen
          .getAllByRole('article')
          .map((article) => within(article).getByRole('heading').textContent),
      ).toEqual(['Frauenkirche', 'Zwinger Palace'])
    })
  })

  it('offers Undo after a visit and keeps keyboard focus in the checklist', async () => {
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttractions).mockResolvedValue([
      firstAttraction,
      secondAttraction,
    ])
    renderApp('/cities/city-1')

    const checkbox = await screen.findByRole('checkbox', {
      name: /mark visited.*frauenkirche/i,
    })
    checkbox.focus()
    fireEvent.click(checkbox)

    const undo = await screen.findByRole('button', { name: 'Undo' })
    await waitFor(() => expect(undo).toHaveFocus())
    fireEvent.click(undo)

    await waitFor(() => {
      const restored = screen.getByRole('checkbox', {
        name: /mark visited.*frauenkirche/i,
      })
      expect(restored).not.toBeChecked()
      expect(restored).toHaveFocus()
      expect(
        screen.queryByRole('region', { name: 'Visited places' }),
      ).not.toBeInTheDocument()
    })
  })

  it('persists guest checklist progress after the page is reloaded', async () => {
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttractions).mockResolvedValue([
      firstAttraction,
      secondAttraction,
    ])

    const firstRender = renderApp('/cities/city-1')
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: /mark visited.*frauenkirche/i,
      }),
    )
    await waitFor(() => {
      expect(
        window.localStorage.getItem('tour-tracker:visited-attractions:v1'),
      ).toContain('attraction-1')
    })

    firstRender.unmount()
    renderApp('/cities/city-1')

    expect(
      await screen.findByRole('checkbox', {
        name: /visited.*frauenkirche/i,
      }),
    ).toBeChecked()
    expect(await screen.findByText('1 of 2 places visited')).toBeInTheDocument()
  })

  it('counts only visited attractions that belong to the current city', async () => {
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttractions).mockResolvedValue([firstAttraction])
    window.localStorage.setItem(
      'tour-tracker:visited-attractions:v1',
      JSON.stringify({ visitedAttractionIds: ['another-city-attraction'] }),
    )

    renderApp('/cities/city-1')

    expect(await screen.findByText('0 of 1 places visited')).toBeInTheDocument()
  })

  it('restores the unchecked state and explains a failed storage write', async () => {
    vi.mocked(fetchCity).mockResolvedValue(city)
    vi.mocked(fetchAttractions).mockResolvedValue([firstAttraction])
    const write = vi
      .spyOn(window.localStorage, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Storage disabled')
      })

    renderApp('/cities/city-1')
    const checkbox = await screen.findByRole('checkbox', {
      name: /mark visited.*frauenkirche/i,
    })
    fireEvent.click(checkbox)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Checklist progress could not be saved',
    )
    expect(
      screen.getByRole('checkbox', { name: /mark visited.*frauenkirche/i }),
    ).not.toBeChecked()
    write.mockRestore()
    fireEvent.click(
      within(screen.getByRole('alert')).getByRole('button', {
        name: 'Try again',
      }),
    )
    expect(
      await screen.findByRole('checkbox', {
        name: /^visited:.*frauenkirche/i,
      }),
    ).toBeChecked()
  })
})
