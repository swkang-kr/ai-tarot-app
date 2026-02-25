import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateDreamReading } from '@/lib/ai/dream-prompt'
import { isValidDreamCategory, MAX_DREAM_CONTENT_LENGTH } from '@/lib/utils/validation'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // user may be null — continue regardless for anonymous access

    const { dreamContent, category } = await req.json()

    if (!dreamContent || typeof dreamContent !== 'string' || dreamContent.trim().length < 10) {
      return NextResponse.json(
        { error: '꿈 내용을 10자 이상 입력해주세요' },
        { status: 400 }
      )
    }

    if (dreamContent.length > MAX_DREAM_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `꿈 내용은 ${MAX_DREAM_CONTENT_LENGTH}자 이내로 입력해주세요` },
        { status: 400 }
      )
    }

    if (!isValidDreamCategory(category)) {
      return NextResponse.json(
        { error: '올바른 카테고리를 선택해주세요' },
        { status: 400 }
      )
    }

    // Generate dream reading
    const reading = await generateDreamReading(dreamContent.trim(), category || undefined)

    // Only save to DB if logged in
    if (user) {
      const { data: saved, error: saveError } = await supabase
        .from('dream_readings')
        .insert({
          user_id: user.id,
          dream_content: dreamContent.trim(),
          category: category || null,
          interpretation: reading,
        })
        .select()
        .single()

      if (saveError) {
        console.error('Dream DB error:', saveError)
      } else {
        return NextResponse.json({ reading, readingId: saved.id, saved: true })
      }
    }

    return NextResponse.json({ reading, saved: false })
  } catch (error) {
    console.error('Dream API error:', error)
    return NextResponse.json(
      { error: '꿈해몽 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
