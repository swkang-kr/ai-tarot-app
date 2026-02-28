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
  title: '별빛 운세 - 오늘의 운세',
  description:
    '별빛 운세에서 오늘의 타로 운세를 확인하세요. 생년월일만 입력하면 사랑운, 재물운을 무료로 확인하세요.',
  keywords: ['타로', '타로카드', '오늘의운세', '무료타로', '별빛운세', '운세'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '별빛 운세'
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: '별빛 운세 - 오늘의 운세',
    description: '별빛 운세에서 오늘의 타로 운세를 확인하세요',
    siteName: '별빛 운세',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '별빛 운세'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '별빛 운세',
    description: '별빛 운세에서 오늘의 타로 운세를 확인하세요',
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
