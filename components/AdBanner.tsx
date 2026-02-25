'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { initAdMob, showBanner } from '@/lib/ads/admob'

export default function AdBanner() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // 네이티브 앱: 배너 공간 미리 확보
      document.body.classList.add('has-ad-banner')
      initAdMob().then(() => showBanner())
    }
  }, [])

  return null
}
