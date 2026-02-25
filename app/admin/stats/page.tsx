'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function StatsPage() {
  const [stats, setStats] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">통계</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          일별 신규 사용자
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stat_date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="new_users"
              stroke="#8b5cf6"
              name="신규 사용자"
            />
            <Line
              type="monotone"
              dataKey="active_users"
              stroke="#10b981"
              name="활성 사용자"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          일별 운세 생성 수
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stat_date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="total_readings"
              fill="#8b5cf6"
              name="총 생성"
            />
            <Bar
              dataKey="cached_readings"
              fill="#6366f1"
              name="캐시 사용"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          플랫폼별 공유 수
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stat_date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="instagram_shares"
              fill="#e11d48"
              name="인스타그램"
            />
            <Bar
              dataKey="kakao_shares"
              fill="#fbbf24"
              name="카카오톡"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
