import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Users, FileText, Share2, DollarSign } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies })

  const [
    { count: totalUsers },
    { count: totalReadings },
    { count: totalShares },
    { data: premiumUsers }
  ] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true }),
    supabase.from('readings').select('*', { count: 'exact', head: true }),
    supabase.from('shares').select('*', { count: 'exact', head: true }),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('tier', 'premium')
      .gt('premium_until', new Date().toISOString())
  ])

  const stats = [
    {
      label: '총 사용자',
      value: totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: '생성된 운세',
      value: totalReadings || 0,
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      label: '총 공유',
      value: totalShares || 0,
      icon: Share2,
      color: 'bg-purple-500'
    },
    {
      label: '프리미엄 사용자',
      value: premiumUsers?.length || 0,
      icon: DollarSign,
      color: 'bg-yellow-500'
    }
  ]

  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0] // KST
  const { data: todayReadings } = await supabase
    .from('readings')
    .select('*')
    .gte('created_at', `${today}T00:00:00+09:00`)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">
                {stat.value.toLocaleString()}
              </p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          오늘의 생성 기록
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  시간
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  사용자 ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  키워드
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  생성 시간
                </th>
              </tr>
            </thead>
            <tbody>
              {todayReadings?.map((reading) => (
                <tr
                  key={reading.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(reading.created_at).toLocaleTimeString('ko-KR')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800 font-mono">
                    {reading.user_id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex gap-1">
                      {reading.keywords
                        .slice(0, 3)
                        .map((k: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                          >
                            {k}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {reading.generation_time_ms}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
