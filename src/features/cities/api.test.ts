import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: supabaseMocks.from },
}))

import { submitCityRequest } from './api'

describe('submitCityRequest', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    supabaseMocks.single.mockResolvedValue({
      data: {
        id: 'request-1',
        user_id: 'user-1',
        city_name: 'Kyoto',
        created_at: '2026-11-08T00:00:00Z',
        status: 'pending',
        fulfilled_at: null,
      },
      error: null,
    })
    supabaseMocks.select.mockReturnValue({ single: supabaseMocks.single })
    supabaseMocks.insert.mockReturnValue({ select: supabaseMocks.select })
    supabaseMocks.from.mockReturnValue({ insert: supabaseMocks.insert })
  })

  it('trims the request name, lets the database assign ownership, and returns the created row', async () => {
    await expect(submitCityRequest('  Kyoto  ')).resolves.toMatchObject({
      id: 'request-1',
      city_name: 'Kyoto',
      status: 'pending',
    })
    expect(supabaseMocks.from).toHaveBeenCalledWith('city_requests')
    expect(supabaseMocks.insert).toHaveBeenCalledWith({ city_name: 'Kyoto' })
    expect(supabaseMocks.select).toHaveBeenCalledWith(
      'id, user_id, city_name, created_at, status, fulfilled_at',
    )
  })

  it('rejects empty and oversized names without writing', async () => {
    await expect(submitCityRequest('  ')).rejects.toThrow('Enter a city name')
    await expect(submitCityRequest('x'.repeat(121))).rejects.toThrow(
      '120 characters',
    )
    expect(supabaseMocks.from).not.toHaveBeenCalled()
  })
})
