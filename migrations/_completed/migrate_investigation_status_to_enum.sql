-- Migration: Migrate investigation_completed to investigation_status enum
-- Description: Replace boolean investigation_completed with enum investigation_status
--              to support 'pending', 'completed', and 'unknown' states
-- Date: 2025-07-29

-- Step 1: Create the enum type
CREATE TYPE investigation_status AS ENUM ('pending', 'completed', 'unknown');

-- Step 2: Add the new column with a default value
ALTER TABLE public.owners 
ADD COLUMN investigation_status investigation_status 
DEFAULT 'pending'::investigation_status
NOT NULL;

-- Step 3: Migrate existing data
UPDATE public.owners 
SET investigation_status = CASE 
    WHEN investigation_completed = true THEN 'completed'::investigation_status
    ELSE 'pending'::investigation_status
END;

-- Step 4: Update all functions that reference investigation_completed
-- Note: Functions need to be dropped and recreated when return type changes

-- 4.1: Drop and recreate get_project_owners_view function
DROP FUNCTION IF EXISTS public.get_project_owners_view(uuid);
CREATE FUNCTION public.get_project_owners_view(p_project_id uuid)
 RETURNS TABLE(project_property_id uuid, property_id uuid, property_address text, added_at timestamp with time zone, import_source_file text, ownership_id uuid, ownership_start timestamp with time zone, owner_id uuid, owner_name text, owner_address text, owner_lat numeric, owner_lng numeric, owner_street_view_available boolean, owner_investigation_status investigation_status, owner_created_at timestamp with time zone, owner_updated_at timestamp with time zone, company_id uuid, company_name text, company_number text, company_rank integer, owner_companies_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH owner_company_counts AS (
    -- 各所有者の会社数を事前に計算
    SELECT 
      oc.owner_id AS oc_owner_id,
      COUNT(*) AS companies_count
    FROM owner_companies oc
    GROUP BY oc.owner_id
  )
  SELECT 
    pp.id AS project_property_id,
    p.id AS property_id,
    p.address AS property_address,
    pp.added_at,
    pp.import_source_file,
    po.id AS ownership_id,
    po.ownership_start,
    o.id AS owner_id,
    o.name AS owner_name,
    o.address AS owner_address,
    o.lat AS owner_lat,
    o.lng AS owner_lng,
    o.street_view_available AS owner_street_view_available,
    o.investigation_status AS owner_investigation_status,  -- 変更箇所
    o.created_at AS owner_created_at,
    o.updated_at AS owner_updated_at,
    oc.id AS company_id,
    oc.company_name,
    oc.company_number,
    oc.rank AS company_rank,
    COALESCE(occ.companies_count, 0) AS owner_companies_count
  FROM project_properties pp
  INNER JOIN properties p ON pp.property_id = p.id
  INNER JOIN property_ownerships po ON p.id = po.property_id
  INNER JOIN owners o ON po.owner_id = o.id
  LEFT JOIN owner_companies oc ON o.id = oc.owner_id AND oc.rank = 1
  LEFT JOIN owner_company_counts occ ON o.id = occ.oc_owner_id
  WHERE pp.project_id = p_project_id
    AND po.is_current = true
    -- システム管理者または作成者のみアクセス可能
    AND (
      is_system_owner() OR 
      pp.added_by = (SELECT auth.uid())
    )
  ORDER BY pp.added_at DESC, p.address, o.name;
END;
$function$;

-- 4.2: Update get_projects_with_owner_progress function
CREATE OR REPLACE FUNCTION public.get_projects_with_owner_progress()
 RETURNS TABLE(id uuid, name text, description text, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, total_owners bigint, completed_owners bigint, progress integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH project_owners AS (
    -- 各プロジェクトの所有者情報を取得（重複排除）
    SELECT DISTINCT
      p.id AS project_id,
      o.id AS owner_id,
      o.investigation_status  -- 変更箇所
    FROM projects p
    INNER JOIN project_properties pp ON p.id = pp.project_id
    INNER JOIN property_ownerships po ON pp.property_id = po.property_id
    INNER JOIN owners o ON po.owner_id = o.id
    WHERE po.is_current = true
  ),
  project_stats AS (
    -- プロジェクトごとの統計を計算
    SELECT
      project_id,
      COUNT(DISTINCT owner_id) AS total_owners,
      COUNT(DISTINCT CASE WHEN investigation_status = 'completed' THEN owner_id END) AS completed_owners  -- 変更箇所
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
    COALESCE(ps.total_owners, 0) AS total_owners,
    COALESCE(ps.completed_owners, 0) AS completed_owners,
    CASE
      WHEN COALESCE(ps.total_owners, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(ps.completed_owners, 0)::numeric / ps.total_owners::numeric) * 100)::integer
    END AS progress
  FROM projects p
  LEFT JOIN project_stats ps ON p.id = ps.project_id
  WHERE p.created_by = (SELECT auth.uid())  -- RLSに相当する条件
  ORDER BY p.created_at DESC;
END;
$function$;

-- 4.3: Drop and recreate get_project_properties_view function
DROP FUNCTION IF EXISTS public.get_project_properties_view(uuid);
CREATE FUNCTION public.get_project_properties_view(p_project_id uuid)
 RETURNS TABLE(project_property_id uuid, property_id uuid, property_address text, added_at timestamp with time zone, import_source_file text, owner_count bigint, primary_owner_id uuid, primary_owner_name text, primary_owner_address text, primary_owner_lat numeric, primary_owner_lng numeric, primary_owner_street_view_available boolean, primary_owner_investigation_status investigation_status, primary_company_id uuid, primary_company_name text, primary_company_position text, primary_owner_companies_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH property_owners AS (
    -- 各物件の現在の所有者を取得
    SELECT 
      pp.id AS pp_id,  -- 別名に変更
      pp.property_id AS prop_id,
      p.address AS prop_address,
      pp.added_at AS added_date,
      pp.import_source_file AS import_file,
      o.id AS owner_id,
      o.name AS owner_name,
      o.address AS owner_address,
      o.lat,
      o.lng,
      o.street_view_available,
      o.investigation_status,  -- 変更箇所
      -- 最初の所有者を代表として選択するための行番号
      ROW_NUMBER() OVER (PARTITION BY pp.id ORDER BY o.created_at, o.id) AS owner_rank
    FROM project_properties pp
    INNER JOIN properties p ON pp.property_id = p.id
    INNER JOIN property_ownerships po ON p.id = po.property_id
    INNER JOIN owners o ON po.owner_id = o.id
    WHERE pp.project_id = p_project_id
      AND po.is_current = true
      -- システム管理者または作成者のみアクセス可能
      AND (
        is_system_owner() OR 
        pp.added_by = (SELECT auth.uid())
      )
  ),
  owner_counts AS (
    -- 各物件の所有者数をカウント
    SELECT 
      pp_id,
      COUNT(DISTINCT owner_id) AS owner_count
    FROM property_owners
    GROUP BY pp_id
  ),
  primary_owners_with_company AS (
    -- 代表所有者（最初の1人）の会社情報を取得
    SELECT 
      po.*,
      oc.id AS company_id,
      oc.company_name,
      COUNT(oc2.id) AS companies_count
    FROM property_owners po
    LEFT JOIN owner_companies oc ON po.owner_id = oc.owner_id AND oc.rank = 1
    LEFT JOIN owner_companies oc2 ON po.owner_id = oc2.owner_id
    WHERE po.owner_rank = 1
    GROUP BY po.pp_id, po.prop_id, po.prop_address, po.added_date, 
             po.import_file, po.owner_id, po.owner_name, po.owner_address, 
             po.lat, po.lng, po.street_view_available, po.investigation_status,  -- 変更箇所
             po.owner_rank, oc.id, oc.company_name
  )
  -- 最終結果を構築
  SELECT 
    pow.pp_id AS project_property_id,
    pow.prop_id AS property_id,
    pow.prop_address AS property_address,
    pow.added_date AS added_at,
    pow.import_file AS import_source_file,
    COALESCE(oc.owner_count, 1) AS owner_count,
    pow.owner_id AS primary_owner_id,
    pow.owner_name AS primary_owner_name,
    pow.owner_address AS primary_owner_address,
    pow.lat AS primary_owner_lat,
    pow.lng AS primary_owner_lng,
    pow.street_view_available AS primary_owner_street_view_available,
    pow.investigation_status AS primary_owner_investigation_status,  -- 変更箇所
    pow.company_id AS primary_company_id,
    pow.company_name AS primary_company_name,
    NULL::text AS primary_company_position,  -- positionを削除してNULLを返す
    pow.companies_count AS primary_owner_companies_count
  FROM primary_owners_with_company pow
  LEFT JOIN owner_counts oc ON pow.pp_id = oc.pp_id
  ORDER BY pow.added_date DESC;
END;
$function$;

-- 4.4: Update get_projects_with_full_stats function
CREATE OR REPLACE FUNCTION public.get_projects_with_full_stats()
 RETURNS TABLE(id uuid, name text, description text, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, total_properties bigint, total_owners bigint, completed_owners bigint, owner_progress integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
      o.investigation_status  -- 変更箇所
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
      COUNT(DISTINCT CASE WHEN investigation_status = 'completed' THEN owner_id END) AS completed_owners  -- 変更箇所
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
$function$;

-- 4.5: Update get_project_stats function
CREATE OR REPLACE FUNCTION public.get_project_stats(p_project_id uuid)
 RETURNS TABLE(total_properties bigint, total_owners bigint, completed_owners bigint, owner_progress integer)
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
      o.investigation_status  -- 変更箇所
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
      COUNT(DISTINCT CASE WHEN investigation_status = 'completed' THEN owner_id END) AS completed_owners  -- 変更箇所
    FROM project_owners
  )
  SELECT
    COALESCE(pps.property_count, 0) AS total_properties,
    COALESCE(pos.total_owners, 0) AS total_owners,
    COALESCE(pos.completed_owners, 0) AS completed_owners,
    CASE
      WHEN COALESCE(pos.total_owners, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(pos.completed_owners, 0)::numeric / pos.total_owners::numeric) * 100)::integer
    END AS owner_progress
  FROM project_properties_stats pps
  CROSS JOIN project_owner_stats pos;
END;
$function$;

-- Step 5: Add comment to document the new column
COMMENT ON COLUMN public.owners.investigation_status IS '調査状態: pending（未調査）, completed（調査完了）, unknown（調査したが不明）';

-- Step 6: Drop the old column (実行前に十分な確認が必要)
-- 注意: この手順は全てのアプリケーションコードが更新された後に実行してください
ALTER TABLE public.owners DROP COLUMN investigation_completed;

-- Step 7: Create index for better query performance
CREATE INDEX idx_owners_investigation_status ON public.owners(investigation_status);

-- Note: アプリケーションコードの更新が必要な箇所
-- 1. investigation_completed = true/false の条件を investigation_status = 'completed'/'pending' に変更
-- 2. 新規作成時のデフォルト値の設定
-- 3. 「調査したが不明」の場合は investigation_status = 'unknown' を設定