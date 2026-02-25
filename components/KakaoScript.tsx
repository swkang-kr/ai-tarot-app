'use client'

import Script from 'next/script'

export default function KakaoScript() {
  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      onLoad={() => {
        const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
        const Kakao = (window as any).Kakao
        if (key && Kakao && !Kakao.isInitialized()) {
          Kakao.init(key)
        }
      }}
    />
  )
}
