-- =============================================
-- RLS（Row Level Security）ポリシー設定
-- =============================================
-- 実行順序: 2番目
-- 内容: 全テーブルのRLSポリシーとヘルパー関数の作成
-- =============================================

-- =============================================
-- 1. RLSを有効化
-- =============================================

-- profilesテーブル
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- コアテーブル
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. 効率的なRLS関数の作成
-- =============================================

-- profilesのroleを取得する専用関数（RLSを完全にバイパス）
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ユーザーがアクセス可能なプロジェクトIDを返す関数
CREATE OR REPLACE FUNCTION user_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE
    WHEN get_user_role() = 'system_owner' THEN
      (SELECT id FROM projects)
    ELSE
      (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  END
$$;

-- ユーザーが特定のプロジェクトで持つロールを返す関数
CREATE OR REPLACE FUNCTION user_project_role(project_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE
    -- system_ownerは常にowner権限（get_user_role()を使用）
    WHEN get_user_role() = 'system_owner' THEN 'owner'
    -- project_membersから役割を取得
    ELSE (SELECT role FROM project_members WHERE project_id = project_uuid AND user_id = auth.uid())
  END
$$;

-- =============================================
-- 3. profilesテーブルのRLSポリシー
-- =============================================

-- 認証済みユーザーは自分のプロファイルのみ参照可能
CREATE POLICY "Users can view own profile" 
  ON public.profiles
  FOR SELECT 
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- system_ownerは全プロファイルを閲覧可能
CREATE POLICY "System owners can view all profiles" 
  ON public.profiles
  FOR SELECT 
  TO authenticated
  USING (
    get_user_role() = 'system_owner'
    OR (SELECT auth.uid()) = id  -- 自分のプロファイルは常に閲覧可能
  );

-- 新規ユーザー登録時のプロファイル作成を許可
CREATE POLICY "Users can insert own profile" 
  ON public.profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- 認証済みユーザーは自分のプロファイルのみ更新可能（roleは変更不可）
CREATE POLICY "Users can update own profile" 
  ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id 
    AND role = get_user_role()
  );

-- プロファイルの直接削除は不可（auth.usersの削除でカスケード削除）

-- =============================================
-- 4. projectsテーブルのRLSポリシー
-- =============================================

-- 作成者またはメンバーのみアクセス可能
CREATE POLICY "Users can view their projects" 
  ON projects FOR SELECT 
  TO authenticated 
  USING (
    -- id IN (SELECT user_project_ids())
    get_user_role() = 'system_owner'
    OR
    (created_by = auth.uid())
    OR
    (id IN ( SELECT user_project_ids() AS user_project_ids))
  );

-- 認証済みユーザーは新規作成可能
CREATE POLICY "Users can create projects" 
  ON projects FOR INSERT 
  TO authenticated 
  WITH CHECK ((SELECT auth.uid()) = created_by);

-- ownerのみ更新可能
CREATE POLICY "Owners can update projects" 
  ON projects FOR UPDATE 
  TO authenticated 
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- ownerのみ削除可能
CREATE POLICY "Owners can delete projects" 
  ON projects FOR DELETE 
  TO authenticated 
  USING (created_by = (SELECT auth.uid()));

-- =============================================
-- 5. project_membersテーブルのRLSポリシー
-- =============================================

-- プロジェクトメンバーは他のメンバーを閲覧可能
CREATE POLICY "Members can view project members" 
  ON project_members FOR SELECT 
  TO authenticated 
  USING (
    project_id IN (SELECT user_project_ids())
  );

-- ownerのみメンバー追加可能
CREATE POLICY "Owners can add members" 
  ON project_members FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_project_role(project_id) = 'owner'
    AND (SELECT auth.uid()) = added_by
  );

-- ownerのみメンバー更新可能
CREATE POLICY "Owners can update members" 
  ON project_members FOR UPDATE 
  TO authenticated 
  USING (user_project_role(project_id) = 'owner')
  WITH CHECK (user_project_role(project_id) = 'owner');

-- ownerのみメンバー削除可能
CREATE POLICY "Owners can delete members" 
  ON project_members FOR DELETE 
  TO authenticated 
  USING (user_project_role(project_id) = 'owner');

-- =============================================
-- 6. ownersテーブルのRLSポリシー
-- =============================================
-- owner_idカラムはNULL許可になっています。これは、物件情報を登録する際に、所有者が不明な場合や後で追加する場合があるため
  -- AND owner_id IS NOT NULLは：
  -- 1. パフォーマンス向上: 不要なNULL値を除外
  -- 2. 論理的な正確性: 所有者が設定されていない物件は、所有者情報へのアクセス権限の判定に含めない
  -- 3. 予期しない動作の防止: SQLのNULL処理による予期しない結果を防ぐ
  -- この条件により、「実際に所有者が設定されている物件に関連する所有者情報のみ」にアクセスを制限しています。
