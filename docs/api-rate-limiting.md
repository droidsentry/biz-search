# API利用制限機能 実装ドキュメント（MVP版）

## 概要

Google Custom Search APIのプロジェクト全体での利用制限機能を実装しました。1つの会社で使用することを前提とし、システムオーナーのみが制限を管理できるシンプルな設計です。

## アーキテクチャ

### データベース構造

#### 1. `api_global_limits` テーブル
プロジェクト全体のAPI制限値を管理します。

```sql
CREATE TABLE api_global_limits (
  api_name text PRIMARY KEY,
  daily_limit integer NOT NULL DEFAULT 100,
  monthly_limit integer NOT NULL DEFAULT 10000,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### 2. `api_global_usage` テーブル
プロジェクト全体のAPI使用統計を管理します。

```sql
CREATE TABLE api_global_usage (
  api_name text PRIMARY KEY,
  daily_count integer NOT NULL DEFAULT 0,
  daily_date date NOT NULL DEFAULT CURRENT_DATE,
  monthly_count integer NOT NULL DEFAULT 0,
  monthly_date date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### RPC関数

#### 1. `check_global_api_limit`
プロジェクト全体のAPI利用可否をチェックし、使用量を記録する関数です。

```typescript
// 使用例
const { data, error } = await supabase.rpc('check_global_api_limit', {
  p_api_name: 'google_custom_search',
  p_increment: 1 // オプション：デフォルトは1
});

// レスポンス例（成功時）
{
  allowed: true,
  daily_used: 45,
  daily_limit: 100,
  monthly_used: 1230,
  monthly_limit: 10000,
  daily_remaining: 55,
  monthly_remaining: 8770
}

// レスポンス例（制限超過時）
{
  allowed: false,
  error: 'API利用制限に達しています',
  blocked_until: '2024-01-02T00:00:00Z',
  daily_used: 100,
  daily_limit: 100,
  monthly_used: 1500,
  monthly_limit: 10000
}
```

#### 2. `get_global_api_usage_stats`
グローバルAPI使用統計を取得する読み取り専用関数です。

```typescript
// 統計を取得
const { data } = await supabase.rpc('get_global_api_usage_stats', {
  p_api_name: 'google_custom_search' // nullで全API取得
});

// レスポンス例
[
  {
    api_name: 'google_custom_search',
    daily_used: 45,
    daily_limit: 100,
    monthly_used: 1230,
    monthly_limit: 10000,
    is_blocked: false,
    blocked_until: null
  }
]
```

## 実装詳細

### 1. API呼び出し時の制限チェック

`lib/actions/google/custom-search.tsx`での実装：

```typescript
export async function getCustomerInfoFromGoogleCustomSearch(
  formData: GoogleCustomSearchPattern
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // グローバルAPI利用制限チェック
  const { data: limitCheck, error: limitCheckError } = await supabase
    .rpc('check_global_api_limit', {
      p_api_name: 'google_custom_search'
    });
    
  if (!limitCheck.allowed) {
    const error = new Error(
      `API制限に達しました。本日: ${limitCheck.daily_used}/${limitCheck.daily_limit}回、` +
      `今月: ${limitCheck.monthly_used}/${limitCheck.monthly_limit}回`
    );
    (error as any).rateLimitInfo = limitCheck;
    throw error;
  }
  
  // API呼び出し処理...
  
  return {
    ...response.data,
    _rateLimitInfo: limitCheck // レート制限情報を含める
  };
}
```

### 2. エラーハンドリング

`components/errors/rate-limit-error.tsx`：

```typescript
export function RateLimitError({ error }: RateLimitErrorProps) {
  const info = error.rateLimitInfo;
  
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>API利用制限に達しました</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            <span className="font-semibold">本日の使用状況:</span> 
            {info.daily_used} / {info.daily_limit} 回
          </p>
          <p>
            <span className="font-semibold">今月の使用状況:</span> 
            {info.monthly_used} / {info.monthly_limit} 回
          </p>
          {info.blocked_until && (
            <p>
              <span className="font-semibold">制限解除予定:</span> 
              {formatDate(info.blocked_until)}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

### 3. リアルタイム監視

`hooks/use-api-rate-limit.ts`：

```typescript
export function useApiRateLimit(apiName: string = 'google_custom_search') {
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  
  useEffect(() => {
    // グローバル統計を取得
    const fetchStats = async () => {
      const { data } = await supabase.rpc('get_global_api_usage_stats', {
        p_api_name: apiName
      });
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    };
    
    // Realtime購読
    const channel = supabase
      .channel('api-usage-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'api_global_usage',
        filter: `api_name=eq.${apiName}`
      }, (payload) => {
        // 統計更新と通知
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [apiName]);
  
  return { stats, isLoading };
}
```

### 4. 管理画面（システムオーナー専用）

`/settings/api-limits`ページで以下の機能を提供：

- **制限設定**: 日次・月次の制限値を変更
- **使用状況確認**: リアルタイムで使用状況を表示
- **緊急リセット**: カウンターの手動リセット

## RLSポリシー

### `api_global_limits`テーブル
- **SELECT**: 全ユーザー可能
- **INSERT/UPDATE/DELETE**: `is_system_owner()`がtrueのユーザーのみ

### `api_global_usage`テーブル
- **SELECT**: 全ユーザー可能
- **UPDATE**: `is_system_owner()`がtrueのユーザーのみ（緊急リセット用）
- **INSERT/DELETE**: 不可（RPC関数経由のみ）

## 設定方法

### 1. 管理画面からの変更（推奨）
システムオーナーは`/settings/api-limits`から制限値を変更できます。

### 2. データベースから直接変更

```sql
-- 制限値の更新
UPDATE api_global_limits
SET 
  daily_limit = 200,
  monthly_limit = 20000
WHERE api_name = 'google_custom_search';
```

## 監視とメンテナンス

### 1. 使用状況の確認

```sql
-- グローバル使用状況
SELECT 
  api_name,
  daily_count,
  daily_limit,
  monthly_count,
  monthly_limit,
  is_blocked,
  blocked_until
FROM api_global_usage
WHERE api_name = 'google_custom_search';
```

### 2. 自動リセット
- 日次カウンタ：日付が変わると自動的にリセット
- 月次カウンタ：月が変わると自動的にリセット
- ブロック状態：`blocked_until`を過ぎると自動解除

### 3. 手動リセット（緊急時）
システムオーナーは管理画面から手動でカウンターをリセット可能

## MVPでの制限事項

1. **ユーザー別の制限なし**: プロジェクト全体で共通の制限
2. **組織単位の管理なし**: 1つの会社での使用を想定
3. **詳細な分析機能なし**: 基本的な使用状況のみ表示

## トラブルシューティング

### 問題1: カウンタがリセットされない
**原因**: タイムゾーンの違い
**解決**: データベースのタイムゾーン設定を確認

### 問題2: 管理画面にアクセスできない
**原因**: システムオーナー権限がない
**解決**: profilesテーブルでroleが'system_owner'であることを確認

### 問題3: Realtime更新が反映されない
**原因**: Realtime購読の問題
**解決**: ブラウザのコンソールでエラーを確認

## まとめ

MVP版の実装により、以下が実現されました：

- ✅ プロジェクト全体でのAPI制限管理
- ✅ システムオーナーによる制限設定
- ✅ リアルタイムでの使用状況確認
- ✅ 自動的な制限リセット
- ✅ シンプルで理解しやすい設計
- ✅ `is_system_owner()`関数による権限管理

これにより、1つの会社でのAPI使用量を効果的に管理し、システムの安定性とコスト管理を実現しています。