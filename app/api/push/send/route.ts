import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Vercel Cron은 GET 요청을 사용함
export async function GET(req: NextRequest) {
  // Authorization 헤더로 CRON_SECRET 검증
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return sendDailyNotifications()
}

// 수동 발송도 가능 (관리자용)
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  return sendDailyNotifications(body.title, body.body, body.url)
}

async function sendDailyNotifications(
  customTitle?: string,
  customBody?: string,
  customUrl?: string
) {
  const supabase = createAdminClient()

  // 모든 구독 조회
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')

  if (error) {
    console.error('[Push] DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0, failed: 0, message: 'No subscribers' })
  }

  const today = new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  const dateLabel = `${today.getUTCMonth() + 1}월 ${today.getUTCDate()}일`

  const payload = JSON.stringify({
    title: customTitle ?? `🔮 ${dateLabel} 오늘의 운세`,
    body: customBody ?? '오늘의 행운 색·방위·음식을 확인해보세요 ✨',
    url: customUrl ?? '/lucky',
    icon: '/icon-192.png',
  })

  const expiredIds: string[] = []

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        // 410 Gone / 404 = 구독 만료 → 삭제 대상
        if (statusCode === 410 || statusCode === 404) {
          expiredIds.push(sub.id)
        }
        throw err
      }
    })
  )

  // 만료된 구독 일괄 삭제
  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
    console.log(`[Push] Removed ${expiredIds.length} expired subscription(s)`)
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  console.log(`[Push] Sent: ${sent}, Failed: ${failed}, Removed: ${expiredIds.length}`)

  return NextResponse.json({ sent, failed, removed: expiredIds.length })
}
