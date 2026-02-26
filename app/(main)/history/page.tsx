'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import HistoryAnalysisCard from '@/components/HistoryAnalysisCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import type { HistoryAnalysisResponse } from '@/lib/ai/history-prompt'

interface ReadingRow {
  id: string
  birth_date: string
  keywords: string[]
  overall: string
  lucky_color: string
  created_at: string
}

export default function HistoryPage() {
  const supabase = createClient()

  const [readings, setReadings] = useState<ReadingRow[]>([])
  const [analysis, setAnalysis] = useState<HistoryAnalysisResponse | null>(null)
  const [readingCount, setReadingCount] = useState(0)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)

  useEffect(() => {
    loadPage()
  }, [])

  const loadPage = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setNeedsLogin(true)
      setPageLoading(false)
      return
    }

    const { data } = await supabase
      .from('readings')
      .select('id, birth_date, keywords, overall, lucky_color, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setReadings(data ?? [])
    setPageLoading(false)

    loadAnalysis()
  }

  const loadAnalysis = async () => {
    setLoadingAnalysis(true)
    setError(null)


    try {
      const res = await fetch('/api/history/analyze')
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || '분석 중 오류가 발생했습니다')
        return
      }
      const d = await res.json()
      setAnalysis(d.analysis)
      setReadingCount(d.readingCount ?? 0)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoadingAnalysis(false)
    }
  }

  if (pageLoading) return <LoadingAnimation />

  if (needsLogin) {
    return (
      <div className="p-4 py-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center"
          >
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-white mb-2">운세 히스토리</h2>
            <p className="text-purple-200 text-sm mb-6">
              로그인하면 운세 기록을 저장하고<br />AI 트렌드 분석을 받을 수 있습니다
            </p>
            <a
              href="/login"
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition"
            >
              로그인하기
            </a>
            <div className="mt-4">
              <a href="/" className="text-purple-300 text-sm hover:text-purple-200 transition">
                홈으로 돌아가기
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* 헤더 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">📊 운세 히스토리</h1>
          <p className="text-purple-300 text-sm">
            전체 기록 · AI 트렌드 분석
          </p>
        </motion.div>

        {/* AI 트렌드 분석 섹션 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {loadingAnalysis ? (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <div className="flex items-center gap-3 text-purple-300">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">운세 패턴을 분석하는 중...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
              {readings.length >= 3 && (
                <button onClick={loadAnalysis} className="mt-2 text-purple-300 text-xs underline">
                  다시 시도
                </button>
              )}
            </div>
          ) : analysis ? (
            <HistoryAnalysisCard analysis={analysis} readingCount={readingCount || readings.length} />
          ) : null}
        </motion.div>

        {/* 기록 목록 */}
        {readings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-5"
          >
            <h2 className="text-white font-semibold text-sm mb-4">
              전체 기록 ({readings.length}개)
            </h2>
            <div className="space-y-2">
              {readings.map((reading, idx) => (
                <motion.a
                  key={reading.id}
                  href={`/result/${reading.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                    style={{ background: `linear-gradient(135deg, ${reading.lucky_color}44, #312e8166)` }}
                  >
                    🔮
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {reading.keywords.slice(0, 2).map((kw: string, i: number) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-purple-500/30 text-purple-200 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-white/60 text-xs truncate">{reading.overall}</p>
                  </div>
                  <span className="text-purple-300/70 text-xs flex-shrink-0">
                    {format(new Date(reading.created_at), 'M/d', { locale: ko })}
                  </span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
            <p className="text-white/60 text-sm">아직 운세 기록이 없습니다.</p>
            <a href="/" className="mt-3 inline-block text-purple-300 text-sm underline">
              첫 운세 보러 가기
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
