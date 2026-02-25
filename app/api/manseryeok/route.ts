import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateManseryeok } from '@/lib/ai/manseryeok-prompt'
import { getSajuInfo } from '@/lib/utils/saju'
import { isValidBirthDate, isValidBirthHour } from '@/lib/utils/validation'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // user may be null — continue regardless for anonymous access

    const { birthDate, birthHour, targetYear } = await req.json()

    if (!isValidBirthDate(birthDate)) {
      return NextResponse.json(
        { error: '올바른 생년월일 형식(YYYY-MM-DD)을 입력해주세요' },
        { status: 400 }
      )
    }
    if (!isValidBirthHour(birthHour)) {
      return NextResponse.json(
        { error: '올바른 태어난 시를 선택해주세요' },
        { status: 400 }
      )
    }

    const year = targetYear ?? new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCFullYear()
    const birthYear = parseInt(birthDate.split('-')[0], 10)
    const currentAge = year - birthYear

    // Check cache only for logged-in users
    if (user) {
      let cacheQuery = supabase
        .from('manseryeok_readings')
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
    const analysis = await generateManseryeok(birthDate, saju, year, currentAge)

    // Only save to DB if logged in
    if (user) {
      const { error: saveError } = await supabase.from('manseryeok_readings').insert({
        user_id: user.id,
        birth_date: birthDate,
        birth_hour: birthHour ?? null,
        target_year: year,
        analysis,
      })

      if (saveError) {
        console.error('Manseryeok DB error:', saveError)
      }
    }

    return NextResponse.json({ analysis, cached: false })
  } catch (error) {
    console.error('Manseryeok API error:', error)
    return NextResponse.json(
      { error: '만세력 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
