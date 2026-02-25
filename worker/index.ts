/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

// ── Push 수신 → 알림 표시 ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json() as {
    title?: string
    body?: string
    url?: string
    icon?: string
  }

  const title = data.title ?? '🔮 AI 타로'
  const options: NotificationOptions = {
    body: data.body ?? '오늘의 운세를 확인해보세요 ✨',
    icon: data.icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'daily-fortune',   // 같은 tag면 기존 알림을 대체
    renotify: true,
    data: { url: data.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── 알림 클릭 → 앱 열기 ──────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl: string = (event.notification.data?.url as string) ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // 이미 열린 탭이 있으면 포커스
        const existing = windowClients.find((c) => c.url === targetUrl)
        if (existing) return existing.focus()
        // 없으면 새 탭
        return self.clients.openWindow(targetUrl)
      })
  )
})
