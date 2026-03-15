import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateCompatibilityReading } from '@/lib/ai/compatibility-prompt'
import { getSajuInfo, getCrossCompatibilityRelations, getDetailedAnalysis } from '@/lib/utils/saju'
import { isValidBirthDate, isValidRelationshipType } from '@/lib/utils/validation'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // user may be null — continue regardless for anonymous access

    const { person1BirthDate, person1BirthHour, person2BirthDate, person2BirthHour, relationshipType, person1Gender, person2Gender } = await req.json()

    if (!isValidBirthDate(person1BirthDate) || !isValidBirthDate(person2BirthDate)) {
      return NextResponse.json(
        { error: '올바른 생년월일 형식(YYYY-MM-DD)을 입력해주세요' },
        { status: 400 }
      )
    }

    if (!isValidRelationshipType(relationshipType)) {
      return NextResponse.json(
        { error: '올바른 관계 유형을 선택해주세요' },
        { status: 400 }
      )
    }

    // Calculate saju for both persons
    const person1Saju = getSajuInfo(person1BirthDate, person1BirthHour ?? undefined)
    const person2Saju = getSajuInfo(person2BirthDate, person2BirthHour ?? undefined)
    const crossRelations = getCrossCompatibilityRelations(person1Saju, person2Saju)
    const person1Detail = getDetailedAnalysis(person1Saju)
    const person2Detail = getDetailedAnalysis(person2Saju)

    // Generate compatibility reading
    const reading = await generateCompatibilityReading(
      person1Saju,
      person2Saju,
      relationshipType,
      crossRelations,
      { person1: person1Detail.bodyStrength, person2: person2Detail.bodyStrength },
      { person1: person1Gender ?? null, person2: person2Gender ?? null }
    )

    // Only save to DB if logged in
    if (user) {
      const { data: saved, error: saveError } = await supabase
        .from('compatibility_readings')
        .insert({
          user_id: user.id,
          person1_birth_date: person1BirthDate,
          person1_birth_hour: person1BirthHour ?? null,
          person2_birth_date: person2BirthDate,
          person2_birth_hour: person2BirthHour ?? null,
          relationship_type: relationshipType,
          scores: reading.scores,
          analysis: reading,
        })
        .select()
        .single()

      if (saveError) {
        console.error('Compatibility DB error:', saveError)
      } else {
        return NextResponse.json({ reading, readingId: saved.id, saved: true })
      }
    }

    return NextResponse.json({ reading, saved: false })
  } catch (error) {
    console.error('Compatibility API error:', error)
    return NextResponse.json(
      { error: '궁합 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
