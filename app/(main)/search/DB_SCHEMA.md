# 検索システム データベース設計書

## 1. 概要

検索システムで使用するデータベーステーブルの設計書です。主に以下の2つのテーブルで構成されます：

1. **search_patterns**: ユーザーが作成・保存する検索パターン
2. **search_api_logs**: Google Custom Search APIの使用履歴（監視・分析用）

### 設計の特徴
- **柔軟性重視**: 検索パラメータをJSONB型で保存し、Zodスキーマで管理
- **仕様変更対応**: DBスキーマの変更なしに、アプリケーション層での対応が可能
- **型安全性**: Zodによる実行時バリデーションで、型の整合性を保証

## 2. テーブル設計

### 2.1 search_patterns（検索パターン）

ユーザーが作成した検索パターンを保存するテーブル。

```sql
CREATE TABLE search_patterns (
  -- 基本情報
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- パターン情報
  name text NOT NULL,
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

-- JSONB用のGINインデックス（検索性能向上）
CREATE INDEX idx_search_patterns_params ON search_patterns USING GIN (search_params);
```

#### search_paramsの構造例

```json
{
  "customerName": "山田太郎",
  "customerNameExactMatch": "exact",
  "address": "東京都港区赤坂",
  "addressExactMatch": "partial",
  "dateRestrict": "y1",
  "isAdvancedSearchEnabled": true,
  "additionalKeywords": [
    {"value": "代表取締役", "matchType": "exact"},
    {"value": "CEO", "matchType": "partial"}
  ],
  "searchSites": ["linkedin.com", "facebook.com"],
  "siteSearchMode": "specific"
}
```

**注意**: 以下のフィールドは簡素化のため廃止されました：
- `prefecture`と`prefectureExactMatch` - 住所フィールドに統合
- `additionalKeywordsSearchMode` - 常にOR検索で固定
- `excludeKeywords` - 除外キーワード機能全体を廃止

**新規追加フィールド**:
- `dateRestrict` - 検索期間の指定（空文字、y1、y3、y5、y10）

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

### 3.1 RLSベストプラクティスに基づく設計

#### パフォーマンス最適化のポイント（Supabase公式推奨）
1. **インデックスの活用**: RLSポリシーで使用するカラムには必ずインデックスを作成
2. **select文でのラップ**: 関数呼び出しは`(select auth.uid())`のようにラップする
3. **明示的なフィルタ追加**: RLSポリシーに加えてクエリでも明示的にフィルタを指定
4. **結合の最小化**: JOINの代わりに配列とIN/ANY演算子を使用
5. **ロールの明示**: ポリシーでは`TO`演算子で対象ロールを指定

### 3.2 search_patterns

```sql
-- RLSを有効化
ALTER TABLE search_patterns ENABLE ROW LEVEL SECURITY;

-- インデックスがあることを確認（RLSパフォーマンス向上）
-- CREATE INDEX idx_search_patterns_user_id ON search_patterns(user_id); -- 既に作成済み

-- RLSポリシー（公式推奨パターン）
-- FOR ALLを使用した統合ポリシー（個別のSELECT/INSERT/UPDATE/DELETEより効率的）
CREATE POLICY "Enable access to own patterns" ON search_patterns
  FOR ALL 
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
```

### 3.3 search_api_logs

```sql
-- RLSを有効化
ALTER TABLE search_api_logs ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー（ログは変更不可）
CREATE POLICY "Users can view own logs" ON search_api_logs
  FOR SELECT 
  TO authenticated
  USING (user_id = (select auth.uid()));

-- 挿入のみ許可（更新・削除は不可）
CREATE POLICY "Users can insert own logs" ON search_api_logs
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
```

### 3.4 クエリの最適化

```sql
-- ❌ 避けるべきパターン（RLSのみに依存）
const { data } = await supabase
  .from('search_patterns')
  .select('*');

-- ✅ 推奨パターン（明示的なフィルタを追加）
const { data } = await supabase
  .from('search_patterns')
  .select('*')
  .eq('user_id', userId); // RLSに加えて明示的にフィルタ

-- パフォーマンステスト用クエリ
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM search_patterns 
WHERE user_id = (select auth.uid())
LIMIT 10;
```

### 3.5 SECURITY DEFINER関数の使用（複雑なロジックの場合）

```sql
-- 複雑なビジネスロジックをカプセル化する場合のみ使用
CREATE OR REPLACE FUNCTION get_user_patterns_with_stats(p_user_id uuid)
RETURNS TABLE (
  pattern_id uuid,
  pattern_name text,
  usage_count integer,
  last_30_days_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.name,
    sp.usage_count,
    COUNT(sal.id) as last_30_days_count
  FROM search_patterns sp
  LEFT JOIN search_api_logs sal 
    ON sp.id = sal.pattern_id 
    AND sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
  WHERE sp.user_id = p_user_id
  GROUP BY sp.id, sp.name, sp.usage_count;
$$;
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

### 6.1 JSONBとZodによる柔軟な設計

#### 設計方針
- **データベース**: `search_params`をJSONB型で保存
- **バリデーション**: Zodスキーマでアプリケーション層での型検証
- **利点**: DBスキーマ変更なしに仕様変更に対応可能

#### 実装例
```typescript
// lib/schemas/custom-search.ts
export const googleCustomSearchParamsSchema = z.object({
  customerName: z.string(),
  customerNameExactMatch: z.enum(['exact', 'partial']),
  address: z.string().optional(),
  addressExactMatch: z.enum(['exact', 'partial']),
  dateRestrict: z.enum(['', 'y1', 'y3', 'y5', 'y10']).optional(),
  isAdvancedSearchEnabled: z.boolean(),
  additionalKeywords: z.array(keywordsSchema),
  searchSites: z.array(z.string()),
  siteSearchMode: z.enum(['any', 'specific', 'exclude']),
});

// 使用時
const params = googleCustomSearchParamsSchema.parse(pattern.search_params);
```

#### 仕様変更時の対応
1. Zodスキーマを更新
2. 新しいフィールドにはデフォルト値を設定
3. 既存データは自動的に新スキーマに適合
4. DBマイグレーション不要

### 6.2 パフォーマンス考慮

- JSONB型のGINインデックスで検索性能を確保
- 適切なインデックスにより、大量のログデータでも高速な集計が可能
- ビューを使用することで、複雑な集計クエリを簡素化

### 6.3 データ保持ポリシー

- API使用ログは監査とコスト管理のため、最低1年間保持を推奨
- 古いログのアーカイブやパーティショニングを検討

### 6.4 拡張性

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
  name text NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_search_patterns_params ON search_patterns USING GIN (search_params);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_date ON search_api_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_pattern ON search_api_logs(pattern_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON search_api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON search_api_logs(created_at DESC);

-- Enable RLS
ALTER TABLE search_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_api_logs ENABLE ROW LEVEL SECURITY;

-- Create optimized RLS policies
CREATE POLICY "Enable access to own patterns" ON search_patterns
  FOR ALL 
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view own logs" ON search_api_logs
  FOR SELECT 
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own logs" ON search_api_logs
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

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
