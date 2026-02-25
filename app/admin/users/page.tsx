import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface SubscriptionRow {
  id: string
  user_id: string
  tier: string
  premium_until: string | null
  total_generated: number
  referral_code: string
  created_at: string
}

export default async function UsersPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: users } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">사용자 관리</h1>
        <div className="text-sm text-gray-600">
          총 {users?.length || 0}명
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                사용자 ID
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                구독 상태
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                총 생성 수
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                가입일
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                추천 코드
              </th>
            </tr>
          </thead>
          <tbody>
            {users?.map((sub: SubscriptionRow) => {
              const isPremium =
                sub.tier === 'premium' &&
                sub.premium_until &&
                new Date(sub.premium_until) > new Date()

              return (
                <tr
                  key={sub.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-4 px-6 text-sm text-gray-800 font-mono">
                    {sub.user_id?.slice(0, 12)}...
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {isPremium ? (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        프리미엄
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        무료
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {sub.total_generated || 0}회
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {format(new Date(sub.created_at), 'yyyy.MM.dd', {
                      locale: ko
                    })}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                      {sub.referral_code}
                    </code>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
