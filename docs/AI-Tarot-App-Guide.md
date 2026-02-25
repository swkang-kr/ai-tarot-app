# 🔮 AI 타로 앱 완벽 개발 가이드

## 📚 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [개발 환경 설정](#개발-환경-설정)
4. [Supabase 설정](#supabase-설정)
5. [프론트엔드 개발](#프론트엔드-개발)
6. [백엔드 API 개발](#백엔드-api-개발)
7. [관리자 페이지](#관리자-페이지)
8. [PWA 설정](#pwa-설정)
9. [배포](#배포)
10. [네이티브 앱 래핑](#네이티브-앱-래핑)

---

## 프로젝트 개요

### 핵심 기능
- 생년월일 입력으로 오늘의 타로 운세 생성
- AI(Claude)가 개인화된 운세 텍스트 생성
- AI(Fal.ai)가 맞춤 타로 카드 이미지 생성
- 인스타그램 공유 최적화 (1080x1080)
- 카카오/구글 소셜 로그인
- 관리자 대시보드 (통계, 사용자 관리)

### 수익 모델
- 무료: 하루 1회 생성
- 프리미엄: 무제한 생성 + 과거 운세 조회 (월 5,000원)

---

## 기술 스택

### 프론트엔드
```json
{
  "framework": "Next.js 14 (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "animation": "Framer Motion",
  "state": "React Hooks + Context API",
  "PWA": "next-pwa"
}
```

### 백엔드
```json
{
  "backend": "Supabase (Auth + DB + Storage)",
  "api": "Next.js API Routes",
  "hosting": "Vercel"
}
```

### AI APIs
```json
{
  "text": "Claude 4.5 Sonnet (Anthropic)",
  "image": "Flux 1.1 Pro (Fal.ai)",
  "fallback": "Flux 1.1 Pro (Replicate)"
}
```

---

## 개발 환경 설정

### Day 1: 프로젝트 초기화

```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest ai-tarot-app
# ✅ TypeScript: Yes
# ✅ Tailwind CSS: Yes
# ✅ App Router: Yes
# ✅ Turbopack: No (아직 불안정)

cd ai-tarot-app

# 2. 필수 패키지 설치
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install @fal-ai/serverless-client
npm install framer-motion
npm install date-fns
npm install replicate
npm install @vercel/analytics
npm install recharts  # 관리자 차트용
npm install lucide-react  # 아이콘

# 3. 개발 도구
npm install -D @types/node
npm install -D prettier prettier-plugin-tailwindcss
```

### 프로젝트 구조

```
ai-tarot-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── route.ts
│   ├── (main)/
│   │   ├── page.tsx              # 메인 (생년월일 입력)
│   │   ├── loading/
│   │   │   └── page.tsx          # 로딩 화면
│   │   └── result/[id]/
│   │       └── page.tsx          # 결과 페이지
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # 대시보드
│   │   ├── users/
│   │   │   └── page.tsx
│   │   └── stats/
│   │       └── page.tsx
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts          # 운세 생성
│   │   ├── check-limit/
│   │   │   └── route.ts
│   │   └── admin/
│   │       ├── stats/
│   │       │   └── route.ts
│   │       └── users/
│   │           └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── TarotCard.tsx
│   ├── ShareButtons.tsx
│   ├── DatePicker.tsx
│   ├── LoadingAnimation.tsx
│   └── AdminSidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── ai/
│   │   ├── claude.ts
│   │   ├── fal.ts
│   │   └── replicate.ts
│   ├── utils/
│   │   ├── cache.ts
│   │   ├── validators.ts
│   │   └── format.ts
│   └── constants.ts
├── types/
│   └── index.ts
├── public/
│   ├── icons/
│   ├── templates/
│   └── manifest.json
├── .env.local
└── next.config.js
```

### 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

ANTHROPIC_API_KEY=sk-ant-api03-...
FAL_API_KEY=your-fal-api-key
REPLICATE_API_TOKEN=r8_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@yourdomain.com
```

---

## Supabase 설정

### 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 이름: `ai-tarot-app`
4. Database Password 설정 (안전하게 보관!)
5. Region: `Northeast Asia (Seoul)` 선택

### 2. Database Schema 생성

**Supabase Dashboard → SQL Editor → New Query 에서 실행:**

```sql
-- ============================================
-- AI 타로 앱 데이터베이스 스키마
-- ============================================

-- 1. 사용자 구독 정보
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 구독 상태
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  premium_until TIMESTAMP,
  
  -- 사용량 추적
  daily_limit INT DEFAULT 1,
  total_generated INT DEFAULT 0,
  last_generated_at TIMESTAMP,
  
  -- 추천인 관련
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES auth.users(id),
  referral_rewards INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 타로 운세 기록
CREATE TABLE readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 입력 정보
  birth_date DATE NOT NULL,
  
  -- Claude 생성 내용
  keywords TEXT[] NOT NULL,
  overall TEXT NOT NULL,
  love TEXT NOT NULL,
  wealth TEXT NOT NULL,
  health TEXT,
  career TEXT,
  lucky_color TEXT NOT NULL,
  lucky_number INT NOT NULL,
  
  -- 이미지 정보
  image_url TEXT NOT NULL,
  image_prompt TEXT,
  
  -- 공유 통계
  share_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  
  -- 메타데이터
  generation_time_ms INT,
  ai_model_version TEXT DEFAULT 'claude-sonnet-4-20250514',
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 인덱스: 같은 날 중복 방지 (캐싱)
  CONSTRAINT unique_user_date_reading 
    UNIQUE(user_id, birth_date, DATE(created_at))
);

-- 3. 공유 추적
CREATE TABLE shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reading_id UUID REFERENCES readings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'kakao', 'facebook', 'twitter', 'link')),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 관리자 활동 로그
CREATE TABLE admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 시스템 통계 (일별 집계)
CREATE TABLE daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE NOT NULL UNIQUE,
  
  -- 사용자 관련
  total_users INT DEFAULT 0,
  new_users INT DEFAULT 0,
  active_users INT DEFAULT 0,
  premium_users INT DEFAULT 0,
  
  -- 생성 관련
  total_readings INT DEFAULT 0,
  cached_readings INT DEFAULT 0,
  
  -- 공유 관련
  total_shares INT DEFAULT 0,
  instagram_shares INT DEFAULT 0,
  kakao_shares INT DEFAULT 0,
  
  -- 비용 관련
  claude_api_calls INT DEFAULT 0,
  image_generations INT DEFAULT 0,
  estimated_cost_usd DECIMAL(10,2) DEFAULT 0,
  
  -- 수익 관련
  new_subscriptions INT DEFAULT 0,
  revenue_krw INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX idx_readings_user_id ON readings(user_id);
CREATE INDEX idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_shares_reading_id ON shares(reading_id);
CREATE INDEX idx_shares_platform ON shares(platform);
CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date DESC);

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- 모든 테이블 RLS 활성화
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- 구독 정보 정책
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 운세 기록 정책
CREATE POLICY "Users can view own readings"
  ON readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readings"
  ON readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 공유 기록 정책
CREATE POLICY "Users can insert own shares"
  ON shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own shares"
  ON shares FOR SELECT
  USING (auth.uid() = user_id);

-- 관리자 로그 정책 (관리자만)
CREATE POLICY "Only admins can view logs"
  ON admin_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'admin@yourdomain.com'
    )
  );

-- 통계 정책 (관리자만)
CREATE POLICY "Only admins can view stats"
  ON daily_stats FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'admin@yourdomain.com'
    )
  );

