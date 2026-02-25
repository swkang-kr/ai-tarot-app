-- payments 테이블 생성
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE public.payments (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  imp_uid      TEXT        NOT NULL UNIQUE,
  merchant_uid TEXT        NOT NULL UNIQUE,
  amount       INTEGER     NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  pg_provider  TEXT        NOT NULL DEFAULT 'html5_inicis',
  pay_method   TEXT        NOT NULL DEFAULT 'card',
  paid_at      TIMESTAMPTZ,
  receipt_url  TEXT,
  raw_response JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user_id ON public.payments (user_id);
CREATE INDEX idx_payments_status  ON public.payments (status);
CREATE INDEX idx_payments_paid_at ON public.payments (paid_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 본인 결제 내역만 조회 가능
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- INSERT는 service role key(API route)만 허용 — 클라이언트 직접 삽입 차단
-- (INSERT 정책 없음 → createAdminClient()로만 삽입 가능)
