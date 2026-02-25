-- Phase 5: 사주 심리 분석 캐시 테이블
-- 성격은 변하지 않으므로 (user_id + birth_date + birth_hour) 기준 영구 캐시

CREATE TABLE IF NOT EXISTS psychology_readings (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  birth_date DATE NOT NULL,
  birth_hour INTEGER,            -- NULL = 시간 미입력
  analysis   JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE psychology_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own psychology" ON psychology_readings;
CREATE POLICY "Users see own psychology" ON psychology_readings
  FOR ALL USING (auth.uid() = user_id);

-- 인덱스: (user_id, birth_date, birth_hour) 조합 캐시 조회
CREATE INDEX IF NOT EXISTS idx_psychology_readings_user_birth
  ON psychology_readings(user_id, birth_date, birth_hour);
