import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('OAuth callback error:', error.message)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('로그인에 실패했습니다. 다시 시도해주세요.')}`, requestUrl.origin)
        )
      }
    } catch (err) {
      console.error('OAuth callback exception:', err)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다.')}`, requestUrl.origin)
      )
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
