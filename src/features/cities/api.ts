import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type CityRequest = Database['public']['Tables']['city_requests']['Row']

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
    .select(
      'id, city_id, name, description, long_description, image_url, gallery_image_urls, sort_order, created_at',
    )
    .eq('city_id', cityId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function fetchAttraction(cityId: string, attractionId: string) {
  const { data, error } = await getSupabaseClient()
    .from('attractions')
    .select(
      'id, city_id, name, description, long_description, image_url, gallery_image_urls, sort_order, created_at',
    )
    .eq('city_id', cityId)
    .eq('id', attractionId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function submitCityRequest(cityName: string) {
  const trimmedName = cityName.trim()
  if (!trimmedName) throw new Error('Enter a city name to request.')
  if (trimmedName.length > 120)
    throw new Error('City names can be at most 120 characters.')

  const { data, error } = await getSupabaseClient()
    .from('city_requests')
    .insert({ city_name: trimmedName })
    .select('id, user_id, city_name, created_at, status, fulfilled_at')
    .single()

  if (error) throw error
  return data
}
