# 検索システム データベース設計書

## 1. 概要

検索システムで使用するデータベーステーブルの設計書です。主に以下の2つのテーブルで構成されます：

1. **search_patterns**: ユーザーが作成・保存する検索パターン
2. **search_api_logs**: Google Custom Search APIの使用履歴（監視・分析用）

## 2. テーブル設計

### 2.1 search_patterns（検索パターン）

ユーザーが作成した検索パターンを保存するテーブル。

```sql
CREATE TABLE search_patterns (
  -- 基本情報
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- パターン情報
  name varchar(256) NOT NULL,
  description text,
  
  -- 検索パラメータ（GoogleCustomSearchPatternのparams部分をJSON形式で保存）
  search_params jsonb NOT NULL,
  
  -- 使用統計
  usage_count integer DEFAULT 0,
  
  -- タイムスタンプ
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  last_used_at timestamp with time zone,
  
  -- 制約
  CONSTRAINT search_patterns_name_user_unique UNIQUE(user_id, name)
);

-- インデックス
CREATE INDEX idx_search_patterns_user_id ON search_patterns(user_id);
CREATE INDEX idx_search_patterns_last_used ON search_patterns(user_id, last_used_at DESC);
CREATE INDEX idx_search_patterns_usage ON search_patterns(user_id, usage_count DESC);
```

#### search_paramsの構造例

```json
{
  "customerName": "山田太郎",
  "customerNameExactMatch": "exact",
  "prefecture": "東京都",
  "prefectureExactMatch": "exact",
  "address": "港区赤坂",
  "addressExactMatch": "partial",
  "isAdvancedSearchEnabled": true,
  "additionalKeywords": [
    {"value": "代表取締役", "matchType": "exact"},
    {"value": "CEO", "matchType": "partial"}
  ],
  "additionalKeywordsSearchMode": "or",
  "excludeKeywords": [
    {"value": "求人", "matchType": "exact"}
  ],
  "searchSites": ["linkedin.com", "facebook.com"],
  "siteSearchMode": "specific"
}
```

### 2.2 search_api_logs（API使用履歴）

Google Custom Search APIの呼び出しログを記録し、使用状況を監視するテーブル。

```sql
CREATE TABLE search_api_logs (
  -- 基本情報
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_id uuid REFERENCES search_patterns(id) ON DELETE SET NULL,
  
  -- 検索情報
  search_query text NOT NULL,
  search_params jsonb, -- 完全な検索パラメータ
  
  -- API レスポンス情報
  api_response_time integer, -- レスポンス時間（ミリ秒）
  result_count integer,
  status_code integer NOT NULL,
  error_message text,
  
  -- 使用量追跡
  quota_used integer DEFAULT 1, -- API制限用（複数ページ取得時は増加）
  start_index integer DEFAULT 1, -- ページネーション開始位置
  
  -- メタ情報
  ip_address inet,
  user_agent text,
  
  -- タイムスタンプ
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- インデックス（高速な集計用）
CREATE INDEX idx_api_logs_user_date ON search_api_logs(user_id, created_at DESC);
CREATE INDEX idx_api_logs_pattern ON search_api_logs(pattern_id);
CREATE INDEX idx_api_logs_status ON search_api_logs(status_code);
CREATE INDEX idx_api_logs_created_at ON search_api_logs(created_at DESC);
```

## 3. Row Level Security (RLS) ポリシー

### 3.1 search_patterns

```sql
-- RLSを有効化
ALTER TABLE search_patterns ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のパターンのみ参照可能
CREATE POLICY "Users can view own patterns" ON search_patterns
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のパターンを作成可能
CREATE POLICY "Users can create own patterns" ON search_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のパターンを更新可能
CREATE POLICY "Users can update own patterns" ON search_patterns
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のパターンを削除可能
CREATE POLICY "Users can delete own patterns" ON search_patterns
  FOR DELETE USING (auth.uid() = user_id);
```

### 3.2 search_api_logs

```sql
-- RLSを有効化
ALTER TABLE search_api_logs ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のログのみ参照可能
CREATE POLICY "Users can view own logs" ON search_api_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のログを作成可能
CREATE POLICY "Users can create own logs" ON search_api_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ログの更新・削除は不可（監査目的）
```

## 4. トリガーとファンクション

### 4.1 更新日時の自動更新

```sql
-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- search_patternsテーブルにトリガーを設定
CREATE TRIGGER update_search_patterns_updated_at 
  BEFORE UPDATE ON search_patterns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 使用回数の自動更新

```sql
-- APIログ挿入時にパターンの使用回数を更新
CREATE OR REPLACE FUNCTION update_pattern_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pattern_id IS NOT NULL AND NEW.status_code = 200 THEN
    UPDATE search_patterns
    SET 
      usage_count = usage_count + 1,
      last_used_at = NOW()
    WHERE id = NEW.pattern_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_pattern_usage_on_api_log
  AFTER INSERT ON search_api_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_usage();
