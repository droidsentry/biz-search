-- 既存の関数を削除
DROP FUNCTION IF EXISTS get_projects_with_full_stats();

-- 関数を再作成（返り値の型を明示的に定義）
CREATE FUNCTION get_projects_with_full_stats()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_properties BIGINT,  -- INTEGERからBIGINTに変更（COUNT()の結果はBIGINT）
  total_owners BIGINT,      -- INTEGERからBIGINTに変更
  completed_owners BIGINT,  -- INTEGERからBIGINTに変更
  owner_progress INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH project_properties_stats AS (
    -- 各プロジェクトの物件数を取得
    SELECT
      pp.project_id,
      COUNT(DISTINCT pp.property_id) AS property_count
    FROM project_properties pp
    GROUP BY pp.project_id
  ),
  project_owners AS (
    -- 各プロジェクトの所有者情報を取得（重複排除）
    SELECT DISTINCT
      p.id AS project_id,
      o.id AS owner_id,
      o.investigation_completed
    FROM projects p
    INNER JOIN project_properties pp ON p.id = pp.project_id
    INNER JOIN property_ownerships po ON pp.property_id = po.property_id
    INNER JOIN owners o ON po.owner_id = o.id
    WHERE po.is_current = true
  ),
  project_owner_stats AS (
    -- プロジェクトごとの所有者統計を計算
    SELECT
      project_id,
      COUNT(DISTINCT owner_id) AS total_owners,
      COUNT(DISTINCT CASE WHEN investigation_completed = true THEN owner_id END) AS completed_owners
    FROM project_owners
    GROUP BY project_id
  )
  -- 最終結果を構築
  SELECT
    p.id,
    p.name,
    p.description,
    p.created_by,
    p.created_at,
    p.updated_at,
    COALESCE(pps.property_count, 0)::BIGINT AS total_properties,
    COALESCE(pos.total_owners, 0)::BIGINT AS total_owners,
    COALESCE(pos.completed_owners, 0)::BIGINT AS completed_owners,
    CASE
      WHEN COALESCE(pos.total_owners, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(pos.completed_owners, 0)::numeric / pos.total_owners::numeric) * 100)::integer
    END AS owner_progress
  FROM projects p
  LEFT JOIN project_properties_stats pps ON p.id = pps.project_id
  LEFT JOIN project_owner_stats pos ON p.id = pos.project_id
  WHERE 
    -- RLSポリシーと同じ条件を使用
    is_system_owner() 
    OR p.created_by = get_active_profile_id()
    OR p.id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = get_active_profile_id()
    )
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;