# テーブル使用ガイド

このドキュメントでは、Biz Searchアプリケーションの主要テーブルの詳細な使用方法を説明します。

> **注記**: このガイドは現在実装されているテーブルのみを対象としています。監査ログ（audit_logs）やAPI追跡（api_usage_logs）などの機能は、将来の実装計画として別途SQLファイルに記載されています。

## 目次

1. [project_membersテーブル](#project_membersテーブル)
2. [権限管理の実装](#権限管理の実装)
3. [プロジェクトとメンバー管理](#プロジェクトとメンバー管理)
4. [よくある質問](#よくある質問)

## project_membersテーブル

### 概要

`project_members`テーブルは、プロジェクトのメンバーシップと権限を管理する重要なテーブルです。

### 重要な変更点

プロジェクト作成時に、作成者は自動的に`project_members`テーブルにownerとして登録されるようになりました（トリガーによる自動処理）。これにより、権限管理が一元化されます。

### テーブル構造

```sql
CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL,
  added_by uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  added_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(project_id, user_id)
);
```

### カラムの詳細説明

#### user_id と added_by の違い

これは最もよく質問される内容です：

- **user_id**: プロジェクトのメンバーとして追加される人のID
  - 例: 田中さんをプロジェクトに追加する場合、田中さんのユーザーID

- **added_by**: メンバーを追加した管理者のID（監査用）
  - 例: 山田さんが田中さんを追加した場合、山田さんのユーザーID
  - DEFAULT auth.uid() により、現在のユーザーが自動的に記録される

### 実装例

#### 1. メンバーの追加

```typescript
// 基本的なメンバー追加
async function addProjectMember(
  projectId: string, 
  userId: string, 
  role: 'editor' | 'viewer'
) {
  const { data, error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: userId,
      role: role
      // added_by は自動的に現在のユーザーIDが設定される
    });

  if (error) {
    console.error('メンバー追加エラー:', error);
    return null;
  }

  return data;
}

// 使用例
await addProjectMember(
  'proj-123',  // プロジェクトID
  'user-456',  // 追加したいユーザーのID
  'editor'     // 付与する権限
);
```

#### 2. メンバー一覧の取得

```sql
-- プロジェクトメンバー一覧（詳細情報付き）
SELECT 
  pm.id,
  pm.role,
  pm.added_at,
  u.email as member_email,
  u.raw_user_meta_data->>'username' as member_name,
  au.email as added_by_email,
  au.raw_user_meta_data->>'username' as added_by_name
FROM project_members pm
JOIN auth.users u ON pm.user_id = u.id
JOIN auth.users au ON pm.added_by = au.id
WHERE pm.project_id = $1
ORDER BY 
  CASE pm.role 
    WHEN 'owner' THEN 1 
    WHEN 'editor' THEN 2 
    WHEN 'viewer' THEN 3 
  END,
  pm.added_at DESC;
```

```typescript
// TypeScript実装
async function getProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      user:auth.users!user_id(
        id,
        email,
        raw_user_meta_data
      ),
      added_by_user:auth.users!added_by(
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('project_id', projectId)
    .order('role')
    .order('added_at', { ascending: false });

  return data;
}
```

#### 3. 権限の更新

```typescript
async function updateMemberRole(
  projectId: string,
  userId: string,
  newRole: 'editor' | 'viewer'
) {
  // ownerへの昇格は通常許可しない
  const { data, error } = await supabase
    .from('project_members')
    .update({ role: newRole })
    .eq('project_id', projectId)
    .eq('user_id', userId);

  return { data, error };
}
```

#### 4. メンバーの削除

```typescript
async function removeMember(projectId: string, userId: string) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  return { success: !error, error };
}
```

## 権限管理の実装

### システム全体の権限階層

1. **system_owner**: profilesテーブルで管理されるシステム管理者
   - 全プロジェクトへのフルアクセス
   - 全ユーザーのプロファイル閲覧
   - システム統計の閲覧

2. **通常ユーザー**: project_membersテーブルで個別に権限管理
   - owner: プロジェクトの全権限
   - editor: 編集権限
   - viewer: 閲覧のみ

### プロジェクト作成者の自動登録

プロジェクト作成時、トリガーにより作成者は自動的に`project_members`テーブルにownerとして登録されます：

```sql
-- user_project_role関数の実装（system_owner対応版）
CREATE OR REPLACE FUNCTION user_project_role(project_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE
    -- system_ownerは常にowner権限
    WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_owner' THEN 'owner'
    -- project_membersから役割を取得
    ELSE (SELECT role FROM project_members WHERE project_id = project_uuid AND user_id = auth.uid())
  END
$$;
```

### アクセス制御の実装例

```typescript
// 権限チェックのヘルパー関数（system_owner対応版）
async function checkUserPermission(
  projectId: string,
  requiredRole: 'owner' | 'editor' | 'viewer'
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // system_ownerチェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'system_owner') {
    return true; // system_ownerは全権限
  }

  // メンバーシップチェック
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return false;

  // 権限レベルチェック
  const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
  return roleHierarchy[membership.role] >= roleHierarchy[requiredRole];
}
```

## プロジェクトとメンバー管理

### メンバー追加履歴の追跡

project_membersテーブルの`added_by`と`added_at`フィールドを使用して、簡易的な監査証跡を実現できます：

```sql
-- 最近のメンバー追加履歴
SELECT 
  p.name as project_name,
  u.email as member_email,
  pm.role,
  pm.added_at,
  au.email as added_by_email
FROM project_members pm
JOIN projects p ON pm.project_id = p.id
JOIN auth.users u ON pm.user_id = u.id
JOIN auth.users au ON pm.added_by = au.id
WHERE pm.added_at > NOW() - INTERVAL '30 days'
ORDER BY pm.added_at DESC;
```

### 特定ユーザーの活動追跡

```sql
-- 特定ユーザーが追加したメンバー一覧
SELECT 
  p.name as project_name,
  u.email as added_member,
  pm.role,
  pm.added_at
FROM project_members pm
JOIN projects p ON pm.project_id = p.id
JOIN auth.users u ON pm.user_id = u.id
WHERE pm.added_by = $1  -- 特定ユーザーのID
ORDER BY pm.added_at DESC;
```

> **将来の拡張**: より詳細な監査証跡が必要な場合は、`004_create_audit_tables.sql`に定義されている`audit_logs`テーブルの実装を検討してください。

## 実践的な使用シナリオ

### シナリオ1: アルバイトの追加

```typescript
// アルバイトを閲覧権限で追加
async function addPartTimeResearcher(
  projectId: string,
  researcherEmail: string
) {
  // 1. ユーザー検索
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', researcherEmail)
    .single();

  if (!users) {
    throw new Error('ユーザーが見つかりません');
  }

  // 2. viewerとして追加
  await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: users.id,
      role: 'viewer'  // 閲覧のみ
    });

  // 3. 成功通知（監査ログは未実装のため、通知やconsole.logで代替）
  console.log(`メンバー追加完了: ${researcherEmail} をプロジェクト ${projectId} に viewer として追加`);
}
```

### シナリオ2: チームプロジェクトの設定

```typescript
// 複数メンバーを一括追加
async function setupTeamProject(
  projectId: string,
  teamMembers: Array<{ userId: string; role: 'editor' | 'viewer' }>
) {
  // バッチ挿入用のデータ準備
  const membersToAdd = teamMembers.map(member => ({
    project_id: projectId,
    user_id: member.userId,
    role: member.role
  }));

  // 一括追加
  const { data, error } = await supabase
    .from('project_members')
    .insert(membersToAdd);

  if (error) {
    console.error('チームメンバー追加エラー:', error);
    return false;
  }

  return true;
}
```

## よくある質問

### Q1: プロジェクト作成者もproject_membersに登録すべきですか？

**A**: はい、現在の実装では、プロジェクト作成時にトリガーによって自動的に`project_members`テーブルにownerとして登録されます。これにより権限管理が一元化されます。

### Q2: user_idとadded_byが同じになることはありますか？

**A**: はい、自分自身を別のプロジェクトにメンバーとして追加する場合などに発生します。ただし、通常は管理者が他のユーザーを追加するため、異なることが多いです。

### Q3: ownerは複数設定できますか？

**A**: はい、技術的に可能で、場合によっては推奨されます。プロジェクトの共同管理者を設定する場合などに有用です。

### Q3-2: system_ownerとは何ですか？

**A**: system_ownerは`profiles`テーブルで管理されるシステム全体の管理者権限です。全プロジェクトへのアクセス権限を持ち、システム統計の閲覧などが可能です。

### Q4: メンバーの権限を下げることはできますか？

**A**: はい、editorからviewerへの変更は可能です。ただし、適切な権限チェックを実装してください。

### Q5: 削除されたユーザーのメンバーシップはどうなりますか？

**A**: 外部キー制約により、ユーザーが削除されてもメンバーシップレコードは残ります。定期的なクリーンアップが必要な場合があります。

## ベストプラクティス

1. **最小権限の原則**: 必要最小限の権限のみを付与
2. **定期的な権限レビュー**: 不要になったメンバーの削除
3. **監査ログの活用**: 誰がいつ誰を追加したかを記録
4. **エラーハンドリング**: 重複追加などのエラーを適切に処理

## 関連ドキュメント

- [データベース設計全体](./README.md)
- [テーブル作成スクリプト](./001_create_tables.sql)
- [RLSポリシー詳細](./002_create_rls_policies.sql)
- [監査ログ設計（参考）](./004_create_audit_tables.sql)
- [API追跡設計（参考）](./005_create_api_tracking.sql)