```

## 5. API使用状況の監視

### 5.1 集計ビュー

```sql
-- 日次使用状況サマリー
CREATE VIEW daily_api_usage AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status_code = 200 THEN 1 END) as successful_requests,
  COUNT(CASE WHEN status_code != 200 THEN 1 END) as failed_requests,
  SUM(quota_used) as total_quota_used,
  AVG(api_response_time) as avg_response_time_ms,
  MAX(api_response_time) as max_response_time_ms
FROM search_api_logs
GROUP BY user_id, DATE(created_at);

-- 月次使用状況サマリー
CREATE VIEW monthly_api_usage AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_requests,
  SUM(quota_used) as total_quota_used,
  COUNT(DISTINCT pattern_id) as unique_patterns_used,
  COUNT(DISTINCT DATE(created_at)) as active_days
FROM search_api_logs
GROUP BY user_id, DATE_TRUNC('month', created_at);
```

### 5.2 使用状況の取得例

```sql
-- 今月の使用状況
SELECT * FROM monthly_api_usage
WHERE user_id = ? 
  AND month = DATE_TRUNC('month', CURRENT_DATE);

-- 直近7日間のエラー率
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status_code != 200 THEN 1 END) as failed_requests,
  ROUND(
    COUNT(CASE WHEN status_code != 200 THEN 1 END)::numeric / COUNT(*) * 100, 
    2
  ) as error_rate_percent
FROM search_api_logs
WHERE user_id = ?
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- パターン別の使用頻度ランキング
SELECT 
  sp.id,
  sp.name,
  sp.usage_count,
  sp.last_used_at,
  COUNT(sal.id) as recent_uses
FROM search_patterns sp
LEFT JOIN search_api_logs sal 
  ON sp.id = sal.pattern_id 
  AND sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE sp.user_id = ?
GROUP BY sp.id, sp.name, sp.usage_count, sp.last_used_at
ORDER BY recent_uses DESC, sp.usage_count DESC
LIMIT 10;
```

## 6. 実装時の注意事項

### 6.1 パフォーマンス考慮

- `search_params`のJSONB型により、柔軟な検索条件の保存が可能
- 適切なインデックスにより、大量のログデータでも高速な集計が可能
- ビューを使用することで、複雑な集計クエリを簡素化

### 6.2 データ保持ポリシー

- API使用ログは監査とコスト管理のため、最低1年間保持を推奨
- 古いログのアーカイブやパーティショニングを検討

### 6.3 拡張性

- 将来的な機能追加（共有パターン、タグ付けなど）に対応できる設計
- API制限や課金システムの実装に必要な情報を記録

## 7. マイグレーションSQL

完全なマイグレーションファイルは以下の通り：

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create search_patterns table
CREATE TABLE IF NOT EXISTS search_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name varchar(256) NOT NULL,
  description text,
  search_params jsonb NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  last_used_at timestamp with time zone,
  CONSTRAINT search_patterns_name_user_unique UNIQUE(user_id, name)
);

-- Create search_api_logs table
CREATE TABLE IF NOT EXISTS search_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_id uuid REFERENCES search_patterns(id) ON DELETE SET NULL,
  search_query text NOT NULL,
  search_params jsonb,
  api_response_time integer,
  result_count integer,
  status_code integer NOT NULL,
  error_message text,
  quota_used integer DEFAULT 1,
  start_index integer DEFAULT 1,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_search_patterns_user_id ON search_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_search_patterns_last_used ON search_patterns(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_patterns_usage ON search_patterns(user_id, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_date ON search_api_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_pattern ON search_api_logs(pattern_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON search_api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON search_api_logs(created_at DESC);

-- Enable RLS
ALTER TABLE search_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_api_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own patterns" ON search_patterns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own patterns" ON search_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns" ON search_patterns
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patterns" ON search_patterns
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own logs" ON search_api_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own logs" ON search_api_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_search_patterns_updated_at 
  BEFORE UPDATE ON search_patterns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_pattern_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pattern_id IS NOT NULL AND NEW.status_code = 200 THEN
    UPDATE search_patterns
    SET 
      usage_count = usage_count + 1,
      last_used_at = NOW()
    WHERE id = NEW.pattern_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pattern_usage_on_api_log
  AFTER INSERT ON search_api_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_usage();

-- Create views
CREATE OR REPLACE VIEW daily_api_usage AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status_code = 200 THEN 1 END) as successful_requests,
  COUNT(CASE WHEN status_code != 200 THEN 1 END) as failed_requests,
  SUM(quota_used) as total_quota_used,
  AVG(api_response_time) as avg_response_time_ms,
  MAX(api_response_time) as max_response_time_ms
FROM search_api_logs
GROUP BY user_id, DATE(created_at);

CREATE OR REPLACE VIEW monthly_api_usage AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_requests,
  SUM(quota_used) as total_quota_used,
  COUNT(DISTINCT pattern_id) as unique_patterns_used,
  COUNT(DISTINCT DATE(created_at)) as active_days
FROM search_api_logs
GROUP BY user_id, DATE_TRUNC('month', created_at);
```