-- ============================================
-- 트리거 함수들
-- ============================================

-- 1. 신규 사용자 자동 구독 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, referral_code)
  VALUES (
    NEW.id,
    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 운세 생성 시 구독 업데이트
CREATE OR REPLACE FUNCTION update_subscription_on_reading()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE subscriptions
  SET 
    total_generated = total_generated + 1,
    last_generated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reading_created
  AFTER INSERT ON readings
  FOR EACH ROW EXECUTE FUNCTION update_subscription_on_reading();

-- 3. 공유 시 카운트 증가
CREATE OR REPLACE FUNCTION increment_share_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE readings
  SET share_count = share_count + 1
  WHERE id = NEW.reading_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_share_created
  AFTER INSERT ON shares
  FOR EACH ROW EXECUTE FUNCTION increment_share_count();

-- ============================================
-- 유틸리티 함수들
-- ============================================

-- 1. 오늘의 통계 업데이트
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO daily_stats (
    stat_date,
    total_users,
    new_users,
    active_users,
    premium_users,
    total_readings,
    total_shares,
    instagram_shares,
    kakao_shares
  )
  SELECT
    today,
    (SELECT COUNT(*) FROM auth.users),
    (SELECT COUNT(*) FROM auth.users WHERE DATE(created_at) = today),
    (SELECT COUNT(DISTINCT user_id) FROM readings WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM subscriptions WHERE tier = 'premium' AND premium_until > NOW()),
    (SELECT COUNT(*) FROM readings WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM shares WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM shares WHERE DATE(created_at) = today AND platform = 'instagram'),
    (SELECT COUNT(*) FROM shares WHERE DATE(created_at) = today AND platform = 'kakao')
  ON CONFLICT (stat_date) 
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    premium_users = EXCLUDED.premium_users,
    total_readings = EXCLUDED.total_readings,
    total_shares = EXCLUDED.total_shares,
    instagram_shares = EXCLUDED.instagram_shares,
    kakao_shares = EXCLUDED.kakao_shares;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 사용자 생성 가능 여부 확인
CREATE OR REPLACE FUNCTION can_generate_reading(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_today_count INT;
BEGIN
  -- 구독 정보 조회
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  -- 프리미엄이면 무제한
  IF v_subscription.tier = 'premium' 
     AND v_subscription.premium_until > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- 무료 사용자는 하루 제한 확인
  SELECT COUNT(*) INTO v_today_count
  FROM readings
  WHERE user_id = p_user_id
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN v_today_count < v_subscription.daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Storage Bucket 설정
-- ============================================

-- Supabase Dashboard → Storage 에서 수동 생성:
-- 1. Bucket 이름: tarot-images
-- 2. Public: Yes
-- 3. File size limit: 5MB
-- 4. Allowed MIME types: image/png, image/jpeg, image/webp

-- RLS 정책 (SQL로 추가 가능)
-- CREATE POLICY "Public read access"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'tarot-images');
-- 
-- CREATE POLICY "Authenticated users can upload"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'tarot-images' 
--     AND auth.role() = 'authenticated'
--   );
```

### 3. Supabase Auth 설정

**Supabase Dashboard → Authentication → Providers:**

#### Google OAuth
1. "Google" 활성화
2. Google Cloud Console에서:
   - OAuth 2.0 클라이언트 ID 생성
   - 승인된 리디렉션 URI: `https://your-project.supabase.co/auth/v1/callback`
