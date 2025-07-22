# 検索システム データベース設計書

## 1. 概要

検索システムで使用するデータベーステーブルの設計書です。主に以下の 2 つのテーブルで構成されます：

1. **search_patterns**: ユーザーが作成・保存する検索パターン
2. **search_api_logs**: Google Custom Search API の使用履歴（監視・分析用）

### 前提条件

- **環境**: Supabase（東京リージョン: ap-northeast-1）
- **必要な拡張機能**:
  - `uuid-ossp` v1.1 ✅ 有効化済み
  - `pg_cron` v1.6 ✅ 有効化済み
  - `pgcrypto` v1.3 ✅ 有効化済み

### 設計の特徴

- **柔軟性重視**: 検索パラメータを JSONB 型で保存し、Zod スキーマで管理
- **仕様変更対応**: DB スキーマの変更なしに、アプリケーション層での対応が可能
- **型安全性**: Zod による実行時バリデーションで、型の整合性を保証

## 2. テーブル設計

### 2.1 search_patterns（検索パターン）

ユーザーが作成した検索パターンを保存するテーブル。

```sql
CREATE TABLE search_patterns (
  -- 基本情報
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),

  -- パターン情報
  name text NOT NULL,
  description text,

  -- 検索パラメータ（GoogleCustomSearchPatternのparams部分をJSON形式で保存）
  google_custom_search_params jsonb NOT NULL,

  -- 使用統計
  usage_count integer DEFAULT 0,  -- ダッシュボードでの高速表示用（search_api_logsとの結合を避ける）

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

```

#### google_custom_search_params の構造例

```json
{
  "customerName": "山田太郎",
  "customerNameExactMatch": "exact",
  "address": "東京都港区赤坂",
  "addressExactMatch": "partial",
  "dateRestrict": "y1",
  "isAdvancedSearchEnabled": true,
  "additionalKeywords": [
    { "value": "代表取締役", "matchType": "exact" },
    { "value": "CEO", "matchType": "partial" }
  ],
  "searchSites": ["linkedin.com", "facebook.com"],
  "siteSearchMode": "specific"
}
```

**注意**: 以下のフィールドは簡素化のため廃止されました：

- `prefecture`と`prefectureExactMatch` - 住所フィールドに統合
- `additionalKeywordsSearchMode` - 常に OR 検索で固定
- `excludeKeywords` - 除外キーワード機能全体を廃止

**新規追加フィールド**:

- `dateRestrict` - 検索期間の指定（空文字、y1、y3、y5、y10）

### 2.2 search_api_logs（API 使用履歴）

Google Custom Search API の呼び出しログを記録し、使用状況を監視するテーブル。

```sql
CREATE TABLE search_api_logs (
  -- 基本情報
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  pattern_id uuid REFERENCES search_patterns(id) ON DELETE SET NULL,

  -- 検索情報
  google_custom_search_params jsonb NOT NULL, -- 完全な検索パラメータ（検索クエリを含む）

  -- API レスポンス情報
  api_response_time integer, -- レスポンス時間（ミリ秒）
  result_count integer,
  status_code integer NOT NULL,
  error_message text,

  -- メタ情報
  ip_address inet,
  user_agent text,

  -- タイムスタンプ
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- インデックス（高速な集計用）
CREATE INDEX idx_api_logs_user_date ON search_api_logs(user_id, created_at DESC);
CREATE INDEX idx_api_logs_project_date ON search_api_logs(project_id, created_at DESC);
CREATE INDEX idx_api_logs_pattern ON search_api_logs(pattern_id);
CREATE INDEX idx_api_logs_status ON search_api_logs(status_code);
CREATE INDEX idx_api_logs_created_at ON search_api_logs(created_at DESC);

-- インデックス命名規則：idx_[テーブル名]_[カラム名]
-- 複合インデックス：idx_[テーブル名]_[カラム1]_[カラム2]
```

## 3. Row Level Security (RLS) ポリシー

### 3.1 RLS ベストプラクティスに基づく設計

#### パフォーマンス最適化のポイント（Supabase 公式推奨）

1. **インデックスの活用**: RLS ポリシーで使用するカラムには必ずインデックスを作成
2. **select 文でのラップ**: 関数呼び出しは`(select auth.uid())`のようにラップする
3. **明示的なフィルタ追加**: RLS ポリシーに加えてクエリでも明示的にフィルタを指定
4. **結合の最小化**: JOIN の代わりに配列と IN/ANY 演算子を使用
5. **ロールの明示**: ポリシーでは`TO`演算子で対象ロールを指定

