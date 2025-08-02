-- get_project_properties_view関数にowners.updated_byフィールドを追加

-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.get_project_properties_view(uuid);

-- 新しい関数を作成
CREATE FUNCTION public.get_project_properties_view(p_project_id uuid)
RETURNS TABLE(
  project_property_id uuid, 
  property_id uuid, 
  property_address text, 
  added_at timestamp with time zone, 
  import_source_file text, 
  owner_count bigint, 
  primary_owner_id uuid, 
  primary_owner_name text, 
  primary_owner_address text, 
  primary_owner_lat numeric, 
  primary_owner_lng numeric, 
  primary_owner_street_view_available boolean, 
  primary_owner_investigation_status investigation_status, 
  primary_owner_updated_at timestamp with time zone,
  primary_owner_updated_by uuid,  -- 追加
  primary_company_id uuid, 
  primary_company_name text, 
  primary_company_updated_at timestamp with time zone,
  primary_owner_companies_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH property_owners AS (
    -- 各物件の現在の所有者を取得
    SELECT 
      pp.id AS pp_id,
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
      o.investigation_status,
      o.updated_at AS owner_updated_at,
      o.updated_by AS owner_updated_by,  -- 追加
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
      oc.updated_at AS company_updated_at,
      COUNT(oc2.id) AS companies_count
    FROM property_owners po
    LEFT JOIN owner_companies oc ON po.owner_id = oc.owner_id AND oc.rank = 1
    LEFT JOIN owner_companies oc2 ON po.owner_id = oc2.owner_id
    WHERE po.owner_rank = 1
    GROUP BY po.pp_id, po.prop_id, po.prop_address, po.added_date, 
             po.import_file, po.owner_id, po.owner_name, po.owner_address, 
             po.lat, po.lng, po.street_view_available, po.investigation_status,
             po.owner_updated_at, po.owner_updated_by,  -- 追加
             po.owner_rank, oc.id, oc.company_name, oc.updated_at
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
    pow.investigation_status AS primary_owner_investigation_status,
    pow.owner_updated_at AS primary_owner_updated_at,
    pow.owner_updated_by AS primary_owner_updated_by,  -- 追加
    pow.company_id AS primary_company_id,
    pow.company_name AS primary_company_name,
    pow.company_updated_at AS primary_company_updated_at,
    pow.companies_count AS primary_owner_companies_count
  FROM primary_owners_with_company pow
  LEFT JOIN owner_counts oc ON pow.pp_id = oc.pp_id
  ORDER BY pow.added_date DESC;
END;
$function$;