3. Client ID와 Client Secret을 Supabase에 입력

#### Kakao OAuth
1. "Kakao" 활성화 (없으면 Custom Provider 사용)
2. Kakao Developers에서:
   - 앱 생성
   - 카카오 로그인 활성화
   - Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. REST API 키를 Supabase에 입력

---

## 프론트엔드 개발

### Day 2-3: 핵심 컴포넌트

#### 1. Supabase 클라이언트 설정

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export const createClient = () => {
  return createClientComponentClient<Database>()
}
```

```typescript
// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
```

```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export const createAdminClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

#### 2. 타입 정의

```typescript
// types/index.ts

export interface TarotReading {
  id: string
  userId: string
  birthDate: string
  keywords: string[]
  overall: string
  love: string
  wealth: string
  health?: string
  career?: string
  luckyColor: string
  luckyNumber: number
  imageUrl: string
  imagePrompt?: string
  shareCount: number
  viewCount: number
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  tier: 'free' | 'premium'
  premiumUntil?: string
  dailyLimit: number
  totalGenerated: number
  lastGeneratedAt?: string
  referralCode: string
  referredBy?: string
  referralRewards: number
}

export interface ClaudeResponse {
  keywords: string[]
  overall: string
  love: string
  wealth: string
  luckyColor: string
  luckyNumber: number
  imagePrompt: string
}
```

#### 3. 메인 페이지 (생년월일 입력)

```typescript
// app/(main)/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DatePicker from '@/components/DatePicker'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { motion } from 'framer-motion'

export default function HomePage() {
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleGenerate = async () => {
    if (!birthDate) {
      setError('생년월일을 선택해주세요')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. 로그인 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 2. 생성 가능 여부 확인
      const checkRes = await fetch('/api/check-limit')
      const { canGenerate, reason } = await checkRes.json()

      if (!canGenerate) {
        setError(reason)
        setLoading(false)
        return
      }

      // 3. 운세 생성 요청
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthDate.toISOString().split('T')[0]
        })
      })

      if (!response.ok) {
        throw new Error('운세 생성에 실패했습니다')
      }

      const { readingId } = await response.json()

      // 4. 결과 페이지로 이동
      router.push(`/result/${readingId}`)

    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="text-6xl mb-4"
          >
            🔮
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            AI 타로
          </h1>
          <p className="text-purple-200">
            당신의 오늘을 AI가 읽어드립니다
          </p>
        </div>

        {/* 날짜 선택 */}
        <div className="mb-6">
          <label className="block text-white mb-2 text-sm font-medium">
            생년월일을 선택해주세요
          </label>
          <DatePicker
            selected={birthDate}
            onChange={setBirthDate}
            maxDate={new Date()}
            className="w-full"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* 생성 버튼 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={loading || !birthDate}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <LoadingSpinner className="mx-auto" />
          ) : (
            '✨ 오늘의 운세 보기'
          )}
        </motion.button>

        {/* 하단 정보 */}
        <div className="mt-6 text-center text-purple-200 text-xs">
          <p>무료 사용자는 하루 1회 생성 가능</p>
          <p className="mt-1">
            <a href="#premium" className="underline">
              프리미엄 구독하기
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
```

