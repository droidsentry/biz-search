-- =============================================
-- Biz Search データベース初期構築スクリプト
-- =============================================
-- 実行順序: 1番目
-- 内容: 全テーブルの作成とトリガーの設定
-- =============================================

-- =============================================
-- 1. profilesテーブルの作成
-- =============================================
-- 
-- 目的: ユーザープロファイル情報を管理するテーブル
-- 特徴:
--   - auth.usersテーブルと1対1の関係
--   - emailとusernameはユニーク制約
--   - roleによるシステムレベルの権限管理
--   - カスケード削除により、認証ユーザー削除時に自動削除
-- =============================================

-- profilesテーブルの作成
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT auth.uid(),
  email text NOT NULL,
  username text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('system_owner', 'user')),
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
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- テーブルコメント
COMMENT ON TABLE public.profiles IS 'ユーザープロファイル情報を管理するテーブル';
COMMENT ON COLUMN public.profiles.id IS 'ユーザーID（auth.users.idと同じ）';
COMMENT ON COLUMN public.profiles.email IS 'メールアドレス（ユニーク）';
COMMENT ON COLUMN public.profiles.username IS 'ユーザー名（ユニーク）';
COMMENT ON COLUMN public.profiles.role IS 'システム全体でのユーザーロール（system_owner: 全プロジェクトアクセス可, user: 通常ユーザー）';
COMMENT ON COLUMN public.profiles.created_at IS 'レコード作成日時';
COMMENT ON COLUMN public.profiles.updated_at IS 'レコード更新日時';

-- =============================================
-- 2. コアテーブルの作成
-- =============================================

-- プロジェクトテーブル
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- プロジェクトメンバー管理テーブル
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL,
  added_by uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  added_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);

-- 所有者情報テーブル
CREATE TABLE IF NOT EXISTS owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(name, address)
);

-- 物件情報テーブル
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  property_address text NOT NULL,
  owner_id uuid REFERENCES owners(id),
  source_file_name text,
  lat numeric(10, 8),-- 緯度 小数点以下8桁 10桁までなのは、緯度の最大値が90度であるため、90度を超えることはない
  lng numeric(11, 8),-- 経度 小数点以下8桁 11桁までなのは、経度の最大値が180度であるため、180度を超えることはない
  street_view_available boolean DEFAULT false,
  imported_at timestamptz DEFAULT now() NOT NULL,
  imported_by uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, property_address)
);

-- 所有者の会社情報テーブル
CREATE TABLE IF NOT EXISTS owner_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  company_number text,
  position text,
  source_url text NOT NULL,
  rank integer CHECK (rank BETWEEN 1 AND 3) NOT NULL,
  researched_by uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  researched_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(owner_id, rank)
);

-- インポート履歴テーブル（監査用）
CREATE TABLE IF NOT EXISTS import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_count integer NOT NULL,
  property_count integer NOT NULL,
  success_count integer NOT NULL,
  error_count integer NOT NULL,
  imported_by uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  imported_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- 3. インデックス作成（パフォーマンス向上）
-- =============================================

-- project_membersのインデックス
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- ownersのインデックス
CREATE INDEX idx_owners_name ON owners(name);

-- propertiesのインデックス
CREATE INDEX idx_properties_project_id ON properties(project_id);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);

-- owner_companiesのインデックス
CREATE INDEX idx_owner_companies_owner_id ON owner_companies(owner_id);

-- =============================================
-- 4. updated_atの自動更新トリガー
-- =============================================

-- updated_at自動更新関数（既に存在する場合は再作成）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owners_updated_at 
  BEFORE UPDATE ON owners
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. プロジェクト作成時の自動メンバー登録
-- =============================================

-- プロジェクト作成時に作成者をownerとして自動登録する関数
CREATE OR REPLACE FUNCTION add_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- プロジェクト作成後に実行されるトリガー
CREATE TRIGGER auto_add_project_owner
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION add_creator_as_owner();