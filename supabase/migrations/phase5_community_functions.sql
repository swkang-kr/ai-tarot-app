-- Phase 5: 커뮤니티 원자적 연산 함수

-- ────────────────────────────────────────────────────────
-- 소원카드: 원자적 차감 (잔액 부족 시 실패 반환)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION use_wish_card(p_user_id UUID, p_feature TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE wish_cards
  SET balance = balance - 1
  WHERE user_id = p_user_id AND balance >= 1
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', '소원카드가 부족합니다');
  END IF;

  INSERT INTO wish_card_transactions(user_id, amount, type, feature)
  VALUES (p_user_id, -1, 'use', p_feature);

  RETURN json_build_object('success', true, 'newBalance', v_new_balance);
END;
$$;

-- ────────────────────────────────────────────────────────
-- 소원카드: 원자적 환불
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refund_wish_card(p_user_id UUID, p_feature TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE wish_cards
  SET balance = balance + 1
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NOT NULL THEN
    INSERT INTO wish_card_transactions(user_id, amount, type, feature)
    VALUES (p_user_id, 1, 'refund', p_feature);
  END IF;

  RETURN COALESCE(v_new_balance, 0);
END;
$$;

-- ────────────────────────────────────────────────────────
-- 소원카드: 원자적 구매 지급 (upsert + 잔액 누적)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION purchase_wish_cards(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  INSERT INTO wish_cards(user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = wish_cards.balance + EXCLUDED.balance
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- ────────────────────────────────────────────────────────
-- 커뮤니티 반응: 원자적 토글 (FOR UPDATE 잠금)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION toggle_post_reaction(
  p_post_id UUID,
  p_user_id UUID,
  p_reaction_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_type TEXT;
  v_heart         INTEGER;
  v_empathy       INTEGER;
  v_same          INTEGER;
  v_my_reaction   TEXT;
BEGIN
  -- 포스트 행 잠금 (동시 반응 경쟁 조건 방지)
  SELECT heart_count, empathy_count, same_count
  INTO v_heart, v_empathy, v_same
  FROM fortune_posts
  WHERE id = p_post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', '포스트를 찾을 수 없습니다');
  END IF;

  -- 기존 반응 조회
  SELECT reaction_type INTO v_existing_type
  FROM fortune_post_reactions
  WHERE post_id = p_post_id AND user_id = p_user_id;

  IF v_existing_type = p_reaction_type THEN
    -- 같은 반응 → 토글 OFF
    DELETE FROM fortune_post_reactions
    WHERE post_id = p_post_id AND user_id = p_user_id;

    IF    p_reaction_type = 'heart'   THEN v_heart   := GREATEST(0, v_heart   - 1);
    ELSIF p_reaction_type = 'empathy' THEN v_empathy := GREATEST(0, v_empathy - 1);
    ELSIF p_reaction_type = 'same'    THEN v_same    := GREATEST(0, v_same    - 1);
    END IF;

    v_my_reaction := NULL;

  ELSIF v_existing_type IS NOT NULL THEN
    -- 다른 반응 → 교체
    UPDATE fortune_post_reactions
    SET reaction_type = p_reaction_type
    WHERE post_id = p_post_id AND user_id = p_user_id;

    IF    v_existing_type = 'heart'   THEN v_heart   := GREATEST(0, v_heart   - 1);
    ELSIF v_existing_type = 'empathy' THEN v_empathy := GREATEST(0, v_empathy - 1);
    ELSIF v_existing_type = 'same'    THEN v_same    := GREATEST(0, v_same    - 1);
    END IF;

    IF    p_reaction_type = 'heart'   THEN v_heart   := v_heart   + 1;
    ELSIF p_reaction_type = 'empathy' THEN v_empathy := v_empathy + 1;
    ELSIF p_reaction_type = 'same'    THEN v_same    := v_same    + 1;
    END IF;

    v_my_reaction := p_reaction_type;

  ELSE
    -- 새 반응
    INSERT INTO fortune_post_reactions(post_id, user_id, reaction_type)
    VALUES (p_post_id, p_user_id, p_reaction_type);

    IF    p_reaction_type = 'heart'   THEN v_heart   := v_heart   + 1;
    ELSIF p_reaction_type = 'empathy' THEN v_empathy := v_empathy + 1;
    ELSIF p_reaction_type = 'same'    THEN v_same    := v_same    + 1;
    END IF;

    v_my_reaction := p_reaction_type;
  END IF;

  -- 카운트 원자적 업데이트
  UPDATE fortune_posts
  SET heart_count   = v_heart,
      empathy_count = v_empathy,
      same_count    = v_same
  WHERE id = p_post_id;

  RETURN json_build_object(
    'success',      true,
    'heartCount',   v_heart,
    'empathyCount', v_empathy,
    'sameCount',    v_same,
    'myReaction',   v_my_reaction
  );
END;
$$;

-- ────────────────────────────────────────────────────────
-- fortune_post_reactions: UPDATE 정책 추가
-- (CREATE POLICY은 IF NOT EXISTS 미지원 → DROP 후 생성)
-- ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users update own reactions" ON fortune_post_reactions;
CREATE POLICY "Users update own reactions" ON fortune_post_reactions
  FOR UPDATE USING (auth.uid() = user_id);