#### 4. 날짜 선택 컴포넌트

```typescript
// components/DatePicker.tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar } from 'lucide-react'

interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date) => void
  maxDate?: Date
  className?: string
}

export default function DatePicker({
  selected,
  onChange,
  maxDate = new Date(),
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value)
    onChange(date)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="date"
        max={format(maxDate, 'yyyy-MM-dd')}
        value={selected ? format(selected, 'yyyy-MM-dd') : ''}
        onChange={handleDateChange}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="YYYY-MM-DD"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none" size={20} />
    </div>
  )
}
```

#### 5. 로딩 애니메이션

```typescript
// components/LoadingAnimation.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const loadingMessages = [
  '✨ 카드를 섞고 있어요...',
  '🔮 별들의 배열을 읽고 있어요...',
  '🌙 운명의 실타래를 풀고 있어요...',
  '💫 신비로운 메시지를 받고 있어요...',
  '🎴 당신만의 이미지를 그리고 있어요...'
]

export default function LoadingAnimation() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex flex-col items-center justify-center p-4">
      {/* 카드 애니메이션 */}
      <motion.div
        className="relative w-40 h-56 mb-8"
        animate={{
          rotateY: [0, 180, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-2xl flex items-center justify-center">
          <span className="text-6xl">🃏</span>
        </div>
      </motion.div>

      {/* 메시지 */}
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-white text-xl font-medium text-center"
        >
          {loadingMessages[messageIndex]}
        </motion.p>
      </AnimatePresence>

      {/* 프로그레스 바 */}
      <div className="w-64 h-2 bg-white/10 rounded-full mt-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{
            duration: 10,
            ease: 'easeInOut'
          }}
        />
      </div>
    </div>
  )
}
```

#### 6. 결과 페이지

```typescript
// app/(main)/result/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TarotReading } from '@/types'
import TarotCard from '@/components/TarotCard'
import ShareButtons from '@/components/ShareButtons'
import { motion } from 'framer-motion'

export default function ResultPage() {
  const params = useParams()
  const [reading, setReading] = useState<TarotReading | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadReading()
  }, [params.id])

  const loadReading = async () => {
    try {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setReading(data as TarotReading)

      // 조회수 증가
      await supabase
        .from('readings')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', params.id)

    } catch (error) {
      console.error('Error loading reading:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!reading) {
    return <div className="flex items-center justify-center min-h-screen">운세를 찾을 수 없습니다</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 타로 카드 이미지 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <TarotCard reading={reading} />
        </motion.div>

        {/* 공유 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <ShareButtons reading={reading} />
        </motion.div>

        {/* 다시하기 버튼 */}
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
```

#### 7. 타로 카드 컴포넌트

```typescript
// components/TarotCard.tsx
'use client'

import { TarotReading } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface TarotCardProps {
  reading: TarotReading
}

export default function TarotCard({ reading }: TarotCardProps) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* 이미지 섹션 */}
      <div className="relative w-full aspect-square">
        <Image
          src={reading.imageUrl}
          alt="타로 카드"
          fill
          className="object-cover"
          priority
        />
        
        {/* 날짜 오버레이 */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-4 py-2 rounded-full">
          <p className="text-white text-sm font-medium">
            {format(new Date(reading.createdAt), 'yyyy년 M월 d일', { locale: ko })}
          </p>
        </div>
      </div>

      {/* 내용 섹션 */}
      <div className="p-6">
        {/* 키워드 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {reading.keywords.map((keyword, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
            >
              {keyword}
            </motion.span>
          ))}
        </div>

        {/* 전체운 */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">✨ 전체운</h3>
          <p className="text-gray-700 leading-relaxed">{reading.overall}</p>
        </div>

        {/* 애정운 */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">💖 애정운</h3>
          <p className="text-gray-700 leading-relaxed">{reading.love}</p>
        </div>

        {/* 재물운 */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">💰 재물운</h3>
          <p className="text-gray-700 leading-relaxed">{reading.wealth}</p>
        </div>

        {/* 행운의 요소 */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500 mb-1">행운의 색상</p>
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: reading.luckyColor }}
              />
              <span className="font-medium text-gray-800">
                {reading.luckyColor}
              </span>
            </div>
          </div>
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500 mb-1">행운의 숫자</p>
            <p className="text-2xl font-bold text-purple-600">
              {reading.luckyNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 8. 공유 버튼 컴포넌트

```typescript
// components/ShareButtons.tsx
'use client'

import { TarotReading } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Instagram, MessageCircle, Share2, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonsProps {
  reading: TarotReading
}

