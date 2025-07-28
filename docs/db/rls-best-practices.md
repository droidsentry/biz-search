# Row Level Security (RLS) ベストプラクティス

## Supabase公式推奨のパフォーマンス最適化

### 1. インデックスの活用

RLSポリシーで使用するカラムには必ずインデックスを作成する。

```sql
-- RLSで user_id を使用する場合
CREATE INDEX idx_table_user_id ON table_name(user_id);

-- 複合インデックスの例
CREATE INDEX idx_table_user_project ON table_name(user_id, project_id);
```

### 2. 関数呼び出しをselectでラップ

`auth.uid()`などの関数は`select`でラップすることで、Postgresのオプティマイザがステートメントごとに結果をキャッシュできる。

```sql
-- ✅ 推奨パターン
CREATE POLICY "Enable access" ON table
  USING (user_id = (select auth.uid()));

-- ❌ 避けるべきパターン
CREATE POLICY "Enable access" ON table
  USING (user_id = auth.uid());
```

### 3. 明示的なフィルタの追加

RLSポリシーに加えて、クエリでも明示的にフィルタを指定することで、より良いクエリプランが生成される。

```typescript
// ❌ 避けるべきパターン（RLSのみに依存）
const { data } = await supabase
  .from('table_name')
  .select('*');

// ✅ 推奨パターン（明示的なフィルタを追加）
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);
```

### 4. 結合の最小化

JOINを避け、配列とIN/ANY演算子を使用する。

```sql
-- ❌ 避けるべきパターン（JOINを使用）
CREATE POLICY "Check membership" ON posts
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE memberships.user_id = auth.uid() 
    AND memberships.group_id = posts.group_id
  ));

-- ✅ 推奨パターン（配列を使用）
CREATE POLICY "Check membership" ON posts
  USING (group_id IN (
    SELECT group_id FROM memberships 
    WHERE user_id = (select auth.uid())
  ));
```

### 5. ロールの明示

`TO`演算子で対象ロールを明示的に指定する。

```sql
CREATE POLICY "Enable access" ON table
  FOR ALL 
  TO authenticated  -- ロールを明示
  USING (user_id = (select auth.uid()));
```

## SECURITY DEFINER関数の使用（複雑なロジックの場合のみ）

複雑なビジネスロジックをカプセル化し、RLSをバイパスしてパフォーマンスを向上させる場合に使用。

```sql
CREATE OR REPLACE FUNCTION get_user_data(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 認証チェック
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- 権限チェック
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- データ返却
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.created_at
  FROM users u
  WHERE u.id = p_user_id;
END;
$$;
```

## パフォーマンステスト

```sql
-- RLSポリシーのパフォーマンスを確認
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM your_table 
WHERE user_id = (select auth.uid())
LIMIT 10;
```

## 実装チェックリスト

- [ ] RLSポリシーで使用するカラムにインデックスが存在するか
- [ ] auth.uid()を(select auth.uid())でラップしているか
- [ ] クエリで明示的なフィルタを追加しているか
- [ ] JOINの代わりにIN/ANY演算子を使用しているか
- [ ] ポリシーでTO句を使用してロールを明示しているか
- [ ] EXPLAIN ANALYZEでクエリプランを確認したか

## 参考リンク

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [RLS Best Practices Discussion](https://github.com/orgs/supabase/discussions/14576)