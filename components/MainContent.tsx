'use client'

import { useEffect, useState } from 'react'

const NAV_HEIGHT = 64 // BottomNav h-16 = 64px

export default function MainContent({ children }: { children: React.ReactNode }) {
  const [bannerHeight, setBannerHeight] = useState(0)

  useEffect(() => {
    const handler = (e: Event) => {
      setBannerHeight((e as CustomEvent<number>).detail)
    }
    window.addEventListener('adBannerHeight', handler)
    return () => window.removeEventListener('adBannerHeight', handler)
  }, [])

  return (
    <div style={{ paddingBottom: NAV_HEIGHT + bannerHeight }}>
      {children}
    </div>
  )
}
