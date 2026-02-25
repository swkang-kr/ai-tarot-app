import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { error } = await supabase
      .from('fortune_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // RLS 이중 보호

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post delete error:', error)
    return NextResponse.json({ error: '삭제에 실패했습니다' }, { status: 500 })
  }
}
