'use client'

import { Suspense, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get('error')
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // 네이티브 앱 전용: MainActivity에서 dispatch한 OAuth 콜백 이벤트 처리
  // loadUrl(페이지 이동) 대신 JS에서 직접 code 교환 → 즉시 SIGNED_IN 발생
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleNativeOAuth = async (e: Event) => {
      const oauthUrl = (e as CustomEvent<string>).detail
      try {
        const url = new URL(oauthUrl)
        const code = url.searchParams.get('code')
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        }
      } catch (err) {
        console.error('[OAuth] code exchange 실패:', err)
      }
    }

    window.addEventListener('nativeOAuthCallback', handleNativeOAuth)
    return () => window.removeEventListener('nativeOAuthCallback', handleNativeOAuth)
  }, [])

  const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
    const isNative = Capacitor.isNativePlatform()

    if (isNative) {
      // 네이티브 앱: Chrome Custom Tab으로 OAuth 진행
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'com.aitarot.app://auth/callback',
          skipBrowserRedirect: true,
          ...(provider === 'kakao' && { scopes: 'profile_nickname profile_image' })
        }
      })
      if (data?.url) {
        await Browser.open({ url: data.url })
      }
    } else {
      // 웹: 기존 방식
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
          ...(provider === 'kakao' && { scopes: 'profile_nickname profile_image' })
        }
      })
    }
  }

  return (
    <div className="flex items-center justify-center p-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔮</div>
          <h1 className="text-3xl font-bold text-white mb-2">AI 타로</h1>
          <p className="text-purple-200">로그인하고 오늘의 운세를 확인하세요</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOAuthLogin('kakao')}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-gray-800 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 3C5.58 3 2 5.79 2 9.25c0 2.17 1.44 4.08 3.62 5.18l-.93 3.4c-.08.28.25.5.49.33l3.96-2.62c.28.03.57.05.86.05 4.42 0 8-2.79 8-6.25S14.42 3 10 3z"
                fill="#3C1E1E"
              />
            </svg>
            카카오로 시작하기
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path
                d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5a4.8 4.8 0 01-2.05 3.12v2.5h3.28c1.93-1.77 3.05-4.4 3.05-7.29z"
                fill="#4285F4"
              />
              <path
                d="M10 20c2.7 0 4.96-.9 6.62-2.4l-3.23-2.5c-.9.6-2.04.95-3.4.95-2.6 0-4.8-1.76-5.6-4.12H1.07v2.6A9.99 9.99 0 0010 20z"
                fill="#34A853"
              />
              <path
                d="M4.4 12.02A6.02 6.02 0 014.07 10c0-.7.12-1.38.32-2.02V5.38H1.07A9.99 9.99 0 000 10c0 1.61.39 3.14 1.07 4.5l3.33-2.5z"
                fill="#FBBC05"
              />
              <path
                d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.85-2.85C14.96.99 12.7 0 10 0 6.09 0 2.71 2.24 1.07 5.5l3.33 2.5c.8-2.37 3-4.04 5.6-4.04z"
                fill="#EA4335"
              />
            </svg>
            Google로 시작하기
          </motion.button>
        </div>

        <p className="mt-6 text-center text-purple-300 text-xs">
          로그인 시{' '}
          <a href="/privacy" className="underline hover:text-purple-200">
            개인정보처리방침
          </a>
          에 동의하는 것으로 간주됩니다
        </p>
      </motion.div>
    </div>
  )
}
