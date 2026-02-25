'use client'

import BottomNav from '@/components/BottomNav'
import AdBanner from '@/components/AdBanner'
import { Capacitor } from '@capacitor/core'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform()
  // BottomNav(5rem=80px) + 배너(60px) + safe area
  const pb = isNative
    ? 'calc(5rem + 60px + env(safe-area-inset-bottom, 0px))'
    : 'calc(5rem + env(safe-area-inset-bottom, 0px))'

  return (
    <>
      <div style={{ paddingBottom: pb }}>
        {children}
      </div>
      <BottomNav />
      <AdBanner />
    </>
  )
}