### 3.2 search_patterns

```sql
-- RLSを有効化
ALTER TABLE search_patterns ENABLE ROW LEVEL SECURITY;

-- インデックスがあることを確認（RLSパフォーマンス向上）
-- CREATE INDEX idx_search_patterns_user_id ON search_patterns(user_id); -- 既に作成済み

-- RLSポリシー
-- 検索パターンのアクセス制御（個人のパターンのみアクセス可能）
CREATE POLICY "search_patterns_select" ON search_patterns
  FOR SELECT
  TO authenticated
  USING (
    is_system_owner() OR
    user_id = (select auth.uid())
  );

CREATE POLICY "search_patterns_insert" ON search_patterns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
  );

CREATE POLICY "search_patterns_update" ON search_patterns
  FOR UPDATE
  TO authenticated
  USING (
    is_system_owner() OR
    user_id = (select auth.uid())
  )
  WITH CHECK (
    user_id = (select auth.uid())
  );

CREATE POLICY "search_patterns_delete" ON search_patterns
  FOR DELETE
  TO authenticated
  USING (
    is_system_owner() OR
    user_id = (select auth.uid())
  );
```

### 3.3 search_api_logs

```sql
-- RLSを有効化
ALTER TABLE search_api_logs ENABLE ROW LEVEL SECURITY;

-- APIログのアクセス制御（system_ownerのみ閲覧可能）
CREATE POLICY "search_api_logs_select" ON search_api_logs
  FOR SELECT
  TO authenticated
  USING (is_system_owner());

CREATE POLICY "search_api_logs_insert" ON search_api_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (SELECT user_accessible_projects())
  );

-- テーブルにコメントを追加
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

### 3.5 SECURITY DEFINER 関数の使用（複雑なロジックの場合）

```sql
-- ダッシュボード用の高速パターン統計取得（usage_countを活用）
CREATE OR REPLACE FUNCTION get_user_patterns_with_stats(p_user_id uuid)
RETURNS TABLE (
  pattern_id uuid,
  pattern_name text,
  total_usage_count integer,
  last_30_days_count bigint,
  last_used_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sp.id,
    sp.name,
    sp.usage_count as total_usage_count,  -- 事前集計値を使用（高速）
    COUNT(DISTINCT sal.id) as last_30_days_count,  -- 最近の使用のみ集計
    sp.last_used_at
  FROM search_patterns sp
  LEFT JOIN search_api_logs sal
    ON sp.id = sal.pattern_id
    AND sal.status_code = 200
    AND sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
  WHERE sp.user_id = p_user_id
  GROUP BY sp.id, sp.name, sp.usage_count, sp.last_used_at;
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

### 4.2 最終使用日時の自動更新

```sql
-- APIログ挿入時にパターンの使用回数と最終使用日時を更新
CREATE OR REPLACE FUNCTION update_pattern_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pattern_id IS NOT NULL AND NEW.status_code = 200 THEN
    BEGIN
      UPDATE search_patterns
      SET
        usage_count = usage_count + 1,
        last_used_at = NOW()
      WHERE id = NEW.pattern_id;
    EXCEPTION WHEN OTHERS THEN
      -- エラーが発生してもAPIログの記録は継続
      RAISE WARNING 'Failed to update pattern usage for pattern_id %: %', NEW.pattern_id, SQLERRM;
    END;
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

## 5. API 使用状況の監視

### 使用状況の取得例

```sql
-- プロジェクト別の月次使用状況
SELECT
  p.id as project_id,
  p.name as project_name,
  DATE_TRUNC('month', sal.created_at) as month,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN sal.status_code = 200 THEN 1 END) as successful_requests,
  AVG(sal.api_response_time) as avg_response_time_ms
FROM search_api_logs sal
JOIN projects p ON sal.project_id = p.id
WHERE p.id = $1  -- プレースホルダーを使用
  AND sal.created_at >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY p.id, p.name, DATE_TRUNC('month', sal.created_at)
ORDER BY month DESC;

-- 組織全体の使用状況（全プロジェクト合計）
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_requests,
  COUNT(DISTINCT project_id) as active_projects,
  COUNT(DISTINCT user_id) as active_users
FROM search_api_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ユーザーのパターン別使用頻度（usage_countを活用した高速版）
SELECT
  sp.id,
  sp.name,
  sp.usage_count,  -- 事前集計された使用回数
  sp.last_used_at,
  COUNT(DISTINCT sal.id) as recent_project_usage  -- 特定プロジェクトの最近の使用のみ集計
