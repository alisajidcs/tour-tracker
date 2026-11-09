import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'

const { authState, authMocks, adminApiMocks, cityApiMocks } = vi.hoisted(
  () => ({
    authState: { session: null as Session | null },
    authMocks: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    adminApiMocks: {
      checkAdminMembership: vi.fn(),
      createCity: vi.fn(),
      updateAttraction: vi.fn(),
      createCityFromRequest: vi.fn(),
      createCityWithAttractions: vi.fn(),
      fetchPendingCityRequests: vi.fn(),
      reorderAttractions: vi.fn(),
      importAttractions: vi.fn(),
    },
    cityApiMocks: { fetchCities: vi.fn(), fetchAttractions: vi.fn() },
  }),
)

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  },
}))

vi.mock('@/features/admin/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/admin/api')>()),
  checkAdminMembership: adminApiMocks.checkAdminMembership,
  createCity: adminApiMocks.createCity,
  updateAttraction: adminApiMocks.updateAttraction,
  createCityFromRequest: adminApiMocks.createCityFromRequest,
  createCityWithAttractions: adminApiMocks.createCityWithAttractions,
  fetchPendingCityRequests: adminApiMocks.fetchPendingCityRequests,
  reorderAttractions: adminApiMocks.reorderAttractions,
  importAttractions: adminApiMocks.importAttractions,
}))

vi.mock('@/features/cities/api', () => cityApiMocks)

import { AuthProvider } from '@/features/auth/AuthContext'
import type { Database } from '@/types/database'
import { AdminPage } from './AdminPage'

type City = Database['public']['Tables']['cities']['Row']
type Attraction = Database['public']['Tables']['attractions']['Row']

const city: City = {
  id: 'city-1',
  name: 'Dresden',
  description: 'A city guide.',
  image_url: '',
  created_at: '2026-01-01T00:00:00Z',
}

const firstAttraction: Attraction = {
  id: 'attraction-1',
  city_id: city.id,
  name: 'First stop',
  description: '',
  image_url: '',
  long_description: '',
  gallery_image_urls: [],
  sort_order: 1,
  created_at: '2026-01-01T00:00:00Z',
}
const secondAttraction: Attraction = {
  ...firstAttraction,
  id: 'attraction-2',
  name: 'Second stop',
  sort_order: 2,
}

function HistoryControls() {
  const navigate = useNavigate()
  return <button onClick={() => navigate(-1)}>Browser back</button>
}

