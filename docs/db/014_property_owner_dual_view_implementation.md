# プロジェクト詳細画面の物件ベース・所有者ベース両対応実装

## 概要

プロジェクト詳細画面において、1物件に複数の所有者（共有者）が存在するケースに対応するため、物件ベース表示と所有者ベース表示の両方を実装しました。

## 背景

### 問題点
- 1つの物件に最大842人の共有者が存在するケースがある
- 既存の実装では `.single()` を使用していたため、複数の所有者がいる場合にエラーが発生
- N+1問題によるパフォーマンスの低下

### 解決方針
- 物件ベース表示：物件ごとに1行、共有者数を表示
- 所有者ベース表示：所有者ごとに1行、同じ物件でも複数行表示
- RPC関数による効率的なデータ取得

## 実装内容

### 1. RPC関数の作成

#### 物件ベース表示用: `get_project_properties_view`
```sql
CREATE OR REPLACE FUNCTION get_project_properties_view(p_project_id uuid)
```

特徴：
- 物件ごとに集約
- 共有者数をカウント
- 代表所有者（最初の1人）の情報を含める
- 会社情報も一括取得

**注意点**：
- 関数の戻り値の列名とCTE内の列名が衝突しないよう、CTE内では別名を使用
- 例：`project_property_id` → `pp_id`

#### 所有者ベース表示用: `get_project_owners_view`
```sql
CREATE OR REPLACE FUNCTION get_project_owners_view(p_project_id uuid)
```

特徴：
- 所有者ごとに1行返す
- 共有者がいる場合は複数行になる
- すべての所有者情報を個別に表示

**注意点**：
- 複数のテーブルに同名の列がある場合は、テーブルエイリアスを明示的に使用
- 例：`o.id AS owner_id`（`owners`テーブルと`owner_companies`テーブルの区別）

### 2. アプリケーションコードの修正

#### action.tsの変更

1. **型定義の追加**
   - `PropertyWithPrimaryOwner`: 物件ベース表示用（共有者を集約）
   - `PropertyWithOwnerAndCompany`: 所有者ベース表示用（共有者を個別表示）

2. **新規関数の追加**
   - `getProjectPropertiesAction`: 物件ベース（RPC使用に修正）
   - `getProjectOwnersAction`: 所有者ベース（新規追加）

### 3. UIの実装

#### page.tsxの変更
- URLパラメータ `?view=properties` または `?view=owners` で表示モード切り替え
- Tabsコンポーネントを使用した切り替えUI
- 各モードに応じたデータ取得とテーブル表示

#### コンポーネントの変更・追加

1. **PropertyTable（修正）**
   - 所有者数の表示列を追加
   - 共有者がいる場合は「共有」バッジを表示
   - 代表所有者の情報のみ表示

2. **OwnerTable（新規）**
   - 所有者ごとに1行表示
   - 物件住所も含めて表示
   - 既存のPropertyTableと同様のステータス表示

## 表示の違い

### 物件ベース表示
```
| 不動産住所 | 所有者数 | 代表所有者 | ... |
|-----------|---------|-----------|-----|
| 東京都... | 842 共有 | 山田太郎 | ... |
```

### 所有者ベース表示
```
| 所有者氏名 | 所有者住所 | 不動産住所 | ... |
|-----------|-----------|-----------|-----|
| 山田太郎 | 大阪府... | 東京都... | ... |
| 鈴木花子 | 京都府... | 東京都... | ... |
| ...（842件）|
```

## パフォーマンスの改善

### Before
- N+1問題：物件数 × 3回のクエリ（所有者情報、会社情報、会社数カウント）
- 1物件に複数所有者がいる場合のエラー

### After
- RPC関数で1回のクエリに集約
- CTEを使用した効率的なデータ取得
- インデックスの活用

## 影響範囲

### 影響を受けるコンポーネント
- プロジェクト詳細画面全体
- PropertyTableコンポーネント
- エクスポート機能（将来的に対応が必要）

### 互換性
- 既存のUIとの互換性は維持
- URLパラメータによる表示切り替えのため、既存のリンクも動作

## 今後の課題

1. **エクスポート機能の対応**
   - 物件ベース/所有者ベースの選択に対応
   - `exportProjectProperties` 関数の修正が必要

2. **パフォーマンスモニタリング**
   - 大量データでのRPC関数の実行時間監視
   - 必要に応じてページネーションの実装

3. **UI/UXの改善**
   - 表示モードの違いをより明確に
   - 共有者の詳細表示機能の追加

## マイグレーション情報

### 初回作成
- マイグレーションファイル: `create_project_properties_views`
- 適用日時: 2025年1月26日
- 影響: スキーマ変更なし（関数の追加のみ）

### バグ修正
- マイグレーションファイル: `fix_project_properties_views_ambiguous_columns`
- マイグレーションファイル: `fix_project_owners_view_ambiguous_columns`
- 適用日時: 2025年1月26日
- 修正内容: RPC関数内の曖昧な列参照エラーを修正
  - `project_property_id` → `pp_id` などに別名を使用
  - `owner_id` → `oc_owner_id` などに別名を使用
  - すべての列参照にテーブルエイリアスを明示的に付与

## 関連ファイル

- `/app/(main)/projects/[projectId]/action.ts`
- `/app/(main)/projects/[projectId]/page.tsx`
- `/app/(main)/projects/[projectId]/components/property-table.tsx`
- `/app/(main)/projects/[projectId]/components/owner-table.tsx`