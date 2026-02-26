'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { initAdMob, showBanner } from '@/lib/ads/admob'

export default function AdBanner() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initAdMob().then(() => showBanner())
    }
  }, [])

  return null
}