function renderAdminPage(path: string | string[] = '/admin/cities') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={Array.isArray(path) ? path : [path]}>
        <HistoryControls />
        <AuthProvider>
          <AdminPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminPage authorization', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    authState.session = null
    authMocks.getSession.mockImplementation(async () => ({
      data: { session: authState.session },
      error: null,
    }))
    authMocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    adminApiMocks.checkAdminMembership.mockResolvedValue(false)
    adminApiMocks.createCity.mockResolvedValue({
      ...city,
      id: 'city-created',
      name: 'Prague',
    })
    adminApiMocks.updateAttraction.mockResolvedValue(undefined)
    adminApiMocks.createCityWithAttractions.mockResolvedValue('city-new')
    adminApiMocks.createCityFromRequest.mockResolvedValue({
      ...city,
      name: 'Oslo',
    })
    adminApiMocks.fetchPendingCityRequests.mockResolvedValue([])
    adminApiMocks.reorderAttractions.mockResolvedValue(undefined)
    adminApiMocks.importAttractions.mockResolvedValue(1)
    cityApiMocks.fetchCities.mockResolvedValue([city])
    cityApiMocks.fetchAttractions.mockResolvedValue([])
  })

  it('requires sign-in before showing administrator data', async () => {
    renderAdminPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Sign in to manage the catalog',
      }),
    ).toBeInTheDocument()
    expect(adminApiMocks.checkAdminMembership).not.toHaveBeenCalled()
  })

  it('denies catalog management to a signed-in regular user', async () => {
    authState.session = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1,
      user: {
        id: 'user-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    }

    renderAdminPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Administrator access required',
      }),
    ).toBeInTheDocument()
    expect(adminApiMocks.checkAdminMembership).toHaveBeenCalledWith('user-1')
    expect(
      screen.queryByRole('heading', { name: 'Manage city guides' }),
    ).toBeNull()
  })

  it('shows catalog controls only after administrator membership is confirmed', async () => {
    authState.session = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1,
      user: {
        id: 'admin-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    }
    adminApiMocks.checkAdminMembership.mockResolvedValue(true)

    renderAdminPage()

    expect(
      await screen.findByRole('heading', { name: 'City guides' }),
    ).toBeInTheDocument()
    expect(await screen.findAllByText('Dresden')).not.toHaveLength(0)
  })

  it('validates a blank city name before writing', async () => {
    const user = userEvent.setup()
    authState.session = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1,
      user: {
        id: 'admin-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    }
    adminApiMocks.checkAdminMembership.mockResolvedValue(true)
    renderAdminPage()

    await screen.findByRole('heading', { name: 'City guides' })
    await user.click(screen.getByRole('button', { name: 'Add city' }))
    await user.click(screen.getByRole('button', { name: 'Save city' }))

    expect(
      await screen.findByText('Enter a name before saving.'),
    ).toBeInTheDocument()
    expect(adminApiMocks.createCity).not.toHaveBeenCalled()
  })

  it('saves trimmed city input and sends the requested attraction order', async () => {
    const user = userEvent.setup()
    authState.session = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1,
      user: {
        id: 'admin-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    }
    adminApiMocks.checkAdminMembership.mockResolvedValue(true)
    cityApiMocks.fetchAttractions.mockResolvedValue([
      firstAttraction,
      secondAttraction,
    ])
    renderAdminPage()

    await screen.findByRole('heading', { name: 'City guides' })
    await user.click(screen.getByRole('button', { name: 'Add city' }))
    await user.type(screen.getAllByLabelText('Name')[0], '  Prague  ')
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Prompt for city guide',
        }) as HTMLTextAreaElement
      ).value,
    ).toContain('Prague')
    await user.click(screen.getByRole('button', { name: 'Save city' }))

    await waitFor(() => {
      expect(adminApiMocks.createCity).toHaveBeenCalledWith({
        name: 'Prague',
        description: '',
        image_url: '',
      })
    })

    await user.click(screen.getAllByRole('link', { name: 'Places' })[0])
    await user.click(
      await screen.findByRole('button', { name: 'Move Second stop up' }),
    )
    await waitFor(() =>
      expect(adminApiMocks.reorderAttractions).toHaveBeenCalledWith('city-1', [
        'attraction-2',
        'attraction-1',
      ]),
    )
  })

  it('creates a city and its places from one JSON import', async () => {
    const user = userEvent.setup()
    authState.session = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1,
      user: {
        id: 'admin-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    }
    adminApiMocks.checkAdminMembership.mockResolvedValue(true)
    renderAdminPage()
    await screen.findByRole('heading', { name: 'City guides' })
    await user.click(screen.getByRole('button', { name: 'Add city' }))
    await user.type(screen.getAllByLabelText('Name')[0], 'Kyoto')
    const json = {
      city: {
        name: 'Kyoto',
        description: 'Historic city.',
        imageUrl: 'https://example.com/kyoto.jpg',
      },
      places: [
        {
          name: 'Kiyomizu-dera',
          description: 'Temple.',
          imageUrl: 'https://example.com/temple.jpg',
          longDescription: 'A historic temple.',
          galleryImageUrls: ['https://example.com/temple-view.jpg'],
          order: 1,
        },
      ],
    }
    fireEvent.change(screen.getByRole('textbox', { name: 'City guide JSON' }), {
      target: { value: JSON.stringify(json) },
    })
    await user.click(
      screen.getByRole('button', { name: 'Create city and places' }),
    )
    await waitFor(() =>
      expect(adminApiMocks.createCityWithAttractions).toHaveBeenCalledWith(
        { city: json.city, places: [{ ...json.places[0] }] },
        null,
      ),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'City guide created with its places.',
    )
  })

  it('prefills a pending city request and fulfills it through the atomic city save', async () => {
    const user = userEvent.setup()
    authState.session = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1,
      user: {
        id: 'admin-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    }
    const request = {
      id: 'request-1',
      user_id: 'user-2',
      city_name: 'Oslo',
      created_at: '2026-11-01T00:00:00Z',
      status: 'pending' as const,
      fulfilled_at: null,
    }
    adminApiMocks.checkAdminMembership.mockResolvedValue(true)
    adminApiMocks.fetchPendingCityRequests.mockResolvedValue([request])
    adminApiMocks.createCityFromRequest.mockImplementation(async () => {
      adminApiMocks.fetchPendingCityRequests.mockResolvedValue([])
      return { ...city, name: 'Oslo' }
    })
    renderAdminPage()
    await screen.findByRole('heading', { name: 'City guides' })
    await user.click(screen.getAllByRole('link', { name: 'City requests' })[0])
    await screen.findByText('Oslo')
    await user.click(screen.getByRole('button', { name: /^Add$/ }))
    expect(screen.getByLabelText('Name')).toHaveValue('Oslo')
    await user.click(screen.getByRole('button', { name: 'Save city' }))
    await waitFor(() =>
      expect(adminApiMocks.createCityFromRequest).toHaveBeenCalledWith(
        'request-1',
        { name: 'Oslo', description: '', image_url: '' },
      ),
    )
    expect(adminApiMocks.createCity).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^Add$/ })).toBeNull(),
    )
  })

  it('imports a valid batch for the selected city and blocks existing names', async () => {
    const user = userEvent.setup()
    authState.session = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1,
      user: {
        id: 'admin-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    }
    adminApiMocks.checkAdminMembership.mockResolvedValue(true)
    cityApiMocks.fetchAttractions.mockResolvedValue([firstAttraction])
    renderAdminPage()

    await screen.findByRole('heading', { name: 'City guides' })
    await user.click(screen.getAllByRole('link', { name: 'Places' })[0])
    await screen.findByText('1. First stop')
    await user.click(screen.getByRole('button', { name: 'Import JSON' }))
    expect(
      screen.getByRole('textbox', { name: 'Attractions JSON' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    await user.click(screen.getByRole('button', { name: 'Import JSON' }))
    const writeText = vi.fn().mockResolvedValue(undefined)
    const originalClipboard = Object.getOwnPropertyDescriptor(
      navigator,
      'clipboard',
    )
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const promptField = screen.getByRole('textbox', { name: 'Prompt for LLM' })
    expect((promptField as HTMLTextAreaElement).value).toContain('Dresden')
    expect((promptField as HTMLTextAreaElement).value).toContain('First stop')
    await user.click(screen.getByRole('button', { name: 'Copy prompt' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Prompt copied.',
    )
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('sightseeing guide for Dresden'),
    )
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard)
    } else {
      Reflect.deleteProperty(navigator, 'clipboard')
    }

    const importText = JSON.stringify({
      places: [
        {
          name: 'New stop',
          description: 'A description',
          imageUrl: 'https://example.com/new.jpg',
          longDescription: '',
          galleryImageUrls: [],
          order: 1,
        },
      ],
    })
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Attractions JSON' }),
      {
        target: { value: importText },
      },
    )
    await user.click(screen.getByRole('button', { name: 'Import attractions' }))

    await waitFor(() => {
      expect(adminApiMocks.importAttractions).toHaveBeenCalledWith('city-1', [
        {
          name: 'New stop',
          description: 'A description',
          imageUrl: 'https://example.com/new.jpg',
          longDescription: '',
          galleryImageUrls: [],
          order: 1,
        },
      ])
    })
    expect(await screen.findByText('Imported 1 attraction.')).toHaveTextContent(
      'Imported 1 attraction.',
    )
    await user.click(screen.getByRole('button', { name: 'Import JSON' }))

    fireEvent.change(
      screen.getByRole('textbox', { name: 'Attractions JSON' }),
      {
        target: {
          value: JSON.stringify({
            places: [
              {
                name: ' first STOP ',
                description: '',
                imageUrl: 'https://example.com/duplicate.jpg',
                order: 1,
              },
            ],
          }),
        },
      },
    )
    await user.click(screen.getByRole('button', { name: 'Import attractions' }))
    expect(
      await screen.findByText(/already exists in this city or import/i),
    ).toBeInTheDocument()
    expect(adminApiMocks.importAttractions).toHaveBeenCalledTimes(1)
  })
  it('opens the places route without an inline form and updates JSON in place', async () => {
    const user = userEvent.setup()
    authState.session = { user: { id: 'admin-1' } } as Session
    adminApiMocks.checkAdminMembership.mockResolvedValue(true)
    cityApiMocks.fetchAttractions.mockResolvedValue([firstAttraction])
    renderAdminPage('/admin/places?city=city-1')
    await screen.findByText('1. First stop')
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Edit JSON' }))
    expect(
      screen.getByRole('dialog', { name: 'Edit place JSON' }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Place JSON'), {
      target: { value: '{' },
    })
    await user.click(screen.getByRole('button', { name: 'Save JSON changes' }))
    expect(screen.getByText('Enter valid JSON.')).toBeInTheDocument()
    expect(adminApiMocks.updateAttraction).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Place JSON'), {
      target: {
        value: JSON.stringify({
          name: 'Updated stop',
          description: 'Updated description',
          imageUrl: '',
          longDescription: 'Details',
          galleryImageUrls: [],
        }),
      },
    })
    await user.click(screen.getByRole('button', { name: 'Save JSON changes' }))
    await waitFor(() =>
      expect(adminApiMocks.updateAttraction).toHaveBeenCalledWith(
        'attraction-1',
        {
          name: 'Updated stop',
          description: 'Updated description',
          image_url: '',
          long_description: 'Details',
          gallery_image_urls: [],
          city_id: 'city-1',
          sort_order: 1,
        },
      ),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(adminApiMocks.importAttractions).not.toHaveBeenCalled()
  })
  it('closes an editor on browser history changes and keeps server errors inside its dialog', async () => {
    const user = userEvent.setup()
    authState.session = { user: { id: 'admin-1' } } as Session
    adminApiMocks.checkAdminMembership.mockResolvedValue(true)
    cityApiMocks.fetchAttractions.mockResolvedValue([firstAttraction])
    adminApiMocks.updateAttraction.mockRejectedValue(
      new Error('Could not save this place.'),
    )
    renderAdminPage(['/admin/places?city=other', '/admin/places?city=city-1'])
    await screen.findByText('1. First stop')
    await user.click(screen.getByRole('button', { name: /^Edit$/ }))
    await user.click(screen.getByRole('button', { name: 'Save attraction' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit attraction' })
    await waitFor(() =>
      expect(dialog).toHaveTextContent('Could not save this place.'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(adminApiMocks.updateAttraction).toHaveBeenCalledTimes(1)
  })
})
