-- =============================================
-- API使用追跡テーブルの作成
-- =============================================
-- このファイルは、外部API（Google Maps、OpenAI等）の使用履歴と
-- コストを追跡するためのテーブルを定義します。

-- =============================================
-- 1. API使用履歴テーブル
-- =============================================
-- 外部APIの呼び出し履歴とコストを記録
CREATE TABLE IF NOT EXISTS api_usage_logs (
  -- レコードの一意識別子
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- APIを実行したユーザーのID
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  
  -- 関連するプロジェクトのID（任意）
  -- バッチ処理など、特定のプロジェクトに紐づく場合に使用
  project_id uuid REFERENCES projects(id),
  
  -- API提供元の識別子
  -- 値の例:
  -- 'google_maps': Google Maps Platform各種API
  -- 'openai': OpenAI API (GPT-4, GPT-3.5等)
  -- 'deepl': DeepL翻訳API
  -- 'aws_textract': AWS Textract (OCR)
  -- 'azure_cognitive': Azure Cognitive Services
  api_provider text NOT NULL,
  
  -- 使用したAPIエンドポイント
  -- Google Maps の例:
  --   'geocoding': 住所→座標変換
  --   'reverse_geocoding': 座標→住所変換
  --   'places': Places API
  --   'streetview': Street View Static API
  --   'directions': Directions API
  -- OpenAI の例:
  --   'gpt-4': GPT-4モデル
  --   'gpt-3.5-turbo': GPT-3.5 Turboモデル
  --   'embeddings': テキスト埋め込み
  api_endpoint text NOT NULL,
  
  -- 1回の処理でのAPIコール数
  -- 単一リクエスト: 1
  -- バッチ処理: 実際のリクエスト数（例: 100件の住所を一括処理 = 100）
  request_count integer DEFAULT 1 CHECK (request_count > 0),
  
  -- APIレスポンスの状態
  -- 'success': 正常終了
  -- 'error': エラー発生
  -- 'rate_limited': レート制限エラー
  -- 'quota_exceeded': 割当量超過エラー
  -- 'partial_success': 部分的成功（バッチ処理で一部失敗）
  response_status text NOT NULL,
  
  -- APIレスポンス時間（ミリ秒）
  -- パフォーマンス監視とタイムアウト分析に使用
  response_time_ms integer CHECK (response_time_ms >= 0),
  
  -- API使用料金（USD換算）
  -- 小数点以下6桁まで記録（$0.000001 = 0.0001セント）
  -- Google Geocoding: $0.005/request
  -- GPT-4: $0.03/1K input tokens, $0.06/1K output tokens
  cost_amount numeric(10, 6) CHECK (cost_amount >= 0),
  
  -- 通貨コード（ISO 4217）
  -- デフォルト: 'USD'
  -- 他の例: 'JPY', 'EUR', 'GBP'
  cost_currency text DEFAULT 'USD' NOT NULL,
  
  -- APIリクエストの要約（JSONB形式）
  -- 機密情報（APIキー等）は含めない
  -- 例: {
  --   "batch_size": 50,
  --   "addresses_sample": ["東京都渋谷区...", "..."],
  --   "options": {"language": "ja", "region": "JP"},
  --   "model": "gpt-4",
  --   "tokens": {"input": 1500, "output": 500}
  -- }
  request_payload jsonb,
  
  -- APIレスポンスの要約（JSONB形式）
  -- 例: {
  --   "success_count": 47,
  --   "error_count": 3,
  --   "error_types": {"ZERO_RESULTS": 2, "INVALID_REQUEST": 1},
  --   "cache_hit": false,
  --   "tokens_used": {"total": 2000, "prompt": 1500, "completion": 500}
  -- }
  response_summary jsonb,
  
  -- エラーメッセージ（エラー時のみ）
  -- APIから返されたエラーメッセージを記録
  error_message text,
  
  -- API実行日時
  created_at timestamptz DEFAULT now() NOT NULL
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_project_id ON api_usage_logs(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_api_usage_logs_provider ON api_usage_logs(api_provider, api_endpoint);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_logs_status ON api_usage_logs(response_status);

-- =============================================
-- 2. API使用量月次集計ビュー
-- =============================================
-- 月次でのAPI使用量とコストを集計
CREATE VIEW api_usage_monthly AS
SELECT 
  user_id,
  api_provider,
  api_endpoint,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_requests,
  SUM(request_count) as total_api_calls,
  SUM(cost_amount) as total_cost_usd,
  AVG(response_time_ms) as avg_response_time_ms,
  COUNT(CASE WHEN response_status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN response_status = 'error' THEN 1 END) as error_count,
  COUNT(CASE WHEN response_status = 'rate_limited' THEN 1 END) as rate_limited_count
FROM api_usage_logs
GROUP BY user_id, api_provider, api_endpoint, DATE_TRUNC('month', created_at);

-- =============================================
-- 3. APIコスト上限管理テーブル
-- =============================================
-- ユーザーまたはプロジェクト単位でのコスト上限を管理
CREATE TABLE IF NOT EXISTS api_cost_limits (
  -- レコードの一意識別子
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ユーザーID（ユーザー単位の上限設定時）
  user_id uuid REFERENCES auth.users(id),
  
  -- 検索プロジェクトID（プロジェクト単位の上限設定時）
  project_id uuid REFERENCES projects(id),
  
  -- API提供元
  -- 'all': 全API合計
  -- または特定のプロバイダー名
  api_provider text NOT NULL,
  
  -- 上限の種類
  -- 'monthly': 月間上限
  -- 'daily': 日次上限
  -- 'per_project': プロジェクトごとの上限
  limit_type text CHECK (limit_type IN ('monthly', 'daily', 'per_project')) NOT NULL,
  
  -- 上限金額（USD）
  limit_amount numeric(10, 2) NOT NULL CHECK (limit_amount > 0),
  
  -- アラート閾値（0.0〜1.0）
  -- デフォルト: 0.8（80%でアラート）
  alert_threshold numeric(3, 2) DEFAULT 0.8 CHECK (alert_threshold BETWEEN 0 AND 1),
  
  -- アラート送信先メールアドレス（任意）
  alert_email text,
  
  -- 有効フラグ
  is_active boolean DEFAULT true NOT NULL,
  
  -- 作成日時
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- 更新日時
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- ユーザー単位またはプロジェクト単位のいずれか一方のみ設定可能
  CONSTRAINT check_user_or_search CHECK (
    (user_id IS NOT NULL AND project_id IS NULL) OR 
    (user_id IS NULL AND project_id IS NOT NULL)
  )
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_api_cost_limits_user_id ON api_cost_limits(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_api_cost_limits_project_id ON api_cost_limits(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_api_cost_limits_active ON api_cost_limits(is_active) WHERE is_active = true;

-- =============================================
-- 4. APIプロバイダー料金マスタ
-- =============================================
-- 各APIの料金体系を管理（参考情報）
CREATE TABLE IF NOT EXISTS api_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_provider text NOT NULL,
  api_endpoint text NOT NULL,
  pricing_model text NOT NULL, -- 'per_request', 'per_token', 'per_second'
  unit_price numeric(10, 6) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  effective_date date NOT NULL,
  end_date date,
  notes text,
  
  UNIQUE(api_provider, api_endpoint, effective_date)
);

-- サンプルデータ
INSERT INTO api_pricing (api_provider, api_endpoint, pricing_model, unit_price, effective_date, notes) VALUES
('google_maps', 'geocoding', 'per_request', 0.005, '2024-01-01', 'Per request pricing'),
('google_maps', 'streetview', 'per_request', 0.007, '2024-01-01', 'Static Street View'),
('openai', 'gpt-4', 'per_token', 0.00003, '2024-01-01', 'Input tokens (per token)'),
('openai', 'gpt-3.5-turbo', 'per_token', 0.0000015, '2024-01-01', 'Input tokens (per token)')
ON CONFLICT (api_provider, api_endpoint, effective_date) DO NOTHING;

-- =============================================
-- 5. RLSポリシーの設定
-- =============================================

-- RLSを有効化
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cost_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_pricing ENABLE ROW LEVEL SECURITY;

-- api_usage_logsのRLSポリシー
-- 自分のAPI使用履歴のみ閲覧可能
CREATE POLICY "Users can view own api usage" 
  ON api_usage_logs FOR SELECT 
  TO authenticated 
  USING (
    user_id = (SELECT auth.uid())
    OR project_id IN (SELECT user_project_ids())
  );

-- 認証済みユーザーはAPI使用履歴を作成可能
CREATE POLICY "Users can insert api usage" 
  ON api_usage_logs FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (SELECT auth.uid()));

-- api_cost_limitsのRLSポリシー
-- 自分の上限設定のみ管理可能
CREATE POLICY "Users can manage own cost limits" 
  ON api_cost_limits FOR ALL 
  TO authenticated 
  USING (
    user_id = (SELECT auth.uid())
    OR project_id IN (
      SELECT id FROM projects WHERE created_by = (SELECT auth.uid())
    )
  );

-- api_pricingのRLSポリシー
-- 全ユーザーが料金情報を閲覧可能
CREATE POLICY "All users can view pricing" 
  ON api_pricing FOR SELECT 
  TO authenticated 
  USING (true);

-- =============================================
-- 6. トリガー関数
-- =============================================

-- コスト上限チェック関数
CREATE OR REPLACE FUNCTION check_api_cost_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_usage numeric;
  limit_record record;
BEGIN
  -- 該当する上限設定を取得
  SELECT * INTO limit_record
  FROM api_cost_limits
  WHERE is_active = true
    AND api_provider IN (NEW.api_provider, 'all')
    AND (
      (user_id = NEW.user_id AND limit_type IN ('monthly', 'daily'))
      OR (project_id = NEW.project_id AND limit_type = 'per_project')
    )
  ORDER BY limit_amount ASC
  LIMIT 1;
  
  IF limit_record IS NOT NULL THEN
    -- 現在の使用量を計算
    SELECT COALESCE(SUM(cost_amount), 0) INTO current_usage
    FROM api_usage_logs
    WHERE user_id = NEW.user_id
      AND (
        (limit_record.limit_type = 'monthly' AND created_at >= DATE_TRUNC('month', CURRENT_DATE))
        OR (limit_record.limit_type = 'daily' AND created_at >= DATE_TRUNC('day', CURRENT_DATE))
        OR (limit_record.limit_type = 'per_project' AND project_id = NEW.project_id)
      );
    
    -- 上限チェック
    IF current_usage + NEW.cost_amount > limit_record.limit_amount THEN
      RAISE EXCEPTION 'API cost limit exceeded. Current: %, Limit: %', 
        current_usage + NEW.cost_amount, limit_record.limit_amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- コスト上限チェックトリガー
CREATE TRIGGER check_cost_before_insert
  BEFORE INSERT ON api_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_api_cost_limit();

-- =============================================
-- 7. ヘルパー関数
-- =============================================

-- 月次コストサマリーを取得する関数
CREATE OR REPLACE FUNCTION get_monthly_api_cost_summary(
  p_user_id uuid DEFAULT NULL,
  p_month date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  api_provider text,
  total_requests bigint,
  total_cost numeric,
  success_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aul.api_provider,
    COUNT(*)::bigint as total_requests,
    SUM(aul.cost_amount) as total_cost,
    ROUND(
      COUNT(CASE WHEN aul.response_status = 'success' THEN 1 END)::numeric / 
      COUNT(*)::numeric * 100, 
      2
    ) as success_rate
  FROM api_usage_logs aul
  WHERE (p_user_id IS NULL OR aul.user_id = p_user_id)
    AND DATE_TRUNC('month', aul.created_at) = DATE_TRUNC('month', p_month)
  GROUP BY aul.api_provider
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;