export default function ShareButtons({ reading }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const trackShare = async (platform: string) => {
    await supabase.from('shares').insert({
      reading_id: reading.id,
      user_id: reading.userId,
      platform
    })
  }

  const shareToInstagram = async () => {
    if (navigator.share) {
      try {
        const response = await fetch(reading.imageUrl)
        const blob = await response.blob()
        const file = new File([blob], 'tarot.png', { type: 'image/png' })

        await navigator.share({
          files: [file],
          title: '오늘의 타로 운세',
          text: `${reading.overall.slice(0, 50)}...`
        })

        await trackShare('instagram')
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      // Fallback: 이미지 다운로드
      const a = document.createElement('a')
      a.href = reading.imageUrl
      a.download = 'tarot.png'
      a.click()
    }
  }

  const shareToKakao = async () => {
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '오늘의 AI 타로 운세',
          description: reading.overall,
          imageUrl: reading.imageUrl,
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href
          }
        },
        buttons: [
          {
            title: '내 운세 보기',
            link: {
              mobileWebUrl: process.env.NEXT_PUBLIC_APP_URL,
              webUrl: process.env.NEXT_PUBLIC_APP_URL
            }
          }
        ]
      })

      await trackShare('kakao')
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    await trackShare('link')
  }

  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={shareToInstagram}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition"
      >
        <Instagram size={20} />
        인스타그램
      </button>

      <button
        onClick={shareToKakao}
        className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-800 rounded-xl font-medium hover:shadow-lg transition"
      >
        <MessageCircle size={20} />
        카카오톡
      </button>

      <button
        onClick={copyLink}
        className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur text-white rounded-xl font-medium hover:bg-white/20 transition"
      >
        {copied ? (
          <>✓ 복사됨</>
        ) : (
          <>
            <LinkIcon size={20} />
            링크 복사
          </>
        )}
      </button>
    </div>
  )
}
```

---

## 백엔드 API 개발

### Day 4-5: AI 통합

#### 1. Claude API 통합

```typescript
// lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk'
import { ClaudeResponse } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function generateTarotReading(birthDate: string): Promise<ClaudeResponse> {
  const prompt = `
당신은 전문 타로 리더입니다. ${birthDate}생 사용자의 오늘 운세를 감성적이고 공감되는 톤으로 생성해주세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "keywords": ["이모지포함 키워드1", "이모지포함 키워드2", "이모지포함 키워드3"],
  "overall": "전체운 설명 (50-70자)",
  "love": "애정운 설명 (50-70자)",
  "wealth": "재물운 설명 (50-70자)",
  "luckyColor": "#667eea",
  "luckyNumber": 7,
  "imagePrompt": "mystical tarot card illustration, [운세 내용 기반 구체적 묘사], ornate golden frame, celestial symbols, cosmic background, intricate Art Nouveau borders, highly detailed, professional divination card design, centered composition, 4K quality"
}

중요:
- keywords는 이모지와 짧은 단어 조합 (예: "✨ 행운", "💫 변화", "🌸 만남")
- 운세 내용은 구체적이고 실용적으로
- luckyColor는 HEX 코드
- luckyNumber는 1-99 사이
- imagePrompt는 Flux AI가 이해할 수 있는 영문 프롬프트
  - 운세 테마에 맞는 색상, 상징, 분위기 포함
  - "mystical tarot card" 스타일 유지
  - 구체적인 시각적 요소 묘사
`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  // JSON 파싱 (```json 제거)
  let jsonText = content.text.trim()
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  const response: ClaudeResponse = JSON.parse(jsonText)

  return response
}
```

#### 2. Fal.ai 이미지 생성

```typescript
// lib/ai/fal.ts
import * as fal from '@fal-ai/serverless-client'

fal.config({
  credentials: process.env.FAL_API_KEY!
})

export async function generateTarotImage(prompt: string): Promise<string> {
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt: prompt,
        image_size: 'square_hd', // 1024x1024
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'png'
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Fal.ai progress:', update.logs)
        }
      }
    })

    if (!result.data || !result.data.images || result.data.images.length === 0) {
      throw new Error('No image generated')
    }

    return result.data.images[0].url

  } catch (error) {
    console.error('Fal.ai error:', error)
    throw error
  }
}
```

#### 3. Replicate 폴백

```typescript
// lib/ai/replicate.ts
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

