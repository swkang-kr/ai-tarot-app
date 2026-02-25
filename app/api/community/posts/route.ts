import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

const PAGE_SIZE = 20

// C3, C4 수정: 허용 값 목록으로 입력 검증
const VALID_FORTUNE_TYPES = new Set(['tarot', 'saju', 'lucky', 'dream', 'general'])
const VALID_KEYWORDS = new Set(['사랑', '연애', '직업', '재물', '건강', '인연', '이사', '시험', '가족', '금전'])

// M8 수정: KST(UTC+9) 기준 오늘 날짜
function getKSTDateString(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword')

    // M4 수정: page 파라미터 검증
    const rawPage = parseInt(searchParams.get('page') ?? '0')
    const page = isNaN(rawPage) || rawPage < 0 ? 0 : rawPage

    const admin = createAdminClient()

    let query = admin
      .from('fortune_posts')
      .select('id, user_id, is_anonymous, display_name, content, keywords, fortune_type, heart_count, empathy_count, same_count, created_at')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (keyword && keyword !== '전체' && VALID_KEYWORDS.has(keyword)) {
      query = query.contains('keywords', [keyword])
    }

    const { data: posts, error } = await query

    if (error) throw error

    // 로그인 사용자면 내 반응도 조회
    const { data: { user } } = await supabase.auth.getUser()
    let myReactions: Record<string, string> = {}

    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id)
      const { data: reactions } = await admin
        .from('fortune_post_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', postIds)

      if (reactions) {
        myReactions = Object.fromEntries(reactions.map((r) => [r.post_id, r.reaction_type]))
      }
    }

    const enriched = (posts ?? []).map((post) => {
      const { user_id, ...safePost } = post as typeof post & { user_id: string }
      return {
        ...safePost,
        my_reaction: myReactions[safePost.id] ?? null,
        is_mine: user ? user_id === user.id : false,
      }
    })

    return NextResponse.json({ posts: enriched, hasMore: (posts?.length ?? 0) === PAGE_SIZE })
  } catch (error) {
    console.error('Community GET error:', error)
    return NextResponse.json({ error: '피드를 불러오는 중 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { content, keywords, fortuneType, isAnonymous, displayName } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })
    }
    if (content.length > 200) {
      return NextResponse.json({ error: '내용은 200자 이내로 작성해주세요' }, { status: 400 })
    }

    // C3 수정: fortune_type 서버사이드 검증
    const safeFortuneType = fortuneType ?? 'general'
    if (!VALID_FORTUNE_TYPES.has(safeFortuneType)) {
      return NextResponse.json({ error: '잘못된 운세 유형입니다' }, { status: 400 })
    }

    // C4 수정: keywords 배열 및 허용 값 검증
    const safeKeywords = keywords ?? []
    if (
      !Array.isArray(safeKeywords) ||
      safeKeywords.length > 5 ||
      safeKeywords.some((k: unknown) => typeof k !== 'string' || !VALID_KEYWORDS.has(k))
    ) {
      return NextResponse.json({ error: '잘못된 키워드입니다' }, { status: 400 })
    }

    const admin = createAdminClient()

    // M8 수정: KST 기준 하루 3개 제한
    const today = getKSTDateString()
    const { count } = await admin
      .from('fortune_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00+09:00`)

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: '오늘 공유 횟수(3회)를 모두 사용했습니다' }, { status: 429 })
    }

    const { data: post, error } = await admin.from('fortune_posts').insert({
      user_id: user.id,
      is_anonymous: isAnonymous ?? true,
      display_name: isAnonymous ? null : (displayName ?? null),
      content: content.trim(),
      keywords: safeKeywords,
      fortune_type: safeFortuneType,
    }).select().single()

    if (error) throw error

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Community POST error:', error)
    return NextResponse.json({ error: '공유 중 오류가 발생했습니다' }, { status: 500 })
  }
}
