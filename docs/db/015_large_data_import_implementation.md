# 大量データインポート実装ドキュメント

## 概要

3496件の物件データをインポートする際に1MBを超えるデータサイズの問題を解決するため、ステージングテーブルとRPC関数を使用した実装を行いました。

## 背景と問題点

### 問題
- 112件のPDFファイルから3496件の物件データを抽出
- 全データを一度にAPIに送信すると1MBを超える
- Next.jsのAPIルートは4MBのレスポンスサイズ制限がある
- トランザクション処理が必要（プロジェクト作成とデータインポートの原子性）

### 既存の処理フロー
```
PDFファイル → parse-documents API → 物件データ → SavePropertiesDialog → savePropertiesAction
```

## 解決策

### アーキテクチャ設計

1. **ステージングテーブル方式**
   - 専用のステージングテーブル（`import_staging`）を作成
   - クライアントから100件ずつバッチでデータを投入
   - RPC関数で一括処理

2. **トランザクション制御**
   - プロジェクト作成とデータインポートを1つのトランザクションで実行
   - エラー時は全てロールバック

3. **履歴管理**
   - `import_jobs`テーブルでインポート履歴を保存
   - 監査証跡として機能

## データベース設計

### 1. ステージングテーブル（import_staging）

```sql
CREATE TABLE import_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  property_address text NOT NULL,
  owner_name text NOT NULL,
  owner_address text NOT NULL,
  lat numeric,
  lng numeric,
  street_view_available boolean DEFAULT false,
  source_file_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_import_staging_session ON import_staging(session_id);
```

### 2. インポートジョブ管理テーブル（import_jobs）

```sql
CREATE TABLE import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  session_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  project_name text NOT NULL,
  project_description text,
  status text NOT NULL DEFAULT 'pending',
  total_count int NOT NULL DEFAULT 0,
  processed_count int DEFAULT 0,
  success_count int DEFAULT 0,
  error_count int DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 3. RPC関数（create_project_and_import_properties）

プロジェクト作成とデータインポートを一括で処理する関数：

```sql
CREATE OR REPLACE FUNCTION create_project_and_import_properties(
  p_project_name text,
  p_project_description text,
  p_session_id uuid,
  p_user_id uuid DEFAULT auth.uid()
) RETURNS jsonb
```

処理内容：
1. ステージングデータの確認
2. プロジェクト作成
3. インポートジョブ記録の作成
4. 所有者マスターのupsert
5. 物件マスターのupsert
6. 物件所有履歴の記録
7. プロジェクト物件の関連付け
8. ステージングデータの削除

## クライアント側実装

### SavePropertiesDialog.tsx

#### 処理フロー

1. **セッションID生成**
   ```typescript
   const sessionId = crypto.randomUUID();
   ```

2. **バッチでステージングテーブルに投入**
   ```typescript
   const BATCH_SIZE = 100;
   for (let i = 0; i < properties.length; i += BATCH_SIZE) {
     const batch = properties.slice(i, i + BATCH_SIZE);
     await supabase.from('import_staging').insert(batch);
   }
   ```

3. **RPC関数呼び出し**
   ```typescript
   const { data: result } = await supabase.rpc('create_project_and_import_properties', {
     p_project_name: data.name,
     p_project_description: data.description,
     p_session_id: sessionId
   });
   ```

#### 進捗表示

3段階の進捗表示を実装：
- `uploading`: データアップロード中（0-100%）
- `processing`: データ処理中
- `completed`: 完了

## 自動クリーンアップ

### pg_cronによるスケジュール処理

1. **ステージングデータの削除**（毎日午前3時）
   ```sql
   DELETE FROM import_staging WHERE created_at < now() - interval '24 hours';
   ```

2. **古いジョブ記録の削除**（毎週日曜日午前4時）
   ```sql
   DELETE FROM import_jobs 
   WHERE status IN ('completed', 'failed') 
   AND completed_at < now() - interval '30 days';
   ```

## パフォーマンス考慮事項

### メリット
1. **メモリ効率**
   - 100件ずつのバッチ処理でメモリ使用量を抑制
   - サーバー側で直接処理

2. **トランザクション制御**
   - 完全な原子性を保証
   - エラー時は全てロールバック

3. **スケーラビリティ**
   - より大きなデータセットにも対応可能
   - ネットワーク負荷の分散

### 処理時間の目安
- 3496件のデータ：約35バッチ
- アップロード：約10-15秒
- インポート処理：約5-10秒

## エラーハンドリング

### クライアント側
- セッションIDによるクリーンアップ
- エラー時のステージングデータ削除
- ユーザーフレンドリーなエラーメッセージ

### サーバー側
- トランザクションによる自動ロールバック
- import_jobsテーブルへのエラー記録
- 詳細なエラー情報の保存

## トラブルシューティング

### よくある問題

1. **タイムアウトエラー**
   - 原因：大量データの処理に時間がかかる
   - 対策：バッチサイズを調整

2. **メモリ不足**
   - 原因：一度に処理するデータが多すぎる
   - 対策：BATCH_SIZEを小さくする

3. **重複エラー**
   - 原因：同じデータを複数回インポート
   - 対策：UNIQUE制約とON CONFLICTで対応済み

## 今後の改善案

1. **非同期処理**
   - バックグラウンドジョブとして実行
   - リアルタイム進捗通知

2. **部分的な成功の許可**
   - エラーがあっても処理を継続するオプション
   - エラーデータの再処理機能

3. **インポート履歴の活用**
   - 再インポート機能
   - 差分インポート

4. **パフォーマンス最適化**
   - 並列処理の実装
   - インデックスの最適化

## 移行ガイド

### 既存コードからの移行

1. `createProjectAction`と`savePropertiesAction`は非推奨
2. 新規実装では`create_project_and_import_properties` RPC関数を使用
3. SavePropertiesDialogコンポーネントは自動的に新方式を使用

### 必要な権限

- `import_staging`テーブルへのINSERT/DELETE権限
- `create_project_and_import_properties`関数の実行権限
- 既存テーブルへの通常のCRUD権限

## まとめ

この実装により、大量データのインポートが安定して実行できるようになりました。トランザクション制御により、データの整合性も保証されています。また、インポート履歴の保存により、監査やデバッグも容易になりました。