FROM search_patterns sp
LEFT JOIN search_api_logs sal
  ON sp.id = sal.pattern_id
  AND sal.project_id = $1  -- 特定プロジェクトでの使用
  AND sal.status_code = 200
  AND sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE sp.user_id = (select auth.uid())
GROUP BY sp.id, sp.name, sp.usage_count, sp.last_used_at
ORDER BY sp.usage_count DESC, sp.last_used_at DESC NULLS LAST
LIMIT 10;
```

## 6. 実装時の注意事項

### 6.1 JSONB と Zod による柔軟な設計

#### 設計方針

- **データベース**: `google_custom_search_params`を JSONB 型で保存
- **バリデーション**: Zod スキーマでアプリケーション層での型検証
- **利点**: DB スキーマ変更なしに仕様変更に対応可能

#### 実装例

```typescript
// lib/schemas/custom-search.ts
export const googleCustomSearchParamsSchema = z.object({
  customerName: z.string(),
  customerNameExactMatch: z.enum(["exact", "partial"]),
  address: z.string().optional(),
  addressExactMatch: z.enum(["exact", "partial"]),
  dateRestrict: z.enum(["", "y1", "y3", "y5", "y10"]).optional(),
  isAdvancedSearchEnabled: z.boolean(),
  additionalKeywords: z.array(keywordsSchema),
  searchSites: z.array(z.string()),
  siteSearchMode: z.enum(["any", "specific", "exclude"]),
});

// 使用時
const params = googleCustomSearchParamsSchema.parse(pattern.google_custom_search_params);
```

#### 仕様変更時の対応

1. Zod スキーマを更新
2. 新しいフィールドにはデフォルト値を設定
3. 既存データは自動的に新スキーマに適合
4. DB マイグレーション不要

### 6.2 パフォーマンス考慮

- 適切なインデックスにより、大量のログデータでも高速な集計が可能

### 6.3 データ保持ポリシー

#### 自動削除機能（pg_cron使用）

API使用ログの自動削除をpg_cronで実装し、ストレージコストを最適化します。

```sql
-- 1. Supabase Dashboardでpg_cron拡張を有効化 ✅ 有効化済み (v1.6)
-- Database → Extensions → pg_cron を有効化

-- 2. 自動削除ジョブの設定（1年以上前のログを毎日削除）
-- 日本時間深夜2時に実行する場合は '0 17 * * *' に変更
SELECT cron.schedule(
  'delete-old-api-logs',
  '0 17 * * *',  -- 毎日深夜2時（JST） = 17時（UTC）
  $$DELETE FROM search_api_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year'$$
);

-- 3. ジョブの確認
SELECT * FROM cron.job;

-- 4. ジョブの削除（必要な場合）
-- SELECT cron.unschedule('delete-old-api-logs');
```

#### 保持期間ポリシー

- **保持期間**: 1年間（監査とコスト分析のため）
- **削除タイミング**: 毎日深夜2時（JST）に自動実行
- **対象データ**: created_atが1年以上前のレコード

#### 運用時の確認クエリ

```sql
-- 削除対象の件数を事前確認
SELECT COUNT(*) as delete_target_count
FROM search_api_logs 
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- 月別のログ件数を確認（データ量の把握）
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as log_count,
  pg_size_pretty(SUM(pg_column_size(search_api_logs.*))::bigint) as estimated_size
