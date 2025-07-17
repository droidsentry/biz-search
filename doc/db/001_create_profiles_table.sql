-- =============================================
-- profilesテーブルの作成
-- =============================================
-- 
-- 目的: ユーザープロファイル情報を管理するテーブル
-- 特徴:
--   - auth.usersテーブルと1対1の関係
--   - emailとusernameはユニーク制約
--   - カスケード削除により、認証ユーザー削除時に自動削除
-- =============================================

-- profilesテーブルの作成
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT auth.uid(),
  email text NOT NULL,
  username text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_username_key UNIQUE (username),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- インデックスの作成（検索パフォーマンス向上）
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- updated_atを自動更新するための関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at自動更新トリガー
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- テーブルコメント
COMMENT ON TABLE public.profiles IS 'ユーザープロファイル情報を管理するテーブル';
COMMENT ON COLUMN public.profiles.id IS 'ユーザーID（auth.users.idと同じ）';
COMMENT ON COLUMN public.profiles.email IS 'メールアドレス（ユニーク）';
COMMENT ON COLUMN public.profiles.username IS 'ユーザー名（ユニーク）';
COMMENT ON COLUMN public.profiles.created_at IS 'レコード作成日時';
COMMENT ON COLUMN public.profiles.updated_at IS 'レコード更新日時';