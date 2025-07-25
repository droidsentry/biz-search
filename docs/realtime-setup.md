# Supabase リアルタイム機能の設定

## search_api_logsテーブルのリアルタイム設定

API使用状況のリアルタイム監視機能を使用するには、以下の設定が必要です。

### 1. データベース側の設定

マイグレーションファイル (`20250724_enable_realtime_search_api_logs.sql`) により以下が設定されます：

- `search_api_logs`テーブルのリアルタイムパブリケーション追加
- Row Level Security (RLS) の有効化
- 適切なRLSポリシーの追加

### 2. Supabaseダッシュボードでの確認

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左メニューから「Database」→「Replication」を選択
4. 「supabase_realtime」パブリケーションに`search_api_logs`テーブルが含まれていることを確認

### 3. RLSポリシーの説明

#### Users can view their own API logs
- 認証されたユーザーが自分のAPIログを参照できる
- `user_id`が現在のユーザーIDと一致する場合のみアクセス可能

#### System owners can view all API logs  
- システム管理者は全てのAPIログを参照できる
- `profiles.role = 'system_owner'`かつアクティブなユーザーのみ

#### Users can insert their own API logs
- 認証されたユーザーが自分のAPIログを作成できる
- 挿入時の`user_id`が現在のユーザーIDと一致する必要がある

### 4. クライアント側の実装

`app/(main)/settings/components/api-usage.tsx`で以下のように実装されています：

```typescript
const channel = supabase
  .channel('api-usage-monitor')
  .on(
    'postgres_changes',
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'search_api_logs',
      filter: 'status_code=eq.200'
    },
    (payload) => {
      // リアルタイム更新処理
    }
  )
  .subscribe()
```

### 5. トラブルシューティング

リアルタイム機能が動作しない場合：

1. **RLSポリシーの確認**
   - ユーザーが適切な権限を持っているか確認
   - `select`権限が付与されているか確認

2. **リアルタイムの有効化**
   - Supabaseダッシュボードで「Realtime」が有効になっているか確認
   - テーブルがパブリケーションに追加されているか確認

3. **接続状態の確認**
   - ブラウザのコンソールでWebSocket接続エラーがないか確認
   - ネットワークタブでWebSocket接続が確立されているか確認

4. **認証状態の確認**
   - ユーザーがログインしているか確認
   - JWTトークンが有効か確認