-- 関連するプロパティを持つユーザーのみアクセス可能
CREATE POLICY "Users can view related owners" 
  ON owners FOR SELECT 
  TO authenticated 
  USING (
    id IN (
      SELECT DISTINCT owner_id 
      FROM properties 
      WHERE project_id IN (SELECT user_project_ids())
      AND owner_id IS NOT NULL
    )
  );

-- editor以上の権限で作成可能
CREATE POLICY "Editors can create owners" 
  ON owners FOR INSERT 
  TO authenticated 
  WITH CHECK (true); -- 実際の権限チェックはpropertiesテーブルで行う

CREATE POLICY "Editors can update owners"
  ON owners FOR UPDATE
  TO authenticated
  USING (true)  -- 実際の権限チェックはpropertiesテーブルで行う
  WITH CHECK (true);

-- =============================================
-- 7. propertiesテーブルのRLSポリシー
-- =============================================

-- メンバーのプロジェクトのみアクセス可能
CREATE POLICY "Members can view properties" 
  ON properties FOR SELECT 
  TO authenticated 
  USING (
    project_id IN (SELECT user_project_ids())
  );

-- editor以上の権限で追加可能
CREATE POLICY "Editors can add properties" 
  ON properties FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_project_role(project_id) IN ('owner', 'editor')
    AND (SELECT auth.uid()) = imported_by
  );

-- editor以上の権限で更新可能
CREATE POLICY "Editors can update properties" 
  ON properties FOR UPDATE 
  TO authenticated 
  USING (user_project_role(project_id) IN ('owner', 'editor'))
  WITH CHECK (user_project_role(project_id) IN ('owner', 'editor'));

-- owner権限で削除可能
CREATE POLICY "Owners can delete properties" 
  ON properties FOR DELETE 
  TO authenticated 
  USING (user_project_role(project_id) = 'owner');

-- =============================================
-- 8. owner_companiesテーブルのRLSポリシー
-- =============================================

-- プロジェクトに関連する所有者情報のみアクセス可能
CREATE POLICY "Members can view owner companies" 
  ON owner_companies FOR SELECT 
  TO authenticated 
  USING (
    owner_id IN (
      SELECT DISTINCT owner_id 
      FROM properties 
      WHERE project_id IN (SELECT user_project_ids())
      AND owner_id IS NOT NULL
    )
  );

-- editor以上の権限で追加可能
CREATE POLICY "Editors can add owner companies" 
  ON owner_companies FOR INSERT 
  TO authenticated 
  WITH CHECK (
    owner_id IN (
      SELECT DISTINCT p.owner_id 
      FROM properties p
      WHERE p.project_id IN (SELECT user_project_ids())
      AND user_project_role(p.project_id) IN ('owner', 'editor')
      AND p.owner_id IS NOT NULL
    )
    AND (SELECT auth.uid()) = researched_by
  );

-- 追加した本人またはeditor以上の権限で更新可能
CREATE POLICY "Users can update own or editors and owners can update all" 
  ON owner_companies FOR UPDATE 
  TO authenticated 
  USING (
    researched_by = (SELECT auth.uid())
    OR owner_id IN (
      SELECT DISTINCT p.owner_id 
      FROM properties p
      WHERE user_project_role(p.project_id) IN ('owner', 'editor')
      AND p.owner_id IS NOT NULL
    )
  );

-- owner権限で削除可能
CREATE POLICY "Owners can delete owner companies" 
  ON owner_companies FOR DELETE 
  TO authenticated 
  USING (
    owner_id IN (
      SELECT DISTINCT p.owner_id 
      FROM properties p
      WHERE user_project_role(p.project_id) = 'owner'
      AND p.owner_id IS NOT NULL
    )
  );

-- =============================================
-- 9. import_logsテーブルのRLSポリシー
-- =============================================

-- プロジェクトメンバーは履歴を閲覧可能
CREATE POLICY "Members can view import logs" 
  ON import_logs FOR SELECT 
  TO authenticated 
  USING (
    project_id IN (SELECT user_project_ids())
  );

-- editor以上の権限で記録可能
CREATE POLICY "Editors can create import logs" 
  ON import_logs FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_project_role(project_id) IN ('owner', 'editor')
    AND (SELECT auth.uid()) = imported_by
  );

-- =============================================
-- ポリシーの確認用クエリ
-- =============================================
-- 以下のクエリで設定されたポリシーを確認できます：
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'projects', 'project_members', 'owners', 'properties', 'owner_companies', 'import_logs');