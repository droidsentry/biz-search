-- Add investigation status breakdown to get_project_stats function
-- Description: Modify get_project_stats to include pending_owners and unknown_owners counts
-- Date: 2025-08-02

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_project_stats(uuid);

-- Create updated function with investigation status breakdown
CREATE OR REPLACE FUNCTION public.get_project_stats(p_project_id uuid)
RETURNS TABLE(
  total_properties bigint,
  total_owners bigint,
  pending_owners bigint,      -- 追加: 調査前/調査中の所有者数
  completed_owners bigint,
  unknown_owners bigint,      -- 追加: 調査したが不明な所有者数
  owner_progress integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH project_properties_stats AS (
    -- プロジェクトの物件数を取得
    SELECT COUNT(DISTINCT pp.property_id) AS property_count
    FROM project_properties pp
    WHERE pp.project_id = p_project_id
      -- システム管理者または作成者のみアクセス可能
      AND (
        is_system_owner() OR 
        pp.added_by = (SELECT auth.uid())
      )
  ),
  project_owners AS (
    -- プロジェクトの所有者情報を取得（重複排除）
    SELECT DISTINCT
      o.id AS owner_id,
      o.investigation_status
    FROM project_properties pp
    INNER JOIN property_ownerships po ON pp.property_id = po.property_id
    INNER JOIN owners o ON po.owner_id = o.id
    WHERE pp.project_id = p_project_id
      AND po.is_current = true
      -- システム管理者または作成者のみアクセス可能
      AND (
        is_system_owner() OR 
        pp.added_by = (SELECT auth.uid())
      )
  ),
  project_owner_stats AS (
    -- 所有者統計を計算
    SELECT
      COUNT(DISTINCT owner_id) AS total_owners,
      COUNT(DISTINCT CASE WHEN investigation_status = 'pending' THEN owner_id END) AS pending_owners,
      COUNT(DISTINCT CASE WHEN investigation_status = 'completed' THEN owner_id END) AS completed_owners,
      COUNT(DISTINCT CASE WHEN investigation_status = 'unknown' THEN owner_id END) AS unknown_owners
    FROM project_owners
  )
  SELECT
    COALESCE(pps.property_count, 0) AS total_properties,
    COALESCE(pos.total_owners, 0) AS total_owners,
    COALESCE(pos.pending_owners, 0) AS pending_owners,
    COALESCE(pos.completed_owners, 0) AS completed_owners,
    COALESCE(pos.unknown_owners, 0) AS unknown_owners,
    CASE
      WHEN COALESCE(pos.total_owners, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(pos.completed_owners, 0)::numeric / pos.total_owners::numeric) * 100)::integer
    END AS owner_progress
  FROM project_properties_stats pps
  CROSS JOIN project_owner_stats pos;
END;
$function$;

-- Add comment to document the updated function
COMMENT ON FUNCTION public.get_project_stats(uuid) IS 'プロジェクトの統計情報を取得。調査ステータス別の所有者数を含む';