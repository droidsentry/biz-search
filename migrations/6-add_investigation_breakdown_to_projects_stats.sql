-- get_projects_with_full_stats関数を修正して調査ステータスの内訳を追加

-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.get_projects_with_full_stats();

-- 新しい関数を作成
CREATE FUNCTION public.get_projects_with_full_stats()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  total_properties bigint,
  total_owners bigint,
  pending_owners bigint,      -- 追加: 調査前
  completed_owners bigint,    -- 変更: 調査済のみ
  unknown_owners bigint,      -- 追加: 不明
  owner_progress integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      o.investigation_status
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
      COUNT(DISTINCT CASE WHEN investigation_status = 'pending' THEN owner_id END) AS pending_owners,
      COUNT(DISTINCT CASE WHEN investigation_status = 'completed' THEN owner_id END) AS completed_owners,
      COUNT(DISTINCT CASE WHEN investigation_status = 'unknown' THEN owner_id END) AS unknown_owners
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
    COALESCE(pos.pending_owners, 0)::BIGINT AS pending_owners,
    COALESCE(pos.completed_owners, 0)::BIGINT AS completed_owners,
    COALESCE(pos.unknown_owners, 0)::BIGINT AS unknown_owners,
    CASE
      WHEN COALESCE(pos.total_owners, 0) = 0 THEN 0
      -- completedとunknownの両方を調査済みとして進捗計算
      ELSE ROUND(((COALESCE(pos.completed_owners, 0) + COALESCE(pos.unknown_owners, 0))::numeric / pos.total_owners::numeric) * 100)::integer
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
$$;

-- 関数のコメントを更新
COMMENT ON FUNCTION public.get_projects_with_full_stats() IS 'プロジェクト一覧と詳細な統計情報（物件数、所有者数、調査ステータス内訳、進捗率）を取得。進捗率はcompletedとunknownの合計で計算。';