import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

type ReactionType = 'heart' | 'empathy' | 'same'

// M2 수정: UUID 형식 검증
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { reactionType } = await req.json() as { reactionType: ReactionType }
    if (!['heart', 'empathy', 'same'].includes(reactionType)) {
      return NextResponse.json({ error: '잘못된 반응 유형입니다' }, { status: 400 })
    }

    const postId = params.id
    if (!UUID_REGEX.test(postId)) {
      return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
    }

    const admin = createAdminClient()

    // C2 수정: 원자적 RPC 사용 (FOR UPDATE 잠금으로 경쟁 조건 제거)
    const { data, error } = await admin.rpc('toggle_post_reaction', {
      p_post_id: postId,
      p_user_id: user.id,
      p_reaction_type: reactionType,
    })

    if (error) throw error

    const result = data as {
      success?: boolean
      error?: string
      heartCount: number
      empathyCount: number
      sameCount: number
      myReaction: ReactionType | null
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      heartCount: result.heartCount,
      empathyCount: result.empathyCount,
      sameCount: result.sameCount,
      myReaction: result.myReaction,
    })
  } catch (error) {
    console.error('React API error:', error)
    return NextResponse.json({ error: '반응 처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
