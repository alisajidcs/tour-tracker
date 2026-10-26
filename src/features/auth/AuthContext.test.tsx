import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMocks, authListener } = vi.hoisted(() => ({
  authMocks: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
  authListener: {
    current: null as ((event: string, session: unknown) => void) | null,
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
      signInWithOAuth: authMocks.signInWithOAuth,
      signOut: authMocks.signOut,
    },
  },
}))

import { AuthProvider, useAuth } from '@/features/auth/AuthContext'

function AuthStatus() {
  const auth = useAuth()
  return (
    <div>
      <p>{auth.user ? `Signed in as ${auth.user.email}` : 'Signed out'}</p>
      <button onClick={() => void auth.signInWithGoogle()}>Sign in</button>
      <button onClick={() => void auth.signOut()}>Sign out</button>
      {auth.error ? <p role="alert">{auth.error}</p> : null}
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    authMocks.onAuthStateChange.mockImplementation((callback) => {
      authListener.current = callback as (
        event: string,
        session: unknown,
      ) => void
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    authMocks.signInWithOAuth.mockResolvedValue({ error: null })
    authMocks.signOut.mockResolvedValue({ error: null })
  })

  it('starts Google OAuth with the current app origin', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(authMocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  })

  it('tracks sign-in and sign-out events from Supabase', async () => {
    const user = userEvent.setup()
    authMocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: { email: 'traveler@example.test' },
        },
      },
      error: null,
    })
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>,
    )

    await waitFor(() =>
      expect(
        screen.getByText('Signed in as traveler@example.test'),
      ).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(authMocks.signOut).toHaveBeenCalledOnce()

    await act(async () => {
      authListener.current?.('SIGNED_OUT', null)
    })
    await waitFor(() =>
      expect(screen.getByText('Signed out')).toBeInTheDocument(),
    )
  })
})