export async function generateTarotImageFallback(prompt: string): Promise<string> {
  try {
    const output = await replicate.run(
      'black-forest-labs/flux-1.1-pro',
      {
        input: {
          prompt: prompt,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 90,
          safety_tolerance: 2
        }
      }
    ) as any

    if (!output || typeof output !== 'string') {
      throw new Error('Invalid Replicate output')
    }

    return output

  } catch (error) {
    console.error('Replicate error:', error)
    throw error
  }
}
```

#### 4. Supabase Storage 저장

```typescript
// lib/utils/storage.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function saveImageToStorage(
  imageUrl: string,
  userId: string
): Promise<string> {
  try {
    // 1. 임시 URL에서 이미지 다운로드
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    // 2. Supabase Storage에 업로드
    const fileName = `${userId}/${Date.now()}.png`
    const { data, error } = await supabase.storage
      .from('tarot-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1년
        upsert: false
      })

    if (error) {
      throw error
    }

    // 3. Public URL 반환
    const { data: { publicUrl } } = supabase.storage
      .from('tarot-images')
      .getPublicUrl(fileName)

    return publicUrl

  } catch (error) {
    console.error('Storage save error:', error)
    throw error
  }
}
```

#### 5. 캐싱 로직

```typescript
// lib/utils/cache.ts
import { createClient } from '@/lib/supabase/server'
import { TarotReading } from '@/types'

export async function getCachedReading(
  userId: string,
  birthDate: string
): Promise<TarotReading | null> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('user_id', userId)
    .eq('birth_date', birthDate)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)
    .single()

  if (error || !data) {
    return null
  }

  return data as TarotReading
}
```

#### 6. 메인 생성 API

```typescript
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTarotReading } from '@/lib/ai/claude'
import { generateTarotImage } from '@/lib/ai/fal'
import { generateTarotImageFallback } from '@/lib/ai/replicate'
import { saveImageToStorage } from '@/lib/utils/storage'
import { getCachedReading } from '@/lib/utils/cache'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. 인증 확인
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 2. 요청 파싱
    const { birthDate } = await req.json()

    if (!birthDate) {
      return NextResponse.json(
        { error: '생년월일을 입력해주세요' },
        { status: 400 }
      )
    }

    // 3. 캐시 확인 (비용 절감)
    const cached = await getCachedReading(user.id, birthDate)
    if (cached) {
      console.log('Cache hit - returning existing reading')
      return NextResponse.json({
        readingId: cached.id,
        cached: true
      })
    }

    // 4. 생성 제한 확인
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: '구독 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 프리미엄이 아니면 일일 제한 확인
    const isPremium = subscription.tier === 'premium' &&
      subscription.premium_until &&
      new Date(subscription.premium_until) > new Date()

    if (!isPremium) {
      const { data: todayReadings } = await supabase
        .from('readings')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', new Date().toISOString().split('T')[0])

      if (todayReadings && todayReadings.length >= subscription.daily_limit) {
        return NextResponse.json(
          { error: '오늘의 무료 생성 횟수를 모두 사용했습니다' },
          { status: 429 }
        )
      }
    }

    // 5. Claude로 운세 생성
    console.log('Generating reading with Claude...')
    const reading = await generateTarotReading(birthDate)

    // 6. 이미지 생성 (Fal.ai → Replicate 폴백)
    console.log('Generating image with AI...')
    let tempImageUrl: string

    try {
      tempImageUrl = await generateTarotImage(reading.imagePrompt)
    } catch (falError) {
      console.error('Fal.ai failed, trying Replicate...', falError)
      tempImageUrl = await generateTarotImageFallback(reading.imagePrompt)
    }

    // 7. Supabase Storage에 영구 저장
    console.log('Saving image to Supabase Storage...')
    const permanentImageUrl = await saveImageToStorage(tempImageUrl, user.id)

    // 8. DB에 저장
    const generationTime = Date.now() - startTime

    const { data: savedReading, error: saveError } = await supabase
      .from('readings')
      .insert({
        user_id: user.id,
        birth_date: birthDate,
        keywords: reading.keywords,
        overall: reading.overall,
        love: reading.love,
        wealth: reading.wealth,
        lucky_color: reading.luckyColor,
        lucky_number: reading.luckyNumber,
        image_url: permanentImageUrl,
        image_prompt: reading.imagePrompt,
        generation_time_ms: generationTime
      })
      .select()
      .single()

    if (saveError) {
      throw saveError
    }

    console.log(`Reading generated in ${generationTime}ms`)

    return NextResponse.json({
      readingId: savedReading.id,
      cached: false
    })

  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: '운세 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
