'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    href: '/history',
    icon: '📊',
    title: '히스토리 분석',
    desc: '지난 운세 기록을 AI가 분석해 반복 패턴과 트렌드를 알려드립니다',
    tags: ['패턴 분석', '트렌드'],
    color: 'from-violet-500/20 to-purple-500/15',
    border: 'border-violet-500/20',
  },
  {
    href: '/deep-saju',
    icon: '🏯',
    title: '심층 사주',
    desc: '용신·격국·대운 분석으로 삶의 큰 흐름과 운명적 패턴을 파악합니다',
    tags: ['용신', '대운', '인생 패턴'],
    color: 'from-amber-500/20 to-orange-500/15',
    border: 'border-amber-500/20',
  },
  {
    href: '/annual',
    icon: '📆',
    title: '연간 운세',
    desc: '올해 12개월 월별 운세와 최고의 달, 분야별 피크 시기를 알려드립니다',
    tags: ['12개월', '월별 점수', '피크 시기'],
    color: 'from-sky-500/20 to-blue-500/15',
    border: 'border-sky-500/20',
  },
  {
    href: '/biorhythm',
    icon: '〰️',
    title: '바이오리듬',
    desc: '오늘의 신체·감성·지성 리듬을 계산하고 30일 흐름 차트로 확인하세요',
    tags: ['신체 리듬', '감성 리듬', '지성 리듬'],
    color: 'from-indigo-500/20 to-purple-500/15',
    border: 'border-indigo-500/20',
  },
  {
    href: '/psychology',
    icon: '🔮',
    title: '사주 심리 분석',
    desc: '사주팔자로 알아보는 나만의 심리 유형 — MBTI를 대체하는 사주 성격 분석',
    tags: ['심리 유형', '강점/약점', '소통 방식'],
    color: 'from-violet-500/20 to-fuchsia-500/15',
    border: 'border-violet-500/20',
  },
  {
    href: '/manseryeok',
    icon: '📜',
    title: '만세력',
    desc: '대운·세운·월운 타임라인으로 삶의 10년 주기 흐름을 한눈에 파악합니다',
    tags: ['대운', '세운', '월운 12개월'],
    color: 'from-teal-500/20 to-cyan-500/15',
    border: 'border-teal-500/20',
  },
  {
    href: '/tojeong',
    icon: '☯️',
    title: '토정비결',
    desc: '이토정의 144괘로 올 한 해 운세를 전통 방식으로 풀이해드립니다',
    tags: ['144괘', '분기별 운세', '분야 조언'],
    color: 'from-orange-500/20 to-amber-500/15',
    border: 'border-orange-500/20',
  },
  {
    href: '/new-year',
    icon: '🎊',
    title: '신년운세',
    desc: '새해 간지와 사주의 상호작용으로 12개월 운세와 4대 분야 조언을 드립니다',
    tags: ['12개월', '4대 분야', '행운 아이템'],
    color: 'from-red-500/20 to-rose-500/15',
    border: 'border-red-500/20',
  },
  {
    href: '/compatibility-deep',
    icon: '💕',
    title: '심층 궁합',
    desc: '오행 심층 분석 · 갈등/조화 포인트 · 12개월 궁합 흐름 · 5년 관계 전망',
    tags: ['오행 분석', '갈등/조화', '5년 전망'],
    color: 'from-pink-500/20 to-rose-500/15',
    border: 'border-pink-500/20',
  },
  {
    href: '/career-saju',
    icon: '🚀',
    title: '직업·적성 분석',
    desc: '사주 기반 커리어 추천 — 적성 유형, 추천 직군 TOP5, 커리어 타임라인',
    tags: ['적성 유형', '추천 직군', '커리어 흐름'],
    color: 'from-blue-500/20 to-sky-500/15',
    border: 'border-blue-500/20',
  },
  {
    href: '/wealth-saju',
    icon: '💰',
    title: '재물운 심층 분석',
    desc: '재성·식상 분석으로 보는 재물 패턴 · 투자 스타일 · 12개월 재물 흐름',
    tags: ['재물 유형', '투자 스타일', '월별 재물'],
    color: 'from-yellow-500/20 to-amber-500/15',
    border: 'border-yellow-500/20',
  },
]

export default function PremiumHubPage() {
  return (
    <div className="p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-5xl mb-3"
          >
            ✨
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-1">전체 기능</h1>
          <p className="text-purple-300 text-sm">다양한 운세와 분석 기능을 이용해보세요</p>
        </motion.div>

        {/* 기능 카드 */}
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
          >
            <Link
              href={feature.href}
              className={`block w-full text-left bg-gradient-to-br ${feature.color} border ${feature.border} backdrop-blur-lg rounded-2xl p-5 hover:opacity-90 transition relative overflow-hidden`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-base">{feature.title}</h3>
                  </div>
                  <p className="text-white/70 text-xs leading-relaxed mb-3">{feature.desc}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {feature.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/10 text-white/60 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-white/40 flex-shrink-0 mt-1">→</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
