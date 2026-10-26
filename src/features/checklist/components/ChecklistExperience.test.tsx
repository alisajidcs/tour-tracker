import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authState, supabaseMocks } = vi.hoisted(() => ({
  authState: {
    session: null as Session | null,
    listener: null as ((event: string, session: Session | null) => void) | null,
  },
  supabaseMocks: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: supabaseMocks.getSession,
      onAuthStateChange: supabaseMocks.onAuthStateChange,
      signOut: supabaseMocks.signOut,
    },
    from: supabaseMocks.from,
    rpc: supabaseMocks.rpc,
  },
}))

import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { ChecklistExperience } from '@/features/checklist/components/ChecklistExperience'
import type { Attraction } from '@/features/checklist/sorting'

const attractions: Attraction[] = [
  {
    id: 'cloud-attraction',
    city_id: 'city-1',
    name: 'Cloud stop',
    description: 'A stop checked in the account.',
    image_url: 'https://example.com/cloud.jpg',
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'guest-attraction',
    city_id: 'city-1',
    name: 'Guest stop',
    description: 'A stop only checked in this browser.',
    image_url: 'https://example.com/guest.jpg',
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },
]

function ChecklistHarness() {
  const auth = useAuth()
  return (
    <>
      <button onClick={() => void auth.signOut()}>Sign out</button>
      <ChecklistExperience attractions={attractions} />
    </>
  )
}

describe('ChecklistExperience account isolation', () => {
  beforeEach(() => {
    window.localStorage.clear()
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
    authState.listener = null
    supabaseMocks.getSession.mockImplementation(async () => ({
      data: { session: authState.session },
      error: null,
    }))
    supabaseMocks.onAuthStateChange.mockImplementation((callback) => {
      authState.listener = callback as (
        event: string,
        session: Session | null,
      ) => void
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    supabaseMocks.from.mockReturnValue({
      select: vi.fn(async () => ({
        data: [{ attraction_id: 'cloud-attraction' }],
        error: null,
      })),
    })
    supabaseMocks.signOut.mockImplementation(async () => {
      authState.session = null
      authState.listener?.('SIGNED_OUT', null)
      return { error: null }
    })
  })

  it('stops showing account progress after sign-out', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChecklistHarness />
        </AuthProvider>
      </QueryClientProvider>,
    )

    const cloudCheckbox = await screen.findByRole('checkbox', {
      name: 'Mark as unvisited: Cloud stop',
    })
    expect(cloudCheckbox).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'Mark as visited: Cloud stop' }),
      ).not.toBeChecked()
    })
    expect(
      screen.getByText('Progress is saved in this browser.'),
    ).toBeInTheDocument()
    expect(
      window.localStorage.getItem('tour-tracker:visited-attractions:v1'),
    ).toBeNull()

    queryClient.clear()
  })
})
