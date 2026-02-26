'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TarotCard from '@/components/TarotCard'
import SajuCard from '@/components/SajuCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import { getSajuInfo, type SajuInfo } from '@/lib/utils/saju'
import { motion } from 'framer-motion'

interface ReadingRow {
  id: string
  user_id: string
  birth_date: string
  birth_hour?: number | null
  keywords: string[]
  overall: string
  love: string
  wealth: string
  health?: string | null
  career?: string | null
  advice?: string | null
  lucky_color: string
  lucky_number: number
  saju_analysis?: string | null
  scores?: { overall: number; love: number; wealth: number; health: number; career: number } | null
  time_of_day?: { morning: string; afternoon: string; evening: string } | null
  lucky_items?: { color: string; colorName: string; number: number; food: string; direction: string; activity: string } | null
  warning?: string | null
  share_count: number
  view_count: number
  created_at: string
}

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const [reading, setReading] = useState<ReadingRow | null>(null)
  const [saju, setSaju] = useState<SajuInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadReading()
  }, [params.id])

  const loadReading = async () => {
    try {
      // 인증 확인 — 비로그인 시 안내 표시
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setReading(null)
        setLoading(false)
        return
      }

      // 소유자 확인 — user_id 조건 추가로 타인의 결과 조회 차단
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        setReading(null)
        setLoading(false)
        return
      }

      setReading(data)

      // Calculate saju from birth_date
      try {
        const sajuInfo = getSajuInfo(data.birth_date, data.birth_hour ?? undefined)
        setSaju(sajuInfo)
      } catch (e) {
        console.error('Saju calculation error:', e)
      }

      // C2: view_count 원자적 증가 (read-then-write 레이스 컨디션 방지)
      // increment_view_count SQL 함수가 없어도 동작하도록 에러 무시
      try { await supabase.rpc('increment_view_count', { reading_id: data.id }) } catch { /* 함수 없으면 무시 */ }
    } catch (error) {
      console.error('Error loading reading:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingAnimation />
  }

  if (!reading) {
    return (
      <div className="p-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">🔮</div>
            <h2 className="text-xl font-bold text-white mb-2">운세를 찾을 수 없습니다</h2>
            <p className="text-purple-200 text-sm mb-6">
              로그인이 필요하거나 존재하지 않는 결과입니다
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/login"
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-400 transition"
              >
                로그인하기
              </a>
              <a
                href="/"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition"
              >
                홈으로
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <TarotCard reading={reading} />
        </motion.div>

        {saju && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <SajuCard saju={saju} analysis={reading.saju_analysis} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <a
            href="/"
            className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
          >
            🔮 처음으로 돌아가기
          </a>
        </motion.div>
      </div>
    </div>
  )
}
