-- ============================================================
-- AI Tarot App - Supabase Schema
-- ============================================================
-- 5 Tables + 3 Triggers + 2 Utility Functions + Indexes + RLS
-- Run this in Supabase SQL Editor (순서대로 실행)
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 1-1. subscriptions (사용자 구독 정보)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  premium_until TIMESTAMPTZ,
  daily_limit INTEGER NOT NULL DEFAULT 1,
  total_generated INTEGER NOT NULL DEFAULT 0,
  last_generated_at TIMESTAMPTZ,
  referral_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  referred_by TEXT,
  referral_rewards INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscriptions IS '사용자 구독 정보 (회원가입 시 자동 생성)';

-- 1-2. readings (타로 운세 기록)
CREATE TABLE public.readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  birth_date TEXT NOT NULL,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall TEXT NOT NULL,
  love TEXT NOT NULL,
  wealth TEXT NOT NULL,
  health TEXT,
  career TEXT,
  lucky_color TEXT NOT NULL,
  lucky_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_prompt TEXT,
  share_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  generation_time_ms INTEGER,
  ai_model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.readings IS '타로 운세 생성 기록';

-- timestamptz → date 변환을 IMMUTABLE로 래핑 (UTC 기준)
CREATE OR REPLACE FUNCTION public.to_date_utc(ts TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT (ts AT TIME ZONE 'UTC')::date;
$$ LANGUAGE sql IMMUTABLE;

-- 캐싱용 Unique Constraint: 같은 날 + 같은 user + 같은 생년월일 중복 방지
CREATE UNIQUE INDEX idx_readings_cache
  ON public.readings (user_id, birth_date, public.to_date_utc(created_at));

-- 1-3. shares (공유 추적)
CREATE TABLE public.shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reading_id UUID REFERENCES public.readings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'kakao', 'facebook', 'twitter', 'link')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shares IS 'SNS 공유 추적';

-- 1-4. admin_logs (관리자 활동 로그)
CREATE TABLE public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_logs IS '관리자 활동 로그';

