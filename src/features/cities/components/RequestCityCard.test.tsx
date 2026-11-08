import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequestCityCard } from '@/features/cities/components/RequestCityCard'
import { submitCityRequest } from '@/features/cities/api'

const authMocks = vi.hoisted(() => ({
  value: {
    user: null as { id: string } | null,
    isLoading: false,
    error: null as string | null,
    signInWithGoogle: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    clearError: vi.fn(),
  },
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(() => authMocks.value),
}))

vi.mock('@/features/cities/api', () => ({
  submitCityRequest: vi.fn(),
}))

describe('RequestCityCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.value.user = null
  })

  it('offers the request option to guests and prompts them to sign in', async () => {
    const user = userEvent.setup()
    render(<RequestCityCard />)

    await user.click(screen.getByRole('button', { name: /request a city/i }))
    expect(
      screen.getByText(/sign in to send a city suggestion/i),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in to request' }))

    expect(authMocks.value.signInWithGoogle).toHaveBeenCalledOnce()
    expect(submitCityRequest).not.toHaveBeenCalled()
  })

  it('submits a city suggestion for a signed-in user', async () => {
    authMocks.value.user = { id: 'user-1' }
    vi.mocked(submitCityRequest).mockResolvedValue({} as never)
    const user = userEvent.setup()
    render(<RequestCityCard />)

    await user.click(screen.getByRole('button', { name: /request a city/i }))
    await user.type(screen.getByLabelText('City name'), '  Kyoto  ')
    await user.click(screen.getByRole('button', { name: 'Send suggestion' }))

    expect(submitCityRequest).toHaveBeenCalledWith('Kyoto')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'your city suggestion is with the admin',
    )
  })
})
