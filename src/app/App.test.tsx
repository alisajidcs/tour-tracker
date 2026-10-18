import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('application foundation', () => {
  it('renders the responsive home placeholder inside the app layout', () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(
      screen.getByRole('link', { name: 'Tour Tracker home' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /make room for wonder/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /start exploring/i }),
    ).toBeInTheDocument()
  })
})
