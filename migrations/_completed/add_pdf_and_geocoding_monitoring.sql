-- PDF解析とGeocoding APIのモニタリング機能追加
-- 実行日: 2025-01-25

-- ============================================
-- 1. api_global_limitsテーブルに新しいAPIを追加
-- ============================================
INSERT INTO api_global_limits (api_name, daily_limit, monthly_limit) VALUES
  ('pdf_parsing', 1000, 30000),
  ('google_maps_geocoding', 500, 15000)
ON CONFLICT (api_name) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_limit = EXCLUDED.monthly_limit,
  updated_at = now();

-- ============================================
-- 2. api_global_usageテーブルに初期レコードを追加
-- ============================================
INSERT INTO api_global_usage (api_name) VALUES
  ('pdf_parsing'),
  ('google_maps_geocoding')
ON CONFLICT (api_name) DO NOTHING;

-- ============================================
-- 3. PDF処理ログテーブルの作成
-- ============================================
CREATE TABLE IF NOT EXISTS pdf_processing_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  file_count integer NOT NULL,
  success_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  processing_time integer, -- ミリ秒
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 4. Geocodingログテーブルの作成
-- ============================================
CREATE TABLE IF NOT EXISTS geocoding_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  address text NOT NULL,
  success boolean NOT NULL,
  lat double precision,
  lng double precision,
  street_view_available boolean,
  api_response_time integer, -- ミリ秒
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 5. インデックスの作成（パフォーマンス向上）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pdf_logs_user_id ON pdf_processing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_logs_created_at ON pdf_processing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_geocoding_logs_user_id ON geocoding_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_geocoding_logs_created_at ON geocoding_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_geocoding_logs_success ON geocoding_logs(success);

-- ============================================
-- 6. RLSポリシーの設定
-- ============================================
ALTER TABLE pdf_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE geocoding_logs ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは自分のログを参照可能
CREATE POLICY "Users can view own pdf logs" ON pdf_processing_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own geocoding logs" ON geocoding_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- システムオーナーは全てのログを参照可能
CREATE POLICY "System owners can view all pdf logs" ON pdf_processing_logs
  FOR SELECT TO authenticated
  USING (is_system_owner());

CREATE POLICY "System owners can view all geocoding logs" ON geocoding_logs
  FOR SELECT TO authenticated
  USING (is_system_owner());

-- ログの挿入は認証済みユーザーのみ（自分のログのみ）
CREATE POLICY "Users can insert own pdf logs" ON pdf_processing_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own geocoding logs" ON geocoding_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 実行確認用クエリ
-- ============================================
-- SELECT * FROM api_global_limits WHERE api_name IN ('pdf_parsing', 'google_maps_geocoding');
-- SELECT * FROM api_global_usage WHERE api_name IN ('pdf_parsing', 'google_maps_geocoding');
-- SELECT * FROM pdf_processing_logs LIMIT 10;
-- SELECT * FROM geocoding_logs LIMIT 10;