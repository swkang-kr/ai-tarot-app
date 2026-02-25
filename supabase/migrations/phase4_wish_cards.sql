-- Phase 4-1: 소원카드 시스템
-- Supabase SQL Editor에서 실행하세요

-- 소원카드 잔액 테이블
CREATE TABLE IF NOT EXISTS wish_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wish_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own wish_cards" ON wish_cards;
CREATE POLICY "Users see own wish_cards" ON wish_cards
  FOR SELECT USING (auth.uid() = user_id);

-- 소원카드 거래 내역 테이블
CREATE TABLE IF NOT EXISTS wish_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL,             -- 양수=충전, 음수=사용, 양수=환불
  type TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund')),
  feature TEXT,                        -- 사용한 기능명 (use/refund 시)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wish_card_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own wish_card_transactions" ON wish_card_transactions;
CREATE POLICY "Users see own wish_card_transactions" ON wish_card_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_wish_cards_user_id ON wish_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_wish_card_transactions_user_id ON wish_card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wish_card_transactions_created_at ON wish_card_transactions(created_at DESC);
