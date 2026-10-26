import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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
  sort_order: 1,
  created_at: '2026-01-01T00:00:00Z',
}
const secondAttraction: Attraction = {
  ...firstAttraction,
  id: 'attraction-2',
  name: 'Second stop',
  sort_order: 2,
}

function renderAdminPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
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
      await screen.findByRole('heading', { name: 'Manage city guides' }),
    ).toBeInTheDocument()
    expect(await screen.findAllByText('Dresden')).toHaveLength(2)
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

    await screen.findByRole('heading', { name: 'Manage city guides' })
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

    await screen.findByRole('heading', { name: 'Manage city guides' })
    await user.click(screen.getByRole('button', { name: 'Add city' }))
    await user.type(screen.getAllByLabelText('Name')[0], '  Prague  ')
    await user.click(screen.getByRole('button', { name: 'Save city' }))

    await waitFor(() => {
      expect(adminApiMocks.createCity).toHaveBeenCalledWith({
        name: 'Prague',
        description: '',
        image_url: '',
      })
    })

    await user.click(
      screen.getByRole('button', { name: 'Move Second stop up' }),
    )
    await waitFor(() =>
      expect(adminApiMocks.reorderAttractions).toHaveBeenCalledWith('city-1', [
        'attraction-2',
        'attraction-1',
      ]),
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

    await screen.findByRole('heading', { name: 'Manage city guides' })
    await screen.findByText('1. First stop')
    const importText = JSON.stringify({
      places: [
        {
          name: 'New stop',
          description: 'A description',
          imageUrl: 'https://example.com/new.jpg',
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
          order: 1,
        },
      ])
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Imported 1 attraction.',
    )

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
})
