import { supabase } from '@/lib/supabase'

function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      'City guides are unavailable until Supabase is configured. Copy .env.example to .env and add your project URL and publishable key.',
    )
  }

  return supabase
}

export async function fetchCities() {
  const { data, error } = await getSupabaseClient()
    .from('cities')
    .select('id, name, description, image_url, created_at')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function fetchCity(cityId: string) {
  const { data, error } = await getSupabaseClient()
    .from('cities')
    .select('id, name, description, image_url, created_at')
    .eq('id', cityId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchAttractions(cityId: string) {
  const { data, error } = await getSupabaseClient()
    .from('attractions')
    .select('id, city_id, name, description, image_url, sort_order, created_at')
    .eq('city_id', cityId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}
