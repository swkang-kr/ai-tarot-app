import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getCachedReading(userId: string, birthDate: string, birthHour?: number | null) {
  const supabase = createRouteHandlerClient({ cookies })
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]

  let query = supabase
    .from('readings')
    .select('*')
    .eq('user_id', userId)
    .eq('birth_date', birthDate)
    .gte('created_at', `${today}T00:00:00+09:00`)
    .lte('created_at', `${today}T23:59:59+09:00`)

  if (birthHour != null) {
    query = query.eq('birth_hour', birthHour)
  } else {
    query = query.is('birth_hour', null)
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1)

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0]
}
