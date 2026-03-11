import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateWeeklyReading } from '@/lib/ai/weekly-prompt'
import { getSajuInfo, getDetailedAnalysis } from '@/lib/utils/saju'
import { isValidBirthDate } from '@/lib/utils/validation'

function getWeekDates(): { weekStart: string; dates: string[] } {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  const dayOfWeek = now.getUTCDay() // 0=Sun, 1=Mon (use UTC methods on KST-shifted date)
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7))

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  return { weekStart: dates[0], dates }
}

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

    const { weekStart, dates } = getWeekDates()

    // Check cache only for logged-in users
    if (user) {
      const { data: existingReading } = await supabase
        .from('weekly_readings')
        .select('*')
        .eq('user_id', user.id)
        .eq('birth_date', birthDate)
        .eq('week_start', weekStart)
        .limit(1)

      if (existingReading && existingReading.length > 0) {
        return NextResponse.json({
          reading: existingReading[0].analysis,
          readingId: existingReading[0].id,
          cached: true,
        })
      }
    }

    // Calculate saju
    const saju = getSajuInfo(birthDate, birthHour ?? undefined)
    const detailed = getDetailedAnalysis(saju)

    // Generate weekly reading
    const reading = await generateWeeklyReading(birthDate, saju, weekStart, dates, detailed.bodyStrength)

    // Only save to DB if logged in
    if (user) {
      const { data: saved, error: saveError } = await supabase
        .from('weekly_readings')
        .insert({
          user_id: user.id,
          birth_date: birthDate,
          week_start: weekStart,
          analysis: reading,
        })
        .select()
        .single()

      if (saveError) {
        console.error('Weekly DB error:', saveError)
      } else {
        return NextResponse.json({ reading, readingId: saved.id, cached: false })
      }
    }

    return NextResponse.json({ reading, cached: false })
  } catch (error) {
    console.error('Weekly API error:', error)
    return NextResponse.json(
      { error: '주간 운세 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
