-- IP 기반 일일 제한을 위한 컬럼 추가
-- Supabase Dashboard > SQL Editor 에서 실행

ALTER TABLE readings ADD COLUMN IF NOT EXISTS client_ip text;

-- IP + 날짜 기준 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_readings_ip_created
  ON readings (client_ip, created_at)
  WHERE client_ip IS NOT NULL;
