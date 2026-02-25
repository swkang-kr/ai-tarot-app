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

    const { data: users } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    )
  }
}
