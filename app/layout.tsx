import { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import KakaoScript from '@/components/KakaoScript'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8b5cf6'
}

export const metadata: Metadata = {
  title: 'AI 타로 - 오늘의 운세',
  description:
    'AI가 읽어주는 오늘의 타로 운세. 생년월일만 입력하면 사랑운, 재물운을 무료로 확인하세요.',
  keywords: ['타로', '타로카드', '오늘의운세', '무료타로', 'AI타로', '운세'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI 타로'
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'AI 타로 - 오늘의 운세',
    description: 'AI가 읽어주는 오늘의 타로 운세',
    siteName: 'AI 타로',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI 타로'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 타로',
    description: 'AI가 읽어주는 오늘의 타로 운세',
    images: ['/og-image.png']
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body>
        {children}
        <Analytics />
        <KakaoScript />
      </body>
    </html>
  )
}
