# データベーストリガーリファレンス

## 概要

本ドキュメントは、Biz Searchアプリケーションで使用されているデータベーストリガーの詳細な仕様と動作を説明します。トリガーは、データの整合性維持と自動処理のために重要な役割を果たしています。

## トリガー一覧

### 1. 更新時刻自動記録トリガー

以下のテーブルで、レコード更新時に`updated_at`カラムを自動的に現在時刻に更新します。

#### 対象テーブル
- profiles
- projects  
- properties
- owners
- property_ownerships
- owner_companies
- search_patterns

#### トリガー定義（例: profiles）

```sql
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**動作:**
- タイミング: BEFORE UPDATE
- レベル: ROW（各行ごと）
- 関数: `update_updated_at_column()`
- 効果: 更新時に`updated_at`を現在時刻に自動設定

**使用例:**
```sql
-- ユーザーがプロファイルを更新
UPDATE profiles SET username = 'new_username' WHERE id = 'user-id';
-- updated_atが自動的に現在時刻に更新される
```

---

### 2. 物件所有者管理トリガー

#### ensure_single_current_owner

物件に対して現在の所有者が常に1人だけになるよう管理します。

```sql
CREATE TRIGGER ensure_single_current_owner
  BEFORE INSERT ON property_ownerships
  FOR EACH ROW
  EXECUTE FUNCTION update_property_ownership();
```

**動作:**
- タイミング: BEFORE INSERT
- レベル: ROW
- 関数: `update_property_ownership()`

**処理内容:**
1. 新しい所有権レコードが挿入される際に実行
2. 同じ物件（property_id）の既存の現在所有者（is_current = true）を検索
3. 異なる所有者（owner_id）の場合、既存レコードを終了
   - `is_current = false`に設定
   - `ownership_end`を新レコードの`ownership_start`に設定

**使用例:**
```sql
-- 物件の所有者変更
INSERT INTO property_ownerships (
  property_id, 
  owner_id, 
  ownership_start,
  is_current
) VALUES (
  'property-123',
  'new-owner-456',
  '2025-01-01',
  true
);
-- 既存の所有者のis_currentがfalseに、ownership_endが2025-01-01に自動設定
```

---

### 3. 検索パターン使用統計トリガー

#### increment_usage_count_on_api_log

APIログ記録時に、関連する検索パターンの使用回数を自動的にインクリメントします。

```sql
CREATE TRIGGER increment_usage_count_on_api_log
  AFTER INSERT ON search_api_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_usage_on_log_insert();
```

**動作:**
- タイミング: AFTER INSERT
- レベル: ROW
- 関数: `update_pattern_usage_on_log_insert()`

**処理内容:**
1. search_api_logsにレコードが挿入された後に実行
2. pattern_idがNULLでない場合のみ処理
3. `increment_search_pattern_usage()`関数を呼び出し
4. 対応する検索パターンの`usage_count`を+1、`last_used_at`を更新

**使用例:**
```sql
-- API実行ログの記録
INSERT INTO search_api_logs (
  user_id,
  project_id,
  pattern_id,
  status_code,
  api_response_time
) VALUES (
  'user-123',
  'project-456',
  'pattern-789',  -- この検索パターンの使用回数が自動的に+1される
  200,
  1500
);
```

---

## トリガー管理

### トリガーの確認

現在のトリガー一覧を確認するSQL:

```sql
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name,
    CASE 
        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
    END as event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;
```

### トリガーの無効化/有効化

メンテナンスや大量データ処理時の一時的な無効化:

```sql
-- トリガーの無効化
ALTER TABLE table_name DISABLE TRIGGER trigger_name;

-- すべてのトリガーの無効化
ALTER TABLE table_name DISABLE TRIGGER ALL;

-- トリガーの再有効化
ALTER TABLE table_name ENABLE TRIGGER trigger_name;

-- すべてのトリガーの再有効化
ALTER TABLE table_name ENABLE TRIGGER ALL;
```

---

## パフォーマンス考慮事項

### 1. 更新時刻トリガー
- **影響**: 最小限（単純な代入のみ）
- **推奨**: すべての主要テーブルで使用

### 2. 所有者管理トリガー
- **影響**: 中程度（条件付きUPDATE実行）
- **最適化**: property_idとis_currentに複合インデックス推奨
```sql
CREATE INDEX idx_property_ownerships_property_current 
ON property_ownerships(property_id, is_current) 
WHERE is_current = true;
```

### 3. 使用統計トリガー
- **影響**: 中程度（別テーブルのUPDATE実行）
- **最適化**: pattern_idにインデックス必須
```sql
CREATE INDEX idx_search_patterns_id ON search_patterns(id);
```

---

## トラブルシューティング

### 問題: updated_atが更新されない
**原因**: トリガーが無効化されている可能性
**解決**: 
```sql
ALTER TABLE affected_table ENABLE TRIGGER ALL;
```

### 問題: 物件に複数の現在所有者が存在
**原因**: トリガー実行前の不整合データ
**解決**: 
```sql
-- 不整合データの修正
WITH latest_ownership AS (
  SELECT DISTINCT ON (property_id) 
    id, property_id, owner_id
  FROM property_ownerships
  WHERE is_current = true
  ORDER BY property_id, ownership_start DESC
)
UPDATE property_ownerships po
SET is_current = false
WHERE po.is_current = true
  AND NOT EXISTS (
    SELECT 1 FROM latest_ownership lo 
    WHERE lo.id = po.id
  );
```

### 問題: 検索パターンの使用回数が増えない
**原因**: pattern_idがNULLまたは不正な値
**解決**: APIログ記録時にpattern_idの検証を追加

---

## ベストプラクティス

1. **トリガー名の命名規則**
   - 形式: `{action}_{table_name}_{purpose}`
   - 例: `update_profiles_updated_at`

2. **トリガー関数の設計**
   - 単一責任の原則を守る
   - エラーハンドリングを適切に実装
   - パフォーマンスを考慮した実装

3. **テスト方法**
   ```sql
   -- トリガーの動作確認
   BEGIN;
   -- テストデータの挿入/更新
   INSERT INTO test_table (...) VALUES (...);
   -- 結果の確認
   SELECT * FROM test_table WHERE ...;
   -- 問題なければCOMMIT、問題があればROLLBACK
   ROLLBACK;
   ```

4. **監視とメンテナンス**
   - トリガー実行時間の監視
   - 定期的なインデックスの最適化
   - 不要になったトリガーの削除

---

## 今後の拡張案

1. **監査ログトリガー**
   - 重要なテーブルの変更履歴を自動記録
   - 誰が、いつ、何を変更したかを追跡

2. **データ検証トリガー**
   - ビジネスルールの自動検証
   - 不正なデータの挿入/更新を防止

3. **通知トリガー**
   - 特定のイベント発生時に通知を送信
   - pg_notifyを使用したリアルタイム通知