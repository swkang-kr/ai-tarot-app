import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateNewYearReading } from '@/lib/ai/new-year-prompt'
import { getSajuInfo } from '@/lib/utils/saju'
import { isValidBirthDate } from '@/lib/utils/validation'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    // user may be null — continue regardless for anonymous access

    const { birthDate, birthHour, targetYear } = await req.json()

    if (!isValidBirthDate(birthDate)) {
      return NextResponse.json(
        { error: '올바른 생년월일 형식(YYYY-MM-DD)을 입력해주세요' },
        { status: 400 }
      )
    }

    const year = targetYear ?? new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCFullYear()

    // Check cache only for logged-in users
    if (user) {
      let cacheQuery = supabase
        .from('new_year_readings')
        .select('*')
        .eq('user_id', user.id)
        .eq('birth_date', birthDate)
        .eq('target_year', year)

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

    const saju = getSajuInfo(birthDate, birthHour ?? undefined)

    const analysis = await generateNewYearReading(birthDate, saju, year)

    // Only save to DB if logged in
    if (user) {
      const { error: saveError } = await supabase.from('new_year_readings').insert({
        user_id: user.id,
        birth_date: birthDate,
        birth_hour: birthHour ?? null,
        target_year: year,
        analysis,
      })

      if (saveError) {
        console.error('NewYear DB error:', saveError)
      }
    }

    return NextResponse.json({ analysis, cached: false })
  } catch (error) {
    console.error('NewYear API error:', error)
    return NextResponse.json(
      { error: '신년운세 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
