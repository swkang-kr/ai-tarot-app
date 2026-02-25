'use client'

import { useEffect } from 'react'
import { initAdMob, showBanner } from '@/lib/ads/admob'

export default function AdBanner() {
  useEffect(() => {
    initAdMob().then(() => showBanner())
  }, [])

  // 배너는 네이티브 오버레이로 표시됨 (DOM 요소 불필요)
  return null
}
