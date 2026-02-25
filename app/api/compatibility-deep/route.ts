import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateDeepCompatibility } from '@/lib/ai/deep-compatibility-prompt'
import { getSajuInfo } from '@/lib/utils/saju'
import { isValidBirthDate } from '@/lib/utils/validation'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    // user may be null — continue regardless for anonymous access

    const { person1BirthDate, person1BirthHour, person2BirthDate, person2BirthHour, relationshipType } = await req.json()

    if (!isValidBirthDate(person1BirthDate) || !isValidBirthDate(person2BirthDate)) {
      return NextResponse.json(
        { error: '올바른 생년월일 형식(YYYY-MM-DD)을 입력해주세요' },
        { status: 400 }
      )
    }

    // Check cache only for logged-in users
    if (user) {
      let cacheQuery = supabase
        .from('deep_compatibility_readings')
        .select('*')
        .eq('user_id', user.id)
        .eq('person1_birth_date', person1BirthDate)
        .eq('person2_birth_date', person2BirthDate)
        .eq('relationship_type', relationshipType)

      if (person1BirthHour != null) {
        cacheQuery = cacheQuery.eq('person1_birth_hour', person1BirthHour)
      } else {
        cacheQuery = cacheQuery.is('person1_birth_hour', null)
      }
      if (person2BirthHour != null) {
        cacheQuery = cacheQuery.eq('person2_birth_hour', person2BirthHour)
      } else {
        cacheQuery = cacheQuery.is('person2_birth_hour', null)
      }

      const { data: cached } = await cacheQuery.limit(1)

      if (cached && cached.length > 0) {
        return NextResponse.json({ reading: cached[0].analysis, cached: true })
      }
    }

    const person1Saju = getSajuInfo(person1BirthDate, person1BirthHour ?? undefined)
    const person2Saju = getSajuInfo(person2BirthDate, person2BirthHour ?? undefined)

    const reading = await generateDeepCompatibility(
      person1Saju,
      person2Saju,
      relationshipType,
      person1BirthDate,
      person2BirthDate
    )

    // Only save to DB if logged in
    if (user) {
      const { error: saveError } = await supabase.from('deep_compatibility_readings').insert({
        user_id: user.id,
        person1_birth_date: person1BirthDate,
        person1_birth_hour: person1BirthHour ?? null,
        person2_birth_date: person2BirthDate,
        person2_birth_hour: person2BirthHour ?? null,
        relationship_type: relationshipType,
        analysis: reading,
      })

      if (saveError) {
        console.error('DeepCompatibility DB error:', saveError)
      }
    }

    return NextResponse.json({ reading, cached: false })
  } catch (error) {
    console.error('DeepCompatibility API error:', error)
    return NextResponse.json(
      { error: '심층 궁합 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