```

#### 7. 생성 제한 확인 API

```typescript
// app/api/check-limit/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        canGenerate: false,
        reason: '로그인이 필요합니다'
      })
    }

    // 구독 정보 조회
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json({
        canGenerate: false,
        reason: '구독 정보를 찾을 수 없습니다'
      })
    }

    // 프리미엄 확인
    const isPremium = subscription.tier === 'premium' &&
      subscription.premium_until &&
      new Date(subscription.premium_until) > new Date()

    if (isPremium) {
      return NextResponse.json({
        canGenerate: true,
        isPremium: true,
        remainingToday: -1 // 무제한
      })
    }

    // 무료 사용자 - 오늘 생성 횟수 확인
    const today = new Date().toISOString().split('T')[0]
    const { data: todayReadings } = await supabase
      .from('readings')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)

    const usedToday = todayReadings?.length || 0
    const remaining = subscription.daily_limit - usedToday

    if (remaining <= 0) {
      return NextResponse.json({
        canGenerate: false,
        isPremium: false,
        reason: '오늘의 무료 생성 횟수를 모두 사용했습니다. 내일 다시 시도하거나 프리미엄을 구독하세요.'
      })
    }

    return NextResponse.json({
      canGenerate: true,
      isPremium: false,
      remainingToday: remaining
    })

  } catch (error) {
    console.error('Check limit error:', error)
    return NextResponse.json({
      canGenerate: false,
      reason: '오류가 발생했습니다'
    }, { status: 500 })
  }
}
```

---

## 관리자 페이지

### Day 6: 관리자 대시보드

#### 1. 관리자 인증 미들웨어

```typescript
// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 관리자 이메일 확인
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
```

#### 2. 사이드바

```typescript
// components/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, TrendingUp, Settings } from 'lucide-react'

const menuItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/users', label: '사용자 관리', icon: Users },
  { href: '/admin/stats', label: '통계', icon: TrendingUp },
  { href: '/admin/settings', label: '설정', icon: Settings }
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">🔮 Admin</h2>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

#### 3. 대시보드 페이지

```typescript
// app/admin/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Users, FileText, Share2, DollarSign } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createClient()

  // 통계 데이터 조회
  const [
    { count: totalUsers },
    { count: totalReadings },
    { count: totalShares },
    { data: premiumUsers }
  ] = await Promise.all([
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
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

  // 오늘의 활동
  const today = new Date().toISOString().split('T')[0]
  const { data: todayReadings } = await supabase
    .from('readings')
    .select('*')
    .gte('created_at', `${today}T00:00:00`)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">대시보드</h1>

      {/* 통계 카드 */}
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

      {/* 최근 활동 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">오늘의 생성 기록</h2>
        
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
                <tr key={reading.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(reading.created_at).toLocaleTimeString('ko-KR')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800 font-mono">
                    {reading.user_id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex gap-1">
                      {reading.keywords.slice(0, 3).map((k: string, i: number) => (
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
```

#### 4. 사용자 관리 페이지

```typescript
// app/admin/users/page.tsx
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function UsersPage() {
  const supabase = createClient()

  // 사용자 목록 조회 (구독 정보 포함)
  const { data: users } = await supabase
    .from('subscriptions')
    .select(`
      *,
      user:user_id (
        id,
        email,
        created_at
      )
    `)
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
                이메일
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
            {users?.map((sub: any) => {
              const isPremium = sub.tier === 'premium' &&
                sub.premium_until &&
                new Date(sub.premium_until) > new Date()

              return (
                <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-800">
                    {sub.user?.email || 'N/A'}
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
                    {format(new Date(sub.created_at), 'yyyy.MM.dd', { locale: ko })}
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
```

#### 5. 통계 페이지 (차트 포함)

```typescript
// app/admin/stats/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function StatsPage() {
  const [stats, setStats] = useState<any[]>([])
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
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">통계</h1>

      {/* 일별 사용자 증가 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">일별 신규 사용자</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stat_date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="new_users" stroke="#8b5cf6" name="신규 사용자" />
            <Line type="monotone" dataKey="active_users" stroke="#10b981" name="활성 사용자" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 일별 운세 생성 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">일별 운세 생성 수</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stat_date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_readings" fill="#8b5cf6" name="총 생성" />
            <Bar dataKey="cached_readings" fill="#6366f1" name="캐시 사용" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 공유 플랫폼 분석 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">플랫폼별 공유 수</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stat_date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="instagram_shares" fill="#e11d48" name="인스타그램" />
            <Bar dataKey="kakao_shares" fill="#fbbf24" name="카카오톡" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

#### 6. 통계 API

```typescript
// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    // 관리자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 최근 30일 통계 조회
    const { data: stats } = await supabase
      .from('daily_stats')
      .select('*')
      .order('stat_date', { ascending: false })
      .limit(30)

    // 오래된 순으로 정렬 (차트용)
    const sortedStats = stats?.reverse() || []

    return NextResponse.json(sortedStats)

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    )
  }
}
```

---

## PWA 설정

### Day 7: Progressive Web App

#### 1. PWA 패키지 설치 및 설정

```bash
npm install next-pwa
```

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['replicate.delivery', 'fal.media', 'supabase.co']
  }
})
```

#### 2. Manifest 파일

