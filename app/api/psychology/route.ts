import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generatePsychologyReading } from '@/lib/ai/psychology-prompt'
import { getSajuInfo, getDetailedAnalysis } from '@/lib/utils/saju'
import { isValidBirthDate, isValidBirthHour } from '@/lib/utils/validation'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // user may be null — continue regardless for anonymous access

    const { birthDate, birthHour } = await req.json()

    if (!isValidBirthDate(birthDate)) {
      return NextResponse.json(
        { error: '올바른 생년월일 형식(YYYY-MM-DD)을 입력해주세요' },
        { status: 400 }
      )
    }

    if (!isValidBirthHour(birthHour)) {
      return NextResponse.json(
        { error: '올바른 태어난 시간을 선택해주세요' },
        { status: 400 }
      )
    }

    // Check cache only for logged-in users
    if (user) {
      let cacheQuery = supabase
        .from('psychology_readings')
        .select('*')
        .eq('user_id', user.id)
        .eq('birth_date', birthDate)

      if (birthHour != null) {
        cacheQuery = cacheQuery.eq('birth_hour', birthHour)
      } else {
        cacheQuery = cacheQuery.is('birth_hour', null)
      }

      const { data: cached } = await cacheQuery.limit(1)

      if (cached && cached.length > 0) {
        return NextResponse.json({ analysis: cached[0].analysis, cached: true })
      }
    }

    const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
    const saju = getSajuInfo(birthDate, birthHour ?? undefined)
    const detail = getDetailedAnalysis(saju)

    const analysis = await generatePsychologyReading(birthDate, today, saju, detail)

    // Only save to DB if logged in
    if (user) {
      const { error: saveError } = await supabase.from('psychology_readings').insert({
        user_id: user.id,
        birth_date: birthDate,
        birth_hour: birthHour ?? null,
        analysis,
      })

      if (saveError) {
        console.error('Psychology DB error:', saveError)
      }
    }

    return NextResponse.json({ analysis, cached: false })
  } catch (error) {
    console.error('Psychology API error:', error)
    return NextResponse.json(
      { error: '사주 심리 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
