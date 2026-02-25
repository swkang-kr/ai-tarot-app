'use client'

export default function PrivacyPage() {
  return (
    <div className="p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          <h1 className="text-2xl font-bold text-white mb-6">
            {'개인정보처리방침'}
          </h1>

          <div className="space-y-6 text-white/80 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-base mb-2">
                {'1. 수집하는 개인정보'}
              </h2>
              <p>{'본 서비스는 다음의 개인정보를 수집합니다.'}</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
                <li>{'생년월일, 생시(선택) \u2014 운세 생성 목적'}</li>
                <li>{'소셜 로그인 시: 이름, 이메일, 프로필 이미지 (Google/Kakao 제공)'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">
                {'2. 수집 목적'}
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>{'AI 기반 타로/사주 운세 생성'}</li>
                <li>{'운세 기록 저장 및 히스토리 분석 (로그인 사용자)'}</li>
                <li>{'서비스 개선 및 통계 분석'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">
                {'3. 제3자 제공'}
              </h2>
              <p>{'본 서비스는 다음의 제3자 서비스를 이용합니다.'}</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
                <li>{'Supabase \u2014 데이터베이스 및 인증'}</li>
                <li>{'Vercel \u2014 웹 호스팅'}</li>
                <li>{'Anthropic (Claude AI) \u2014 AI 운세 생성'}</li>
                <li>{'Google AdMob \u2014 광고 제공'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">
                {'4. 보유 및 이용 기간'}
              </h2>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>{'로그인 사용자: 계정 삭제 시까지 보유'}</li>
                <li>{'비로그인 사용자: 데이터를 저장하지 않음'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">
                {'5. 이용자의 권리'}
              </h2>
              <p>{'이용자는 언제든지 다음을 요청할 수 있습니다.'}</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
                <li>{'개인정보 열람, 정정, 삭제'}</li>
                <li>{'계정 탈퇴 및 데이터 완전 삭제'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">
                {'6. 연락처'}
              </h2>
              <p className="text-white/70">
                {'개인정보 관련 문의: '}
                <span className="text-purple-300">snix.kr@gmail.com</span>
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">
                {'7. 시행일'}
              </h2>
              <p className="text-white/70">
                {'본 방침은 2025년 1월 1일부터 시행됩니다.'}
              </p>
            </section>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
          >
            {'홈으로 돌아가기'}
          </a>
        </div>
      </div>
    </div>
  )
}
