'use client'

import { createClient } from '@/lib/supabase/client'
import { Instagram, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { generateShareImages } from '@/lib/utils/share-image'

interface ShareReading {
  id: string
  user_id: string
  keywords: string[]
  overall: string
  love: string
  wealth: string
  lucky_number: number
  lucky_color: string
  scores?: { overall: number; love: number; wealth: number; health: number; career: number } | null
  time_of_day?: { morning: string; afternoon: string; evening: string } | null
  lucky_items?: { color: string; colorName: string; number: number; food: string; direction: string; activity: string } | null
}

interface ShareButtonsProps {
  reading: ShareReading
}

export default function ShareButtons({ reading }: ShareButtonsProps) {
  const [sharing, setSharing] = useState(false)
  const supabase = createClient()

  const trackShare = async (platform: string) => {
    await supabase.from('shares').insert({
      reading_id: reading.id,
      user_id: reading.user_id,
      platform
    })
  }

  const shareToInstagram = async () => {
    setSharing(true)
    try {
      const files = await generateShareImages(reading)

      if (navigator.share && navigator.canShare?.({ files })) {
        await navigator.share({
          files,
          title: '오늘의 AI 타로 운세',
          text: `${reading.keywords.join(' ')} - ${reading.overall}`
        })
        await trackShare('instagram')
      } else {
        // 폴백: 이미지 순서대로 다운로드
        for (const file of files) {
          const url = URL.createObjectURL(file)
          const a = document.createElement('a')
          a.href = url
          a.download = file.name
          a.click()
          URL.revokeObjectURL(url)
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    } finally {
      setSharing(false)
    }
  }

  const shareToKakao = async () => {
    const Kakao = (window as any).Kakao
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const resultUrl = `${appUrl}/result/${reading.id}`

    // SDK 미로드 또는 초기화 실패 — URL 공유 폴백
    if (!Kakao?.isInitialized()) {
      const url = `https://sharer.kakao.com/talk/friends/picker/link?app_key=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&validation_action=default&validation_params={"link_ver":"4.0","link_params":{"link_url":"${encodeURIComponent(resultUrl)}"}}`
      window.open(url, '_blank', 'width=500,height=600')
      return
    }

    try {
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `🔮 오늘의 AI 타로: ${reading.keywords.join(' ')}`,
          description: `✨ ${reading.overall.slice(0, 60)}...`,
          imageUrl: `${appUrl}/api/og/${reading.id}`,
          link: {
            mobileWebUrl: resultUrl,
            webUrl: resultUrl
          }
        },
        buttons: [
          {
            title: '내 운세도 보기',
            link: { mobileWebUrl: appUrl, webUrl: appUrl }
          },
          {
            title: '결과 보기',
            link: { mobileWebUrl: resultUrl, webUrl: resultUrl }
          }
        ]
      })
      await trackShare('kakao')
    } catch (err) {
      console.error('Kakao share failed:', err)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
      <button
        onClick={shareToInstagram}
        disabled={sharing}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 whitespace-nowrap"
      >
        <Instagram size={20} />
        {sharing ? '생성중...' : '인스타그램'}
      </button>

      <button
        onClick={shareToKakao}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 text-gray-800 rounded-xl font-medium hover:shadow-lg transition whitespace-nowrap"
      >
        <MessageCircle size={20} />
        카카오톡
      </button>
    </div>
  )
}
