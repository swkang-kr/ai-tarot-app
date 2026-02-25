import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/utils/admin'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: stats } = await supabase
      .from('daily_stats')
      .select('*')
      .order('stat_date', { ascending: false })
      .limit(30)

    const sortedStats = stats?.reverse() || []

    return NextResponse.json(sortedStats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    )
  }
}