```json
// public/manifest.json
{
  "name": "AI 타로 - 오늘의 운세",
  "short_name": "AI 타로",
  "description": "AI가 읽어주는 오늘의 타로 운세",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#8b5cf6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot1.png",
      "sizes": "1080x1920",
      "type": "image/png"
    }
  ]
}
```

#### 3. 메타데이터 설정

```typescript
// app/layout.tsx
import { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8b5cf6'
}

export const metadata: Metadata = {
  title: 'AI 타로 - 오늘의 운세',
  description: 'AI가 읽어주는 오늘의 타로 운세. 생년월일만 입력하면 사랑운, 재물운을 무료로 확인하세요.',
  keywords: ['타로', '타로카드', '오늘의운세', '무료타로', 'AI타로', '운세'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI 타로'
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://your-domain.com',
    title: 'AI 타로 - 오늘의 운세',
    description: 'AI가 읽어주는 오늘의 타로 운세',
    siteName: 'AI 타로',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI 타로'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 타로',
    description: 'AI가 읽어주는 오늘의 타로 운세',
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
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 배포

### Vercel 배포

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 배포
vercel

# 4. 환경변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add FAL_API_KEY
vercel env add REPLICATE_API_TOKEN
vercel env add ADMIN_EMAIL

# 5. 프로덕션 배포
vercel --prod
```

---

## 네이티브 앱 래핑

### Expo WebView 앱

```bash
# 1. Expo 프로젝트 생성
npx create-expo-app ai-tarot-native
cd ai-tarot-native

# 2. WebView 설치
npx expo install react-native-webview

# 3. App.tsx 수정
```

```typescript
// App.tsx
import { StatusBar } from 'expo-status-bar'
import { WebView } from 'react-native-webview'
import { SafeAreaView } from 'react-native'

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: 'https://your-domain.vercel.app' }}
        style={{ flex: 1 }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
      />
      <StatusBar style="light" />
    </SafeAreaView>
  )
}
```

```bash
# 4. 빌드 (EAS Build)
npm install -g eas-cli
eas login
eas build:configure

# 5. Android APK 생성
eas build -p android --profile preview

# 6. iOS 빌드 (TestFlight)
eas build -p ios --profile preview
```

---

## 체크리스트

### MVP 런칭 전 필수사항

- [ ] Supabase 프로젝트 생성 및 DB 스키마 실행
- [ ] Supabase Storage 버킷 생성 (tarot-images)
- [ ] 카카오/구글 OAuth 설정
- [ ] 환경변수 모두 설정
- [ ] Claude API 키 발급 및 크레딧 충전
- [ ] Fal.ai API 키 발급
- [ ] Vercel 프로젝트 연결
- [ ] 도메인 연결 (선택)
- [ ] OG 이미지 생성 (/public/og-image.png)
- [ ] PWA 아이콘 생성 (192x192, 512x512)
- [ ] 관리자 이메일 설정
- [ ] 테스트 계정으로 전체 플로우 테스트
- [ ] 모바일 브라우저 테스트 (iOS Safari, Android Chrome)
- [ ] 공유 기능 테스트 (인스타그램, 카카오톡)
- [ ] 에러 처리 확인
- [ ] 로딩 속도 확인 (10초 이내)

---

## 비용 예측

### 일 사용자 1,000명 기준

```
Claude API:
- 운세 생성: 1,000 × $0.015 = $15

Fal.ai:
- 이미지 생성: 1,000 × $0.025 = $25
- 캐싱 50% 절감: $12.5

Supabase:
- DB: 무료 (500MB 이하)
- Storage: 14GB × $0.021 = $0.3
- Auth: 무료 (50,000 MAU)

Vercel:
- Hosting: 무료 (Hobby 플랜)
- Bandwidth: 무료 (100GB)

총 비용: $27.8/일 ≈ 월 $834
```

### 손익분기점
- 프리미엄 구독자 200명 (200 × 5,000원 = 1,000,000원)
- 사용자 5,000명 기준 5% 전환율 달성 시 흑자

---

## 다음 단계 (MVP 이후)

1. **A/B 테스팅**
   - 다양한 이미지 스타일 테스트
   - 운세 톤앤매너 테스트

2. **추가 기능**
   - 과거 운세 조회
   - 사주 풀이
   - 꿈해몽
   - 별자리 운세

3. **마케팅**
   - 인스타그램 광고
   - 인플루언서 협업
   - 앱스토어 최적화 (ASO)

4. **수익화**
   - 포트원 결제 연동
   - 구독 플랜 다양화
   - 제휴 마케팅

---

## 문의 및 지원

개발 중 문제가 생기면:
1. Supabase Discord
2. Next.js GitHub Discussions
3. Anthropic Developer Forum

**화이팅! 🚀**
