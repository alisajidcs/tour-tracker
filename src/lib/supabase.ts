import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type SupabaseConfig = {
  url: string
  publishableKey: string
}

export function createSupabaseClient(
  config: SupabaseConfig,
): SupabaseClient<Database> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(config.url)
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS URL.')
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('VITE_SUPABASE_URL must use HTTPS.')
  }
  if (!config.publishableKey.trim()) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is required.')
  }

  return createClient<Database>(config.url, config.publishableKey)
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createSupabaseClient({
        url: supabaseUrl,
        publishableKey: supabasePublishableKey,
      })
    : null
