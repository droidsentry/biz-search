# 所有者ベースの進捗計算への変更

## 概要

プロジェクトの進捗計算を「物件ベース」から「所有者ベース」に変更しました。これは、1つの物件に複数の所有者（共有者）が存在するケースを適切に処理するための改修です。

## 背景

### 問題点
- 1つの物件に最大842人の共有者が存在するケースがある
- 既存の実装では、物件数ベースで進捗を計算していたため、共有者の調査進捗が正しく反映されない
- JOINクエリで行数をカウントすると、物件数ではなく所有者数をカウントしてしまう

### 解決方針
- 進捗計算を「プロジェクトに紐づく全所有者数に対する調査完了者数の割合」に変更
- 同じ所有者が複数の物件を所有している場合も、重複カウントしない

## 実装内容

### 1. RPC関数の作成

`get_projects_with_owner_progress()` 関数を作成しました。

```sql
CREATE OR REPLACE FUNCTION get_projects_with_owner_progress()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  total_owners bigint,
  completed_owners bigint,
  progress integer
)
```

#### 特徴
- CTEを使用して効率的に所有者を集計
- DISTINCTで重複する所有者を排除
- 単一のクエリで実行されるため、N+1問題を回避
- SECURITY DEFINERで実行され、RLSをバイパス（認証チェックは関数内で実施）

### 2. アプリケーションコードの修正

`app/(main)/projects/action.ts` の `getProjectsWithProgress()` 関数を修正：

```typescript
// 変更前：複数のクエリで物件ベースの進捗を計算
// 変更後：RPC関数を呼び出して所有者ベースの進捗を取得

const { data: projectsWithProgress, error } = await supabase
  .rpc('get_projects_with_owner_progress')
  .returns<ProjectWithOwnerProgress[]>()
```

#### 互換性の維持
フロントエンドとの互換性を保つため、以下のマッピングを実施：
- `total_owners` → `totalProperties`
- `completed_owners` → `completedProperties`

## 影響範囲

### 影響を受けるコンポーネント
- プロジェクト一覧画面の進捗表示
- プロジェクトカードの進捗バー

### 表示の変更
- 進捗率は「調査完了した所有者数 ÷ 全所有者数」で計算される
- 「全〇件」の表示は所有者数を示すようになる

## パフォーマンス

### 改善点
- N+1問題の解消：プロジェクトごとに複数クエリを実行していたのが、1回のRPC呼び出しに
- インデックスの活用：`project_id`, `is_current`, `owner_id` にインデックスが存在

### 注意点
- 大量のプロジェクトがある場合は、ページネーションの実装を検討

## 今後の課題

1. **UI/UXの改善**
   - 「物件数」と「所有者数」の表示を明確に区別する必要がある
   - ダッシュボードで両方の指標を表示することを検討

2. **パフォーマンスモニタリング**
   - RPC関数の実行時間を監視
   - 必要に応じてマテリアライズドビューの導入を検討

3. **データ整合性**
   - `investigation_completed` フラグの更新ロジックの確認
   - `owner_companies` テーブルとの連携確認

## マイグレーション情報

- マイグレーションファイル: `create_get_projects_with_owner_progress_function`
- 適用日時: 2025年1月26日
- 影響: スキーマ変更なし（関数の追加のみ）