-- Phase 5: 운세 공유 커뮤니티 (천기누설)

CREATE TABLE IF NOT EXISTS fortune_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  display_name TEXT,              -- NULL or '익명' when anonymous
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200),
  keywords TEXT[] DEFAULT '{}',  -- e.g., ['사랑', '직업']
  fortune_type TEXT DEFAULT 'general'
    CHECK (fortune_type IN ('tarot', 'saju', 'lucky', 'dream', 'general')),
  heart_count INTEGER DEFAULT 0,
  empathy_count INTEGER DEFAULT 0,
  same_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fortune_post_reactions (
  post_id UUID REFERENCES fortune_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'empathy', 'same')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- RLS
ALTER TABLE fortune_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fortune_post_reactions ENABLE ROW LEVEL SECURITY;

-- 포스트: 누구나 읽기 가능, 본인만 작성
DROP POLICY IF EXISTS "Anyone can read posts" ON fortune_posts;
CREATE POLICY "Anyone can read posts" ON fortune_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own posts" ON fortune_posts;
CREATE POLICY "Users can insert own posts" ON fortune_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON fortune_posts;
CREATE POLICY "Users can delete own posts" ON fortune_posts
  FOR DELETE USING (auth.uid() = user_id);

-- 반응: 누구나 읽기, 본인만 삽입/수정/삭제
DROP POLICY IF EXISTS "Anyone can read reactions" ON fortune_post_reactions;
CREATE POLICY "Anyone can read reactions" ON fortune_post_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own reactions" ON fortune_post_reactions;
CREATE POLICY "Users insert own reactions" ON fortune_post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own reactions" ON fortune_post_reactions;
CREATE POLICY "Users update own reactions" ON fortune_post_reactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own reactions" ON fortune_post_reactions;
CREATE POLICY "Users delete own reactions" ON fortune_post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_fortune_posts_created_at ON fortune_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fortune_posts_keywords ON fortune_posts USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_fortune_posts_user_id ON fortune_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_fortune_post_reactions_post_id ON fortune_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_fortune_post_reactions_user_id ON fortune_post_reactions(user_id);