FROM search_api_logs
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- 直近の削除実行状況を確認
SELECT 
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'delete-old-api-logs';
```

#### 実装手順

1. **pg_cron拡張の有効化** ✅ 完了
   - Supabase Dashboard → Database → Extensions
   - pg_cronを検索して有効化
   - **現状**: pg_cron v1.6 有効化済み（2025年1月時点）

2. **削除ジョブの登録**
   - SQL Editorで上記のcron.scheduleクエリを実行

3. **動作確認**
   - cron.jobテーブルでジョブが登録されていることを確認
   - 翌日以降、古いログが削除されているか確認

#### 注意事項

- pg_cronはUTCで動作するため、日本時間深夜2時は'0 17 * * *'を指定
- 大量削除時のパフォーマンスへの影響を考慮し、深夜時間帯に実行
- 削除前に必ずバックアップまたはエクスポートの必要性を検討
- DEFAULT auth.uid()はアプリケーション側で明示的にuser_idを設定する場合でも動作

### 6.4 拡張性

- 将来的な機能追加（共有パターン、タグ付けなど）に対応できる設計
- API 制限や課金システムの実装に必要な情報を記録

### 6.5 型定義の使用例

```typescript
// データベース型の使用例
import { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

// Row型（データ取得時）
type SearchPattern = Tables<'search_patterns'>
type SearchApiLog = Tables<'search_api_logs'>

// Insert型（データ挿入時）
type SearchPatternInsert = TablesInsert<'search_patterns'>
type SearchApiLogInsert = TablesInsert<'search_api_logs'>

// Update型（データ更新時）
type SearchPatternUpdate = TablesUpdate<'search_patterns'>

// 使用例
const pattern: SearchPattern = await getSearchPattern(id);
const newPattern: SearchPatternInsert = {
  name: 'パターン名',
  google_custom_search_params: { /* ... */ }
};
```

## 7. 今後の拡張候補

### スケーリング対応
- **GINインデックスの追加**: `google_custom_search_params`のJSONB検索が遅くなった場合
  ```sql
  CREATE INDEX idx_search_patterns_params ON search_patterns USING GIN (google_custom_search_params);
  ```

### モニタリング強化
- **日次・月次集計ビューの追加**: API使用状況の可視化が必要になった場合
  - `daily_api_usage`: 日別の使用状況集計
  - `monthly_api_usage`: 月別の使用状況集計

### 機能拡張
- **検索パターンの共有機能**: プロジェクト内でパターンを共有
- **タグ付け機能**: パターンの分類・整理
- **お気に入り機能**: よく使うパターンの管理
- **検索履歴の詳細化**: 検索結果のスナップショット保存
- **API制限管理**: プロジェクトごとのクォータ管理
- **課金システム連携**: 使用量に基づく課金
- **RPC関数の追加**: 複雑な集計処理のためのストアドプロシージャ

### パフォーマンス最適化
- **パーティショニング**: `search_api_logs`が大量になった場合の月別パーティション
- **アーカイブ機能**: 古いログデータの別テーブルへの移動
- **マテリアライズドビュー**: 集計処理の高速化

## 8. RPC関数の例

### プロジェクトAPI使用状況取得
```sql
CREATE OR REPLACE FUNCTION get_project_api_usage(
  p_project_id uuid,
  p_period interval DEFAULT '30 days'
)
RETURNS TABLE (
  date date,
  total_requests bigint,
  successful_requests bigint,
  avg_response_time numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status_code = 200 THEN 1 END) as successful_requests,
    AVG(api_response_time)::numeric as avg_response_time
  FROM search_api_logs
  WHERE project_id = p_project_id
    AND created_at >= CURRENT_DATE - p_period
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
$$;

-- 使用例（JavaScriptクライアント）
-- const { data, error } = await supabase.rpc('get_project_api_usage', {
--   p_project_id: projectId,
--   p_period: '7 days'
-- });
```

## 9. ダッシュボード開発で実装可能な分析機能

### 9.1 実装可能なランキング機能一覧

以下のランキング機能は現在のDB設計で実装可能です：

1. **検索パターン使用回数ランキング** ✅
   - usage_countを活用した高速ランキング
   - 全期間/期間指定の両方に対応可能

2. **最近よく使われているパターン** ✅
   - search_api_logsとの結合で直近の使用状況を分析
   - 1週間/1か月/3か月の期間選択可能

3. **ユーザー別パターン作成数** ✅
   - search_patternsテーブルから直接集計
   - アクティブユーザーの把握に有効

4. **プロジェクト別API使用量** ✅
   - search_api_logsのproject_idで集計
   - コスト管理と使用状況の監視

5. **誰が多く検索しているか（直近30日）** ✅
   - user_id別の検索実行回数を集計
   - ヘビーユーザーの特定

6. **完全一致 vs 部分一致の利用率** ✅
   - JSONBフィールドから検索方法を抽出
   - 顧客名と住所それぞれで分析可能

7. **追加キーワードランキング** ✅
   - jsonb_array_elementsで配列を展開して集計
   - 人気キーワードとマッチタイプの傾向分析

### 9.2 ダッシュボード用サンプルクエリ

```sql
-- 1. 検索パターン使用回数ランキング（高速版）
SELECT 
  sp.id,
  sp.name,
  sp.description,
  sp.usage_count,
  sp.last_used_at
FROM search_patterns sp
WHERE sp.usage_count > 0
ORDER BY sp.usage_count DESC
LIMIT 20;

-- 2. 最近よく使われているパターン（期間指定版）
SELECT 
  sp.id,
  sp.name,
  sp.usage_count as total_count,
  COUNT(sal.id) as recent_count,
  sp.last_used_at
FROM search_patterns sp
LEFT JOIN search_api_logs sal 
  ON sp.id = sal.pattern_id 
  AND sal.created_at >= CURRENT_DATE - INTERVAL '1 month'
  AND sal.status_code = 200
GROUP BY sp.id, sp.name, sp.usage_count, sp.last_used_at
HAVING COUNT(sal.id) > 0
ORDER BY recent_count DESC
LIMIT 20;

-- 3. ユーザー別パターン作成数
SELECT 
  sp.user_id,
  COUNT(DISTINCT sp.id) as pattern_count,
  SUM(sp.usage_count) as total_usage,
  MAX(sp.last_used_at) as last_active
FROM search_patterns sp
GROUP BY sp.user_id
ORDER BY pattern_count DESC
LIMIT 20;

-- 4. プロジェクト別API使用量
SELECT 
  sal.project_id,
  COUNT(*) as search_count,
  COUNT(DISTINCT sal.user_id) as unique_users,
  AVG(sal.api_response_time) as avg_response_time
FROM search_api_logs sal
WHERE sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sal.project_id
ORDER BY search_count DESC;

-- 5. 誰が多く検索しているか
SELECT 
  sal.user_id,
  COUNT(*) as search_count,
  COUNT(DISTINCT sal.pattern_id) as used_patterns,
  COUNT(DISTINCT DATE(sal.created_at)) as active_days
FROM search_api_logs sal
WHERE sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND sal.status_code = 200
GROUP BY sal.user_id
ORDER BY search_count DESC
LIMIT 20;

-- 6. 完全一致 vs 部分一致の利用率
SELECT 
  sal.google_custom_search_params->>'customerNameExactMatch' as match_type,
  COUNT(*) as usage_count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as usage_percentage
FROM search_api_logs sal
WHERE sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND sal.status_code = 200
GROUP BY sal.google_custom_search_params->>'customerNameExactMatch';

-- 7. 追加キーワードランキング（1週間〜3か月の期間選択推奨）
SELECT 
  keyword_obj->>'value' as keyword,
  keyword_obj->>'matchType' as match_type,
  COUNT(*) as usage_count,
  COUNT(DISTINCT sal.user_id) as unique_users
FROM search_api_logs sal,
     jsonb_array_elements(sal.google_custom_search_params->'additionalKeywords') as keyword_obj
WHERE sal.created_at >= CURRENT_DATE - INTERVAL '1 month'
  AND sal.status_code = 200
GROUP BY keyword_obj->>'value', keyword_obj->>'matchType'
ORDER BY usage_count DESC
LIMIT 30;
```

### 9.3 実装時の推奨事項

1. **期間選択の実装**
   - 1週間、1か月、3か月の選択オプションを提供
   - 追加キーワードランキングは特に期間限定を推奨

2. **パフォーマンス最適化**
   - 初期は期間限定でクエリを実行
   - 必要に応じてマテリアライズドビューを追加

3. **権限管理**
   - system_ownerのみがアクセス可能なダッシュボード
   - RLSポリシーで自動的に制御される

4. **将来の拡張性**
   - JSONBフィールドの柔軟性を活かした新規分析の追加が容易
   - 集計用の専用テーブルは必要に応じて後から追加可能

## 10. マイグレーション SQL

完全なマイグレーションファイルは以下の通り：

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- 有効化済み (v1.1)
CREATE EXTENSION IF NOT EXISTS "pg_cron";    -- 有効化済み (v1.6)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- 有効化済み (v1.3) - gen_random_uuid()に必要

-- Create search_patterns table
CREATE TABLE IF NOT EXISTS search_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  description text,
  google_custom_search_params jsonb NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  last_used_at timestamp with time zone,
  CONSTRAINT search_patterns_name_user_unique UNIQUE(user_id, name)
);

-- Create search_api_logs table
CREATE TABLE IF NOT EXISTS search_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  pattern_id uuid REFERENCES search_patterns(id) ON DELETE SET NULL,
  google_custom_search_params jsonb NOT NULL,
  api_response_time integer,
  result_count integer,
  status_code integer NOT NULL,
  error_message text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_search_patterns_user_id ON search_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_search_patterns_last_used ON search_patterns(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_date ON search_api_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_project_date ON search_api_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_pattern ON search_api_logs(pattern_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON search_api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON search_api_logs(created_at DESC);

-- Enable RLS
ALTER TABLE search_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_api_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- 検索パターンのアクセス制御（個人のパターンのみ）
CREATE POLICY "search_patterns_select" ON search_patterns
  FOR SELECT
  TO authenticated
  USING (
    is_system_owner() OR
    user_id = (select auth.uid())
  );

CREATE POLICY "search_patterns_insert" ON search_patterns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
  );

CREATE POLICY "search_patterns_update" ON search_patterns
  FOR UPDATE
  TO authenticated
  USING (
    is_system_owner() OR
    user_id = (select auth.uid())
  )
  WITH CHECK (
    user_id = (select auth.uid())
  );

CREATE POLICY "search_patterns_delete" ON search_patterns
  FOR DELETE
  TO authenticated
  USING (
    is_system_owner() OR
    user_id = (select auth.uid())
  );

-- APIログのアクセス制御（system_ownerのみ閲覧可能）
CREATE POLICY "search_api_logs_select" ON search_api_logs
  FOR SELECT
  TO authenticated
  USING (is_system_owner());

CREATE POLICY "search_api_logs_insert" ON search_api_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (SELECT user_accessible_projects())
  );

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
    BEGIN
      UPDATE search_patterns
      SET
        usage_count = usage_count + 1,
        last_used_at = NOW()
      WHERE id = NEW.pattern_id;
    EXCEPTION WHEN OTHERS THEN
      -- エラーが発生してもAPIログの記録は継続
      RAISE WARNING 'Failed to update pattern usage for pattern_id %: %', NEW.pattern_id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pattern_usage_on_api_log
  AFTER INSERT ON search_api_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_usage();

-- RPC function for project API usage
CREATE OR REPLACE FUNCTION get_project_api_usage(
  p_project_id uuid,
  p_period interval DEFAULT '30 days'
)
RETURNS TABLE (
  date date,
  total_requests bigint,
  successful_requests bigint,
  avg_response_time numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status_code = 200 THEN 1 END) as successful_requests,
    AVG(api_response_time)::numeric as avg_response_time
  FROM search_api_logs
  WHERE project_id = p_project_id
    AND created_at >= CURRENT_DATE - p_period
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
$$;

-- RPC function for dashboard statistics
CREATE OR REPLACE FUNCTION get_user_patterns_with_stats(p_user_id uuid)
RETURNS TABLE (
  pattern_id uuid,
  pattern_name text,
  total_usage_count integer,
  last_30_days_count bigint,
  last_used_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sp.id,
    sp.name,
    sp.usage_count as total_usage_count,
    COUNT(DISTINCT sal.id) as last_30_days_count,
    sp.last_used_at
  FROM search_patterns sp
  LEFT JOIN search_api_logs sal
    ON sp.id = sal.pattern_id
    AND sal.status_code = 200
    AND sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
  WHERE sp.user_id = p_user_id
  GROUP BY sp.id, sp.name, sp.usage_count, sp.last_used_at;
$$;

-- テーブルにコメントを追加
COMMENT ON TABLE search_patterns IS 'ユーザーの個人検索パターン（複数プロジェクトで再利用可能）';
COMMENT ON TABLE search_api_logs IS 'Google Custom Search API使用履歴（プロジェクト毎のAPI使用量監視用）';
COMMENT ON COLUMN search_patterns.usage_count IS '使用回数カウンタ（ダッシュボードでの高速表示用。search_api_logsとの結合によるパフォーマンス低下を回避）';
COMMENT ON COLUMN search_patterns.last_used_at IS 'パターンの最終使用日時（一覧表示のソート用）';
COMMENT ON COLUMN search_api_logs.google_custom_search_params IS 'API送信時の完全な検索パラメータ（検索クエリを含む）';
COMMENT ON COLUMN search_api_logs.api_response_time IS 'APIレスポンス時間（ミリ秒単位）';
COMMENT ON COLUMN search_api_logs.project_id IS 'API呼び出しが属するプロジェクト（削除時はNULL設定で履歴保持）';
COMMENT ON COLUMN search_api_logs.pattern_id IS '使用された検索パターン（パターンからの実行時に記録）';

-- 自動削除ジョブの設定（pg_cron）
SELECT cron.schedule(
  'delete-old-api-logs',
  '0 17 * * *',  -- 毎日深夜2時（JST） = 17時（UTC）
  $$DELETE FROM search_api_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year'$$
);

```