-- 1-5. daily_stats (일별 집계 통계)
CREATE TABLE public.daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE NOT NULL UNIQUE,
  total_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  premium_users INTEGER NOT NULL DEFAULT 0,
  total_readings INTEGER NOT NULL DEFAULT 0,
  cached_readings INTEGER NOT NULL DEFAULT 0,
  total_shares INTEGER NOT NULL DEFAULT 0,
  instagram_shares INTEGER NOT NULL DEFAULT 0,
  kakao_shares INTEGER NOT NULL DEFAULT 0,
  claude_api_calls INTEGER NOT NULL DEFAULT 0,
  image_generations INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  new_subscriptions INTEGER NOT NULL DEFAULT 0,
  revenue_krw INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.daily_stats IS '일별 서비스 집계 통계';

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_readings_user_id ON public.readings (user_id);
CREATE INDEX idx_readings_created_at ON public.readings (created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions (tier);
CREATE INDEX idx_shares_reading_id ON public.shares (reading_id);
CREATE INDEX idx_shares_platform ON public.shares (platform);
CREATE INDEX idx_daily_stats_date ON public.daily_stats (stat_date DESC);

-- ============================================================
-- 3. TRIGGER FUNCTIONS
-- ============================================================

-- 3-1. 회원가입 시 subscriptions 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3-2. reading 생성 시 subscription 통계 업데이트
CREATE OR REPLACE FUNCTION public.handle_new_reading()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.subscriptions
  SET
    total_generated = total_generated + 1,
    last_generated_at = now(),
    updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3-3. share 생성 시 reading.share_count 증가
CREATE OR REPLACE FUNCTION public.handle_new_share()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.readings
  SET share_count = share_count + 1
  WHERE id = NEW.reading_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_reading_created
  AFTER INSERT ON public.readings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_reading();

CREATE TRIGGER on_share_created
  AFTER INSERT ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_share();

-- ============================================================
-- 5. UTILITY FUNCTIONS
-- ============================================================

-- 5-1. 생성 가능 여부 확인
CREATE OR REPLACE FUNCTION public.can_generate_reading(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_premium_until TIMESTAMPTZ;
  v_daily_limit INTEGER;
  v_today_count INTEGER;
BEGIN
  -- 구독 정보 조회
  SELECT tier, premium_until, daily_limit
  INTO v_tier, v_premium_until, v_daily_limit
  FROM public.subscriptions
  WHERE user_id = p_user_id;

  -- 구독 정보 없으면 불가
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 프리미엄 사용자 (유효기간 내)
  IF v_tier = 'premium' AND v_premium_until > now() THEN
    RETURN TRUE;
  END IF;

  -- 무료 사용자: 오늘 생성 횟수 확인
  SELECT COUNT(*)
  INTO v_today_count
  FROM public.readings
  WHERE user_id = p_user_id
    AND created_at::date = CURRENT_DATE;

  RETURN v_today_count < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5-2. 일별 통계 집계 (수동 또는 cron으로 실행)
CREATE OR REPLACE FUNCTION public.update_daily_stats()
RETURNS VOID AS $$
DECLARE
  v_date DATE := CURRENT_DATE;
BEGIN
  INSERT INTO public.daily_stats (
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
  VALUES (
    v_date,
    (SELECT COUNT(*) FROM auth.users),
    (SELECT COUNT(*) FROM auth.users WHERE created_at::date = v_date),
    (SELECT COUNT(DISTINCT user_id) FROM public.readings WHERE created_at::date = v_date),
    (SELECT COUNT(*) FROM public.subscriptions WHERE tier = 'premium' AND premium_until > now()),
    (SELECT COUNT(*) FROM public.readings WHERE created_at::date = v_date),
    (SELECT COUNT(*) FROM public.shares WHERE created_at::date = v_date),
    (SELECT COUNT(*) FROM public.shares WHERE created_at::date = v_date AND platform = 'instagram'),
    (SELECT COUNT(*) FROM public.shares WHERE created_at::date = v_date AND platform = 'kakao')
  )
  ON CONFLICT (stat_date)
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    premium_users = EXCLUDED.premium_users,
    total_readings = EXCLUDED.total_readings,
    total_shares = EXCLUDED.total_shares,
    instagram_shares = EXCLUDED.instagram_shares,
    kakao_shares = EXCLUDED.kakao_shares;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- subscriptions: 본인 데이터만 조회/수정
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- readings: 본인 데이터만 조회/생성
CREATE POLICY "Users can view own readings"
  ON public.readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readings"
  ON public.readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own readings"
  ON public.readings FOR UPDATE
  USING (auth.uid() = user_id);

-- shares: 본인 데이터만 조회/생성
CREATE POLICY "Users can view own shares"
  ON public.shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shares"
  ON public.shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- admin_logs: 관리자만 조회
CREATE POLICY "Only admins can view logs"
  ON public.admin_logs FOR SELECT
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- daily_stats: 관리자만 조회
CREATE POLICY "Only admins can view stats"
  ON public.daily_stats FOR SELECT
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- ============================================================
-- 7. STORAGE BUCKET
-- ============================================================
-- Note: Supabase Dashboard에서 실행하거나 아래 SQL 사용
-- Storage > New bucket > Name: tarot-images, Public: true

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tarot-images',
  'tarot-images',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 인증된 사용자만 업로드, 누구나 조회
CREATE POLICY "Anyone can view tarot images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tarot-images');

CREATE POLICY "Authenticated users can upload tarot images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tarot-images'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- DONE! 아래 항목을 Supabase Dashboard에서 추가 설정하세요:
-- ============================================================
-- 1. Authentication > Providers > Kakao 활성화 (REST API Key 입력)
-- 2. Authentication > Providers > Google 활성화 (Client ID/Secret 입력)
-- 3. Authentication > URL Configuration > Site URL 설정
-- 4. Settings > Database > app.admin_email 설정:
--    ALTER DATABASE postgres SET app.admin_email = 'your-admin@email.com';
-- ============================================================
