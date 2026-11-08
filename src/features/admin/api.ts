import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { CityRequest } from '@/features/cities/api'
import type {
  ImportedAttraction,
  ImportedCityGuide,
} from '@/features/admin/importValidation'

type CityRow = Database['public']['Tables']['cities']['Row']
type AttractionRow = Database['public']['Tables']['attractions']['Row']

export type CityInput = Pick<CityRow, 'name' | 'description' | 'image_url'>
export type AttractionInput = Pick<
  AttractionRow,
  | 'city_id'
  | 'name'
  | 'description'
  | 'image_url'
  | 'long_description'
  | 'gallery_image_urls'
  | 'sort_order'
>

function getSupabaseClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export function validateCatalogName(name: string) {
  return name.trim() ? null : 'Enter a name before saving.'
}

export function validateImageUrl(imageUrl: string) {
  if (!imageUrl.trim()) return null
  try {
    const url = new URL(imageUrl)
    if (url.protocol !== 'https:') return 'Image URLs must use HTTPS.'
    return null
  } catch {
    return 'Enter a valid HTTPS image URL.'
  }
}

export function validateSortOrder(sortOrder: number) {
  return Number.isInteger(sortOrder) && sortOrder > 0
    ? null
    : 'Attraction order must be a positive whole number.'
}

export async function checkAdminMembership(userId: string) {
  const { data, error } = await getSupabaseClient()
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export async function createCity(input: CityInput) {
  const { data, error } = await getSupabaseClient()
    .from('cities')
    .insert({
      name: input.name.trim(),
      description: input.description.trim(),
      image_url: input.image_url.trim(),
    })
    .select('id, name, description, image_url, created_at')
    .single()

  if (error) throw error
  return data
}

export async function fetchPendingCityRequests(): Promise<CityRequest[]> {
  const { data, error } = await getSupabaseClient()
    .from('city_requests')
    .select('id, user_id, city_name, created_at, status, fulfilled_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createCityFromRequest(
  requestId: string,
  input: CityInput,
) {
  const client = getSupabaseClient()
  const { data: id, error } = await client.rpc('create_city_from_request', {
    p_request_id: requestId,
    p_name: input.name.trim(),
    p_description: input.description.trim(),
    p_image_url: input.image_url.trim(),
  })
  if (error) throw error

  const { data, error: fetchError } = await client
    .from('cities')
    .select('id, name, description, image_url, created_at')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError
  return data
}

export async function updateCity(id: string, input: CityInput) {
  const { data, error } = await getSupabaseClient()
    .from('cities')
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      image_url: input.image_url.trim(),
    })
    .eq('id', id)
    .select('id, name, description, image_url, created_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteCity(id: string) {
  const { error } = await getSupabaseClient()
    .from('cities')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createAttraction(input: AttractionInput) {
  const client = getSupabaseClient()
  const { data: id, error } = await client.rpc('create_city_attraction', {
    p_city_id: input.city_id,
    p_name: input.name.trim(),
    p_description: input.description.trim(),
    p_image_url: input.image_url.trim(),
    p_long_description: input.long_description.trim(),
    p_gallery_image_urls: input.gallery_image_urls,
  })

  if (error) throw error

  const { data, error: fetchError } = await client
    .from('attractions')
    .select(
      'id, city_id, name, description, image_url, long_description, gallery_image_urls, sort_order, created_at',
    )
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  return data
}

export async function updateAttraction(id: string, input: AttractionInput) {
  const { data, error } = await getSupabaseClient()
    .from('attractions')
    .update({
      city_id: input.city_id,
      name: input.name.trim(),
      description: input.description.trim(),
      image_url: input.image_url.trim(),
      long_description: input.long_description.trim(),
      gallery_image_urls: input.gallery_image_urls,
      sort_order: input.sort_order,
    })
    .eq('id', id)
    .select(
      'id, city_id, name, description, image_url, long_description, gallery_image_urls, sort_order, created_at',
    )
    .single()

  if (error) throw error
  return data
}

export async function deleteAttraction(id: string) {
  const { error } = await getSupabaseClient()
    .from('attractions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function reorderAttractions(
  cityId: string,
  attractionIds: readonly string[],
) {
  const { error } = await getSupabaseClient().rpc('reorder_city_attractions', {
    p_city_id: cityId,
    p_attraction_ids: [...attractionIds],
  })

  if (error) throw error
}

export async function importAttractions(
  cityId: string,
  places: readonly ImportedAttraction[],
) {
  const { data, error } = await getSupabaseClient().rpc(
    'append_city_attractions',
    {
      p_city_id: cityId,
      p_places: places.map((place) => ({
        name: place.name,
        description: place.description,
        imageUrl: place.imageUrl,
        longDescription: place.longDescription,
        galleryImageUrls: place.galleryImageUrls,
        order: place.order,
      })),
    },
  )

  if (error) throw error
  return data
}

export async function createCityWithAttractions(
  guide: ImportedCityGuide,
  requestId?: string | null,
) {
  const client = getSupabaseClient()
  const cityPayload = {
    name: guide.city.name,
    description: guide.city.description,
    imageUrl: guide.city.imageUrl,
  }
  const placesPayload = guide.places.map((place) => ({
    name: place.name,
    description: place.description,
    imageUrl: place.imageUrl,
    longDescription: place.longDescription,
    galleryImageUrls: place.galleryImageUrls,
    order: place.order,
  }))
  const { data, error } = requestId
    ? await client.rpc('create_city_with_request_attractions', {
        p_request_id: requestId,
        p_city: cityPayload,
        p_places: placesPayload,
      })
    : await client.rpc('create_city_with_attractions', {
        p_city: cityPayload,
        p_places: placesPayload,
      })
  if (error) throw error
  return data
}
