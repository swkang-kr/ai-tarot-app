import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.byeolbit.unse',
  appName: '별빛 운세',
  webDir: 'out',
  server: {
    // 배포된 웹 URL (SSR 유지, Vercel 등)
    // 로컬 개발 시 아래 줄 주석 해제:
    // url: 'http://localhost:3000',
    url: process.env.CAPACITOR_SERVER_URL || 'https://tarot.trendhunt.net',
    cleartext: false,
    // OAuth 관련 도메인을 WebView 내부에서 처리 (외부 브라우저 차단)
    allowNavigation: [
      'tarot.trendhunt.net',
      '*.supabase.co',
      'accounts.google.com',
      '*.google.com',
      'kauth.kakao.com',
      '*.kakao.com',
    ],
  },
  plugins: {
    AdMob: {
      // Google AdMob 콘솔에서 발급받은 App ID
      Android: 'ca-app-pub-6554444153753287~7134935008',
      iOS: 'ca-app-pub-6554444153753287~3495072893'
    },
  },
}

export default config
