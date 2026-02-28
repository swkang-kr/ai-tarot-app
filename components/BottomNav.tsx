'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getCurrentBannerHeight } from '@/lib/ads/admob'

const tabs = [
  { href: '/', icon: '🔮', label: '오늘' },
  { href: '/lucky', icon: '🍀', label: '행운' },
  { href: '/community', icon: '👥', label: '커뮤니티' },
  { href: '/dream', icon: '💭', label: '꿈해몽' },
  { href: '/premium', icon: '✨', label: '프리미엄' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [adBannerHeight, setAdBannerHeight] = useState(getCurrentBannerHeight)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    // AdMob 배너 높이 수신 (admob.ts에서 dispatchEvent로 전달)
    const handleBannerHeight = (e: Event) => {
      setAdBannerHeight((e as CustomEvent<number>).detail)
    }
    window.addEventListener('adBannerHeight', handleBannerHeight)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('adBannerHeight', handleBannerHeight)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // 결과/로딩 페이지에서는 숨김
  if (pathname.startsWith('/result/') || pathname.startsWith('/loading') || pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/callback')) {
    return null
  }

  const activeIndex = tabs.findIndex(
    (tab) => tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
  )

  const totalItems = tabs.length + 1 // 탭 5개 + 로그아웃 1개

  return (
    <nav className="fixed left-0 right-0 z-50 bg-[#1a1744]/90 backdrop-blur-xl border-t border-white/10" style={{ bottom: adBannerHeight, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-md mx-auto flex items-center justify-around h-16 relative">
        {/* 활성 탭 인디케이터 */}
        {activeIndex >= 0 && (
          <motion.div
            className="absolute top-0 h-0.5 bg-purple-400 rounded-full"
            style={{ width: `${100 / totalItems}%` }}
            animate={{ left: `${(activeIndex * 100) / totalItems}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        {tabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
                isActive ? 'text-purple-300' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <motion.span
                className="text-xl"
                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {tab.icon}
              </motion.span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}

        {/* 로그인/로그아웃 버튼 */}
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-white/40 hover:text-white/60 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="text-[10px] font-medium">로그아웃</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-white/40 hover:text-white/60 transition-colors"
          >
            <span className="text-xl">🔑</span>
            <span className="text-[10px] font-medium">로그인</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
