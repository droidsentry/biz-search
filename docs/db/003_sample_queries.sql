-- =============================================
-- サンプルクエリとデータ操作例
-- =============================================

-- 1. 新規プロジェクトの作成
INSERT INTO projects (name, description, created_by)
VALUES ('渋谷区物件調査2025', '渋谷区の空き家物件の所有者調査', auth.uid());

-- 2. プロジェクトメンバーの追加
INSERT INTO project_members (project_id, user_id, role, added_by)
VALUES (
  'プロジェクトのUUID',
  'メンバーのユーザーID',
  'editor', -- または 'viewer'
  auth.uid()
);

-- 3. 所有者情報の登録または取得
-- 既存チェックと新規作成を1つのクエリで実行
WITH owner_upsert AS (
  INSERT INTO owners (name, address)
  VALUES ('山田太郎', '東京都渋谷区渋谷1-1-1')
  ON CONFLICT (name, address) DO NOTHING
  RETURNING id
)
SELECT COALESCE(
  (SELECT id FROM owner_upsert),
  (SELECT id FROM owners WHERE name = '山田太郎' AND address = '東京都渋谷区渋谷1-1-1')
) as owner_id;

-- 4. 物件情報の一括登録
INSERT INTO properties (
  project_id, property_address, owner_id, 
  source_file_name, lat, lng, street_view_available, 
  imported_by
)
VALUES 
  ('プロジェクトのUUID', '東京都渋谷区神南1-1-1', '所有者UUID', 'sample.pdf', 35.6612, 139.7035, true, auth.uid()),
  ('プロジェクトのUUID', '東京都渋谷区神南1-1-2', '所有者UUID', 'sample.pdf', 35.6613, 139.7036, false, auth.uid());

-- 5. 所有者の会社情報追加
INSERT INTO owner_companies (
  owner_id, company_name, company_number, position, 
  source_url, rank, researched_by
)
VALUES 
  ('所有者UUID', '株式会社サンプル', '1234567890123', '代表取締役', 'https://example.com', 1, auth.uid());

-- 6. インポートログの記録
INSERT INTO import_logs (
  project_id, file_count, property_count, 
  success_count, error_count, imported_by
)
VALUES 
  ('プロジェクトのUUID', 5, 10, 9, 1, auth.uid());

-- =============================================
-- よく使うクエリ例
-- =============================================

-- 1. ユーザーがアクセス可能な全プロジェクトを取得
SELECT s.*, 
  CASE 
    WHEN s.created_by = auth.uid() THEN 'owner'
    ELSE sm.role
  END as user_role
FROM projects s
LEFT JOIN project_members sm ON s.id = sm.project_id AND sm.user_id = auth.uid()
WHERE s.id IN (SELECT user_project_ids())
ORDER BY s.created_at DESC;

-- 2. プロジェクトの物件一覧（所有者情報付き）
SELECT 
  p.*,
  o.name as owner_name,
  o.address as owner_address
FROM properties p
LEFT JOIN owners o ON p.owner_id = o.id
WHERE p.project_id = 'プロジェクトのUUID'
ORDER BY p.imported_at DESC;

-- 3. 所有者の会社情報を含む詳細情報
SELECT 
  o.*,
  oc.company_name,
  oc.company_number,
  oc.position,
  oc.source_url,
  oc.rank
FROM owners o
LEFT JOIN owner_companies oc ON o.id = oc.owner_id
WHERE o.id = '所有者UUID'
ORDER BY oc.rank;

-- 4. プロジェクトの統計情報
SELECT 
  s.id,
  s.name,
  COUNT(DISTINCT p.id) as property_count,
  COUNT(DISTINCT p.owner_id) as unique_owner_count,
  COUNT(DISTINCT il.id) as import_count
FROM projects s
LEFT JOIN properties p ON s.id = p.project_id
LEFT JOIN import_logs il ON s.id = il.project_id
WHERE s.id = 'プロジェクトのUUID'
GROUP BY s.id, s.name;

-- 5. 重複する物件アドレスのチェック
SELECT property_address, COUNT(*) as count
FROM properties
WHERE project_id = 'プロジェクトのUUID'
GROUP BY property_address
HAVING COUNT(*) > 1;

-- =============================================
-- system_owner専用のクエリ例
-- =============================================

-- 1. 全プロジェクトの一覧（system_ownerのみ実行可能）
SELECT 
  p.*,
  u.email as created_by_email,
  COUNT(DISTINCT prop.id) as property_count,
  COUNT(DISTINCT pm.user_id) as member_count
FROM projects p
LEFT JOIN auth.users u ON p.created_by = u.id
LEFT JOIN properties prop ON p.id = prop.project_id
LEFT JOIN project_members pm ON p.id = pm.project_id
GROUP BY p.id, u.email
ORDER BY p.created_at DESC;

-- 2. 全ユーザーのロール一覧（system_ownerのみ実行可能）
SELECT 
  prof.id,
  prof.email,
  prof.username,
  prof.role,
  COUNT(DISTINCT pm.project_id) as project_count,
  prof.created_at
FROM profiles prof
LEFT JOIN project_members pm ON prof.id = pm.user_id
GROUP BY prof.id
ORDER BY prof.role, prof.created_at DESC;

-- 3. 特定ユーザーをsystem_ownerに昇格（管理者操作）
UPDATE profiles 
SET role = 'system_owner' 
WHERE email = 'admin@example.com';

-- 4. システム全体の統計情報（system_ownerのみ実行可能）
SELECT 
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT prop.id) as total_properties,
  COUNT(DISTINCT o.id) as total_owners,
  COUNT(DISTINCT prof.id) as total_users,
  COUNT(DISTINCT CASE WHEN prof.role = 'system_owner' THEN prof.id END) as system_owner_count
FROM projects p
CROSS JOIN properties prop
CROSS JOIN owners o
CROSS JOIN profiles prof;