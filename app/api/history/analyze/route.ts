import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateHistoryAnalysis } from '@/lib/ai/history-prompt'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 현재 월 기준 캐시 확인
    const periodLabel = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7) // KST "2026-02"
    const { data: cached } = await supabase
      .from('history_analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_label', periodLabel)
      .order('created_at', { ascending: false })
      .limit(1)

    if (cached && cached.length > 0) {
      return NextResponse.json({
        analysis: cached[0].analysis,
        readingCount: cached[0].reading_count,
        cached: true,
      })
    }

    // 최근 30개 readings 조회 (최대 90일)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: readings } = await supabase
      .from('readings')
      .select('birth_date, keywords, scores, created_at')
      .eq('user_id', user.id)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(30)

    if (!readings || readings.length < 3) {
      return NextResponse.json(
        { error: '분석에 필요한 운세 기록이 부족합니다. 최소 3개 이상의 기록이 필요합니다.' },
        { status: 400 }
      )
    }

    const birthDate = readings[0].birth_date
    const readingSummaries = readings.map((r) => ({
      date: r.created_at.split('T')[0],
      keywords: r.keywords ?? [],
      scores: r.scores ?? null,
    }))

    const analysis = await generateHistoryAnalysis(birthDate, readingSummaries, periodLabel)

    // 캐시 저장
    await supabase.from('history_analyses').insert({
      user_id: user.id,
      period_label: periodLabel,
      analysis,
      reading_count: readings.length,
    })

    return NextResponse.json({ analysis, readingCount: readings.length, cached: false })
  } catch (error) {
    console.error('History analyze API error:', error)
    return NextResponse.json(
      { error: '히스토리 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
