import { describe, expect, it } from 'vitest'
import { createSupabaseClient } from './supabase'

describe('createSupabaseClient', () => {
  it('creates a client with an HTTPS project URL and publishable key', () => {
    const client = createSupabaseClient({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_test-key',
    })

    expect(client).toBeDefined()
  })

  it('rejects non-HTTPS project URLs', () => {
    expect(() =>
      createSupabaseClient({
        url: 'http://example.supabase.co',
        publishableKey: 'sb_publishable_test-key',
      }),
    ).toThrow('must use HTTPS')
  })

  it('rejects an empty publishable key', () => {
    expect(() =>
      createSupabaseClient({
        url: 'https://example.supabase.co',
        publishableKey: '  ',
      }),
    ).toThrow('VITE_SUPABASE_PUBLISHABLE_KEY is required')
  })
})
