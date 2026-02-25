-- ============================================
-- AI 타로 앱 Phase 1+2 DB 마이그레이션
-- Supabase SQL Editor에서 실행해주세요
-- ============================================

-- Phase 1: readings 테이블 확장
ALTER TABLE readings ADD COLUMN IF NOT EXISTS scores jsonb;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS time_of_day jsonb;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS lucky_items jsonb;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS warning text;

-- Phase 2-1: 궁합 테이블
CREATE TABLE IF NOT EXISTS compatibility_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  person1_birth_date text NOT NULL,
  person1_birth_hour int,
  person2_birth_date text NOT NULL,
  person2_birth_hour int,
  relationship_type text NOT NULL,
  scores jsonb NOT NULL,
  analysis jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE compatibility_readings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users read own compatibility" ON compatibility_readings FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users insert own compatibility" ON compatibility_readings FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Phase 2-2: 꿈해몽 테이블
CREATE TABLE IF NOT EXISTS dream_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  dream_content text NOT NULL,
  category text,
  interpretation jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dream_readings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users read own dreams" ON dream_readings FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users insert own dreams" ON dream_readings FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Phase 2-3: 주간 운세 테이블
CREATE TABLE IF NOT EXISTS weekly_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  birth_date text NOT NULL,
  week_start date NOT NULL,
  analysis jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE weekly_readings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users read own weekly" ON weekly_readings FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users insert own weekly" ON weekly_readings FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_compat_user_date ON compatibility_readings (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dream_user_date ON dream_readings (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_cache ON weekly_readings (user_id, birth_date, week_start);
