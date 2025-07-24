# データベース関数リファレンス

## 概要

本ドキュメントは、Biz Searchアプリケーションで使用されているPostgreSQL関数の詳細な仕様と使用方法を説明します。

## 関数一覧

### 1. 認証・権限管理関数

#### get_active_profile_id()
アクティブなプロファイルIDを取得する関数

```sql
CREATE OR REPLACE FUNCTION get_active_profile_id() 
RETURNS uuid AS $$
DECLARE
  profile_id uuid;
BEGIN
  SELECT id INTO profile_id
  FROM profiles 
  WHERE id = auth.uid() 
  AND is_active = true;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**用途:**
- RLSポリシーで現在のユーザーがアクティブかどうかを確認
- 非アクティブユーザーのアクセスを自動的に制限

**戻り値:**
- アクティブなプロファイルのUUID（非アクティブの場合はNULL）

---

#### is_system_owner()
システムオーナー権限を確認する関数

```sql
CREATE OR REPLACE FUNCTION is_system_owner()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND role = 'system_owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

**用途:**
- RLSポリシーでシステム管理者権限を確認
- 管理者限定機能へのアクセス制御

**戻り値:**
- true: システムオーナー権限あり
- false: システムオーナー権限なし

---

### 2. プロジェクトアクセス制御関数

#### user_accessible_projects()
ユーザーがアクセス可能なプロジェクトIDを取得

```sql
CREATE OR REPLACE FUNCTION user_accessible_projects()
RETURNS SETOF uuid AS $$
  SELECT p.id FROM projects p WHERE p.created_by = (SELECT auth.uid())
  UNION
  SELECT pm.project_id FROM project_members pm WHERE pm.user_id = (SELECT auth.uid())
$$ LANGUAGE sql STABLE;
```

**用途:**
- RLSポリシーで読み取り権限の判定
- プロジェクトリスト表示の制御

**戻り値:**
- アクセス可能なプロジェクトIDのセット

---

#### user_editable_projects()
ユーザーが編集可能なプロジェクトIDを取得

```sql
CREATE OR REPLACE FUNCTION user_editable_projects()
RETURNS SETOF uuid AS $$
  SELECT p.id FROM projects p WHERE p.created_by = (SELECT auth.uid())
  UNION
  SELECT pm.project_id FROM project_members pm 
  WHERE pm.user_id = (SELECT auth.uid()) AND pm.role IN ('owner', 'editor')
$$ LANGUAGE sql STABLE;
```

**用途:**
- RLSポリシーで編集権限の判定
- データ更新・削除権限の制御

**戻り値:**
- 編集可能なプロジェクトIDのセット

---

### 3. ユーザー管理関数

#### deactivate_user_account(user_id uuid, reason text)
ユーザーアカウントを非アクティブ化

