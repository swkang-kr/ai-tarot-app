import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateTarotReading } from '@/lib/ai/claude'
import { getCachedReading } from '@/lib/utils/cache'
import { getSajuInfo } from '@/lib/utils/saju'
import { isValidBirthDate } from '@/lib/utils/validation'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user }
    } = await supabase.auth.getUser()
    // user may be null — anonymous access allowed

    const { birthDate, birthHour, selectedCards } = await req.json()

    if (!isValidBirthDate(birthDate)) {
      return NextResponse.json(
        { error: '올바른 생년월일 형식(YYYY-MM-DD)을 입력해주세요' },
        { status: 400 }
      )
    }

    // Cache check (logged-in users only)
    if (user) {
      const cached = await getCachedReading(user.id, birthDate, birthHour)
      if (cached) {
        console.log('Cache hit - returning existing reading')
        return NextResponse.json({
          readingId: cached.id,
          cached: true
        })
      }
    }

    // Calculate saju (Four Pillars)
    const saju = getSajuInfo(birthDate, birthHour ?? undefined)
    console.log('[Saju] Calculated:', saju.yearPillar, saju.monthPillar, saju.dayPillar, saju.hourPillar || '(no hour)')

    // Step 1: Claude text generation
    console.log('[Step 1/2] Generating reading with Claude...')
    let reading
    try {
      reading = await generateTarotReading(birthDate, selectedCards, saju)
      console.log('[Step 1/2] Claude OK - keywords:', reading.keywords, selectedCards ? `(with ${selectedCards.length} selected cards)` : '')
    } catch (claudeError) {
      console.error('[Step 1/2] Claude FAILED:', claudeError)
      throw new Error(`Claude API 실패: ${claudeError instanceof Error ? claudeError.message : String(claudeError)}`)
    }

    const generationTime = Date.now() - startTime

    // Step 2: Save to DB (logged-in users only)
    if (user) {
      console.log('[Step 2/2] Saving to database...')
      const { data: savedReading, error: saveError } = await supabase
        .from('readings')
        .insert({
          user_id: user.id,
          birth_date: birthDate,
          birth_hour: birthHour ?? null,
          keywords: reading.keywords,
          overall: reading.overall,
          love: reading.love,
          wealth: reading.wealth,
          health: reading.health || null,
          career: reading.career || null,
          advice: reading.advice || null,
          saju_analysis: reading.sajuAnalysis || null,
          lucky_color: reading.luckyItems?.color || '#667eea',
          lucky_number: reading.luckyItems?.number || 7,
          scores: reading.scores || null,
          time_of_day: reading.timeOfDay || null,
          lucky_items: reading.luckyItems || null,
          warning: reading.warning || null,
          image_url: null,
          generation_time_ms: generationTime,
          client_ip: getClientIp(req)
        })
        .select()
        .single()

      if (saveError) {
        console.error('[Step 2/2] DB FAILED:', saveError)
        throw saveError
      }
      console.log('[Step 2/2] DB OK')
      console.log(`Reading generated in ${generationTime}ms`)

      return NextResponse.json({
        readingId: savedReading.id,
        cached: false
      })
    }

    // Anonymous: return reading data directly (no DB save)
    console.log(`[Anonymous] Reading generated in ${generationTime}ms`)
    return NextResponse.json({
      reading: {
        birth_date: birthDate,
        birth_hour: birthHour ?? null,
        keywords: reading.keywords,
        overall: reading.overall,
        love: reading.love,
        wealth: reading.wealth,
        health: reading.health || null,
        career: reading.career || null,
        advice: reading.advice || null,
        saju_analysis: reading.sajuAnalysis || null,
        lucky_color: reading.luckyItems?.color || '#667eea',
        lucky_number: reading.luckyItems?.number || 7,
        scores: reading.scores || null,
        time_of_day: reading.timeOfDay || null,
        lucky_items: reading.luckyItems || null,
        warning: reading.warning || null,
        created_at: new Date().toISOString(),
      },
      cached: false
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: '운세 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