```sql
CREATE OR REPLACE FUNCTION deactivate_user_account(
  user_id uuid,
  reason text DEFAULT 'User requested'
) RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_active = false,
    deactivated_at = now(),
    deactivation_reason = reason
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**パラメータ:**
- `user_id`: 非アクティブ化するユーザーのID
- `reason`: 非アクティブ化の理由（デフォルト: 'User requested'）

**用途:**
- ユーザーアカウントのソフトデリート
- 管理画面からのユーザー無効化

---

### 4. 検索パターン管理関数

#### increment_search_pattern_usage(pattern_id uuid)
検索パターンの使用回数をインクリメント

```sql
CREATE OR REPLACE FUNCTION increment_search_pattern_usage(pattern_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE search_patterns 
  SET usage_count = usage_count + 1,
      last_used_at = now()
  WHERE id = pattern_id;
END;
$$ LANGUAGE plpgsql;
```

**パラメータ:**
- `pattern_id`: 検索パターンのID

**用途:**
- 検索実行時の使用統計更新
- トリガーから自動呼び出し

---

### 5. 更新時刻管理関数

#### update_updated_at_column()
updated_atカラムを現在時刻に更新

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**用途:**
- 各テーブルのUPDATEトリガーで使用
- 更新時刻の自動記録

**トリガー適用テーブル:**
- profiles
- projects
- properties
- owners
- property_ownerships
- owner_companies
- search_patterns

---

### 6. 所有権管理関数

#### update_property_ownership()
物件の現在の所有者を管理

```sql
CREATE OR REPLACE FUNCTION update_property_ownership()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 同じproperty_idで異なるowner_idの既存レコードを終了
    UPDATE property_ownerships 
    SET 
      is_current = false, 
      ownership_end = NEW.ownership_start,
      updated_at = now()
    WHERE 
      property_id = NEW.property_id 
      AND owner_id != NEW.owner_id
      AND is_current = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**用途:**
- property_ownershipsテーブルのINSERTトリガー
- 物件の現在所有者を一意に保つ

---

### 7. ログ連携関数

#### update_pattern_usage_on_log_insert()
APIログ挿入時に検索パターン使用回数を更新

```sql
CREATE OR REPLACE FUNCTION update_pattern_usage_on_log_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.pattern_id IS NOT NULL THEN
    PERFORM increment_search_pattern_usage(NEW.pattern_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**用途:**
- search_api_logsテーブルのINSERTトリガー
- 検索パターンの使用統計を自動更新

---

### 8. レポート・分析関数

#### get_project_api_usage(p_project_id uuid, p_period interval)
プロジェクトのAPI使用状況を取得

```sql
CREATE OR REPLACE FUNCTION get_project_api_usage(
  p_project_id uuid, 
  p_period interval DEFAULT '30 days'
) RETURNS TABLE (
  date date,
  total_requests bigint,
  successful_requests bigint,
  avg_response_time numeric
) AS $$
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
$$ LANGUAGE sql STABLE;
```

**パラメータ:**
- `p_project_id`: プロジェクトID
- `p_period`: 集計期間（デフォルト: 30日）

**戻り値:**
- 日付別のAPI使用統計

---

#### get_user_patterns_with_stats(p_user_id uuid)
ユーザーの検索パターン統計を取得

```sql
CREATE OR REPLACE FUNCTION get_user_patterns_with_stats(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  total_usage_count integer,
  last_30_days_count bigint,
  last_used_at timestamptz
) AS $$
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
$$ LANGUAGE sql STABLE;
```

**パラメータ:**
- `p_user_id`: ユーザーID

**戻り値:**
- 検索パターンの使用統計

---

#### get_project_export_data(p_project_id uuid)
プロジェクトデータをエクスポート用に整形

```sql
CREATE OR REPLACE FUNCTION get_project_export_data(p_project_id uuid)
RETURNS TABLE (
  property_address text,
  owner_name text,
  owner_address text,
  owner_lat double precision,
  owner_lng double precision,
  company1_name text,
  company1_number text,
  company1_position text,
  company2_name text,
  company2_number text,
  company2_position text,
  company3_name text,
  company3_number text,
  company3_position text,
  ownership_start date,
  added_at timestamptz,
  researched_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.address,
    o.name,
    o.address,
    o.lat,
    o.lng,
    MAX(CASE WHEN oc.rank = 1 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 1 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 1 THEN oc.position END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.position END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.position END),
    po.ownership_start,
    pp.added_at,
    MAX(oc.researched_at)
  FROM project_properties pp
  JOIN properties p ON pp.property_id = p.id
  LEFT JOIN property_ownerships po ON p.id = po.property_id AND po.is_current = true
  LEFT JOIN owners o ON po.owner_id = o.id
  LEFT JOIN owner_companies oc ON o.id = oc.owner_id
  WHERE pp.project_id = p_project_id
  GROUP BY p.id, p.address, po.ownership_start, o.id, o.name, o.address, o.lat, o.lng, pp.added_at
  ORDER BY pp.added_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;
```

**パラメータ:**
- `p_project_id`: プロジェクトID

**戻り値:**
- エクスポート用に整形されたプロジェクトデータ

---

### 9. メンテナンス関数

#### delete_old_search_api_logs()
古いAPIログを削除

```sql
CREATE OR REPLACE FUNCTION delete_old_search_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM search_api_logs 
  WHERE created_at < (now() - interval '6 months');
END;
$$ LANGUAGE plpgsql;
```

**用途:**
- 定期的なログクリーンアップ
- ストレージ容量の管理

**推奨実行頻度:**
- 月1回（cron jobまたはpg_cronで実行）

---

## 使用例

### RLSポリシーでの使用例

```sql
-- アクティブユーザーのみアクセス可能
CREATE POLICY example_policy ON some_table
  FOR SELECT TO authenticated
  USING (user_id = get_active_profile_id());

-- システムオーナーまたは作成者のみ削除可能
CREATE POLICY delete_policy ON some_table
  FOR DELETE TO authenticated
  USING (is_system_owner() OR created_by = get_active_profile_id());
```

### アプリケーションからの呼び出し例

```typescript
// ユーザーアカウントの非アクティブ化
const { error } = await supabase.rpc('deactivate_user_account', {
  user_id: 'user-uuid',
  reason: 'Account suspension due to policy violation'
});

// プロジェクトのAPI使用状況取得
const { data, error } = await supabase.rpc('get_project_api_usage', {
  p_project_id: 'project-uuid',
  p_period: '7 days'
});

// エクスポートデータの取得
const { data, error } = await supabase.rpc('get_project_export_data', {
  p_project_id: 'project-uuid'
});
```

## セキュリティ考慮事項

1. **SECURITY DEFINER**
   - 権限昇格が必要な関数のみに使用
   - 入力検証を必ず実装

2. **RLS統合**
   - すべての関数はRLSポリシーと連携
   - アクティブユーザーチェックを徹底

3. **パフォーマンス**
   - 頻繁に呼ばれる関数はSTABLEまたはIMMUTABLEを指定
   - 適切なインデックスと組み合わせて使用