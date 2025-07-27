-- biz-searchからbiz-search-demoへの差分適用SQL (v2)
-- 作成日: 2025-07-27
-- 
-- 差分確認結果：
-- 1. biz-searchには存在するがbiz-search-demoには存在しないテーブル:
--    - import_staging, import_jobs
-- 2. biz-searchには存在するがbiz-search-demoには存在しない関数:
--    - cleanup_old_staging_data, create_project_and_import_properties
--    - get_project_owners_view, get_project_properties_view, get_project_stats
--    - get_projects_with_full_stats, get_projects_with_owner_progress
-- 3. biz-searchには存在するがbiz-search-demoには存在しないトリガー:
--    - なし（import_jobs_updated_atはbiz-search-demoに既に存在）
-- 4. カラムの差分:
--    - owner_companiesテーブルのpositionカラム（biz-search-demoには存在、biz-searchには無い）

BEGIN;

-- ========================================
-- 1. 新規テーブルの作成: import_staging
-- ========================================
CREATE TABLE IF NOT EXISTS public.import_staging (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL,
    property_address text NOT NULL,
    owner_name text NOT NULL,
    owner_address text NOT NULL,
    lat numeric NULL,
    lng numeric NULL,
    street_view_available boolean NULL DEFAULT false,
    source_file_name text NULL,
    created_at timestamptz NULL DEFAULT now(),
    CONSTRAINT import_staging_pkey PRIMARY KEY (id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_import_staging_session_id ON public.import_staging(session_id);

-- コメント追加
COMMENT ON TABLE public.import_staging IS 'PDFインポートの一時ステージングテーブル';

-- ========================================
-- 2. 新規テーブルの作成: import_jobs
-- ========================================
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    project_name text NOT NULL,
    project_description text NULL,
    status text NOT NULL DEFAULT 'pending',
    total_count integer NOT NULL DEFAULT 0,
    processed_count integer NULL DEFAULT 0,
    success_count integer NULL DEFAULT 0,
    error_count integer NULL DEFAULT 0,
    errors jsonb NULL DEFAULT '[]'::jsonb,
    started_at timestamptz NULL,
    completed_at timestamptz NULL,
    created_at timestamptz NULL DEFAULT now(),
    updated_at timestamptz NULL DEFAULT now(),
    CONSTRAINT import_jobs_pkey PRIMARY KEY (id),
    CONSTRAINT import_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
    CONSTRAINT import_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_import_jobs_project_id ON public.import_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON public.import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_session_id ON public.import_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);

-- コメント追加
COMMENT ON TABLE public.import_jobs IS 'PDFインポートジョブの管理テーブル';

-- ========================================
-- 3. owner_companiesテーブルのpositionカラム削除
-- ========================================
ALTER TABLE public.owner_companies DROP COLUMN IF EXISTS position;

-- ========================================
-- 4. 新規関数の作成
-- ========================================

-- cleanup_old_staging_data関数
CREATE OR REPLACE FUNCTION public.cleanup_old_staging_data()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM import_staging WHERE created_at < now() - interval '24 hours';
END;
$function$;

-- create_project_and_import_properties関数
CREATE OR REPLACE FUNCTION public.create_project_and_import_properties(
  p_project_name text, 
  p_project_description text, 
  p_session_id uuid, 
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_project_id uuid;
  v_job_id uuid;
  v_total_count int;
  v_imported_count int := 0;
  v_error_count int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_current_timestamp timestamptz := now();
BEGIN
  -- トランザクション開始（暗黙的）
  
  -- 1. ステージングデータの件数確認
  SELECT COUNT(*) INTO v_total_count
  FROM import_staging
  WHERE session_id = p_session_id;
  
  IF v_total_count = 0 THEN
    RAISE EXCEPTION 'No data found for session %', p_session_id;
  END IF;
  
  -- 2. プロジェクト作成
  INSERT INTO projects (name, description, created_by)
  VALUES (p_project_name, p_project_description, p_user_id)
  RETURNING id INTO v_project_id;
  
  -- 3. ジョブ記録の作成
  INSERT INTO import_jobs (
    project_id, session_id, user_id, project_name, project_description,
    status, total_count, started_at
  ) VALUES (
    v_project_id, p_session_id, p_user_id, p_project_name, p_project_description,
    'processing', v_total_count, now()
  ) RETURNING id INTO v_job_id;
  
  -- 4. 一時テーブルに必要なデータを整理
  CREATE TEMP TABLE temp_import ON COMMIT DROP AS
  SELECT DISTINCT ON (owner_name, owner_address)
    owner_name, owner_address, lat, lng, street_view_available
  FROM import_staging
  WHERE session_id = p_session_id;
  
  -- 5. 所有者マスターの一括upsert
  INSERT INTO owners (name, address, lat, lng, street_view_available)
  SELECT owner_name, owner_address, lat, lng, street_view_available
  FROM temp_import
  ON CONFLICT (name, address) 
  DO UPDATE SET
    lat = COALESCE(EXCLUDED.lat, owners.lat),
    lng = COALESCE(EXCLUDED.lng, owners.lng),
    street_view_available = COALESCE(EXCLUDED.street_view_available, owners.street_view_available),
    updated_at = now();
  
  -- 6. 物件マスターの一括upsert
  INSERT INTO properties (address)
  SELECT DISTINCT property_address
  FROM import_staging
  WHERE session_id = p_session_id
  ON CONFLICT (address) DO NOTHING;
  
  -- 7. 物件所有履歴の一括挿入
  INSERT INTO property_ownerships (property_id, owner_id, ownership_start, is_current, source, recorded_by)
  SELECT DISTINCT
    p.id,
    o.id,
    v_current_timestamp,
    true,
    'pdf_import',
    p_user_id
  FROM import_staging s
  JOIN properties p ON p.address = s.property_address
  JOIN owners o ON o.name = s.owner_name AND o.address = s.owner_address
  WHERE s.session_id = p_session_id
  ON CONFLICT (property_id, owner_id) DO NOTHING;
  
  -- 8. プロジェクト物件の関連付け
  INSERT INTO project_properties (project_id, property_id, added_by, import_source_file)
  SELECT DISTINCT
    v_project_id,
    p.id,
    p_user_id,
    s.source_file_name
  FROM import_staging s
  JOIN properties p ON p.address = s.property_address
  WHERE s.session_id = p_session_id
  ON CONFLICT (project_id, property_id) DO NOTHING;
  
  -- 9. インポート件数の計算（実際に登録されたプロジェクト物件数）
  SELECT COUNT(*) INTO v_imported_count
  FROM project_properties
  WHERE project_id = v_project_id;
  
  -- 10. ジョブ記録の更新
  UPDATE import_jobs SET
    status = 'completed',
    processed_count = v_total_count,
    success_count = v_imported_count,
    error_count = v_error_count,
    errors = v_errors,
    completed_at = now(),
    updated_at = now()
  WHERE id = v_job_id;
  
  -- 11. ステージングデータの削除
  DELETE FROM import_staging WHERE session_id = p_session_id;
  
  -- 12. 結果を返す
  RETURN jsonb_build_object(
    'success', true,
    'projectId', v_project_id,
    'projectName', p_project_name,
    'totalCount', v_total_count,
    'importedCount', v_imported_count,
    'errorCount', v_error_count,
    'errors', v_errors
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- エラー時はジョブを失敗状態に更新
    IF v_job_id IS NOT NULL THEN
      UPDATE import_jobs SET
        status = 'failed',
        error_count = v_total_count,
        errors = jsonb_build_array(jsonb_build_object(
          'error', SQLERRM,
          'detail', SQLSTATE
        )),
        completed_at = now(),
        updated_at = now()
      WHERE id = v_job_id;
    END IF;
    
    -- エラーを再発生させてロールバック
    RAISE;
END;
$function$;

-- get_project_owners_view関数
CREATE OR REPLACE FUNCTION public.get_project_owners_view(p_project_id uuid)
RETURNS TABLE(
  project_property_id uuid, property_id uuid, property_address text, 
  added_at timestamp with time zone, import_source_file text, 
  ownership_id uuid, ownership_start timestamp with time zone, 
  owner_id uuid, owner_name text, owner_address text, 
  owner_lat numeric, owner_lng numeric, owner_street_view_available boolean, 
  owner_investigation_completed boolean, owner_created_at timestamp with time zone, 
  owner_updated_at timestamp with time zone, company_id uuid, 
  company_name text, company_number text, company_rank integer, 
  owner_companies_count bigint
)
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
    o.investigation_completed AS owner_investigation_completed,
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
    AND pp.added_by = (SELECT auth.uid())  -- RLS相当の条件
  ORDER BY pp.added_at DESC, p.address, o.name;
END;
$function$;

-- get_project_properties_view関数
CREATE OR REPLACE FUNCTION public.get_project_properties_view(p_project_id uuid)
RETURNS TABLE(
  project_property_id uuid, property_id uuid, property_address text, 
  added_at timestamp with time zone, import_source_file text, 
  owner_count bigint, primary_owner_id uuid, primary_owner_name text, 
  primary_owner_address text, primary_owner_lat numeric, primary_owner_lng numeric, 
  primary_owner_street_view_available boolean, primary_owner_investigation_completed boolean, 
  primary_company_id uuid, primary_company_name text, primary_company_position text, 
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
      o.investigation_completed,
      -- 最初の所有者を代表として選択するための行番号
      ROW_NUMBER() OVER (PARTITION BY pp.id ORDER BY o.created_at, o.id) AS owner_rank
    FROM project_properties pp
    INNER JOIN properties p ON pp.property_id = p.id
    INNER JOIN property_ownerships po ON p.id = po.property_id
    INNER JOIN owners o ON po.owner_id = o.id
    WHERE pp.project_id = p_project_id
      AND po.is_current = true
      AND pp.added_by = (SELECT auth.uid())  -- RLS相当の条件
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
             po.lat, po.lng, po.street_view_available, po.investigation_completed,
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
    pow.investigation_completed AS primary_owner_investigation_completed,
    pow.company_id AS primary_company_id,
    pow.company_name AS primary_company_name,
    NULL::text AS primary_company_position,  -- positionを削除してNULLを返す
    pow.companies_count AS primary_owner_companies_count
  FROM primary_owners_with_company pow
  LEFT JOIN owner_counts oc ON pow.pp_id = oc.pp_id
  ORDER BY pow.added_date DESC;
END;
$function$;

-- get_project_stats関数
CREATE OR REPLACE FUNCTION public.get_project_stats(p_project_id uuid)
RETURNS TABLE(
  total_properties bigint, 
  total_owners bigint, 
  completed_owners bigint, 
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
  ),
  project_owners AS (
    -- プロジェクトの所有者情報を取得（重複排除）
    SELECT DISTINCT
      o.id AS owner_id,
      o.investigation_completed
    FROM project_properties pp
    INNER JOIN property_ownerships po ON pp.property_id = po.property_id
    INNER JOIN owners o ON po.owner_id = o.id
    WHERE pp.project_id = p_project_id
      AND po.is_current = true
  ),
  project_owner_stats AS (
    -- 所有者統計を計算
    SELECT
      COUNT(DISTINCT owner_id) AS total_owners,
      COUNT(DISTINCT CASE WHEN investigation_completed = true THEN owner_id END) AS completed_owners
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

-- get_projects_with_full_stats関数
CREATE OR REPLACE FUNCTION public.get_projects_with_full_stats()
RETURNS TABLE(
  id uuid, name text, description text, created_by uuid, 
  created_at timestamp with time zone, updated_at timestamp with time zone, 
  total_properties bigint, total_owners bigint, completed_owners bigint, 
  owner_progress integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    COALESCE(pps.property_count, 0) AS total_properties,
    COALESCE(pos.total_owners, 0) AS total_owners,
    COALESCE(pos.completed_owners, 0) AS completed_owners,
    CASE
      WHEN COALESCE(pos.total_owners, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(pos.completed_owners, 0)::numeric / pos.total_owners::numeric) * 100)::integer
    END AS owner_progress
  FROM projects p
  LEFT JOIN project_properties_stats pps ON p.id = pps.project_id
  LEFT JOIN project_owner_stats pos ON p.id = pos.project_id
  WHERE p.created_by = (SELECT auth.uid())  -- RLSに相当する条件
  ORDER BY p.created_at DESC;
END;
$function$;

-- get_projects_with_owner_progress関数
CREATE OR REPLACE FUNCTION public.get_projects_with_owner_progress()
RETURNS TABLE(
  id uuid, name text, description text, created_by uuid, 
  created_at timestamp with time zone, updated_at timestamp with time zone, 
  total_owners bigint, completed_owners bigint, progress integer
)
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
      o.investigation_completed
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

-- ========================================
-- 5. トリガーの作成（既に存在する可能性があるためIF NOT EXISTSは使用できない）
-- ========================================

-- import_jobsテーブルのupdated_atトリガーは既に存在するため、作成不要

-- ========================================
-- 6. 制約の追加（存在確認付き）
-- ========================================

-- ownersテーブルのユニーク制約（既に存在する可能性あり）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'owners_name_address_key'
    ) THEN
        ALTER TABLE public.owners ADD CONSTRAINT owners_name_address_key UNIQUE (name, address);
    END IF;
END $$;

-- project_propertiesテーブルのユニーク制約（既に存在する可能性あり）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_properties_project_id_property_id_key'
    ) THEN
        ALTER TABLE public.project_properties ADD CONSTRAINT project_properties_project_id_property_id_key UNIQUE (project_id, property_id);
    END IF;
END $$;

-- property_ownershipsテーブルのユニーク制約（既に存在する可能性あり）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'property_ownerships_property_id_owner_id_key'
    ) THEN
        ALTER TABLE public.property_ownerships ADD CONSTRAINT property_ownerships_property_id_owner_id_key UNIQUE (property_id, owner_id);
    END IF;
END $$;

-- ========================================
-- 7. RLSポリシーの確認（import_staging, import_jobsはRLS無効）
-- ========================================

-- import_stagingテーブルのRLSは無効
ALTER TABLE public.import_staging DISABLE ROW LEVEL SECURITY;

-- import_jobsテーブルのRLSは無効
ALTER TABLE public.import_jobs DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 移行完了
-- ========================================

COMMIT;

-- 実行後の確認クエリ
-- SELECT COUNT(*) FROM import_staging;
-- SELECT COUNT(*) FROM import_jobs;
-- SELECT proname FROM pg_proc WHERE proname IN ('cleanup_old_staging_data', 'create_project_and_import_properties', 'get_project_owners_view', 'get_project_properties_view', 'get_project_stats', 'get_projects_with_full_stats', 'get_projects_with_owner_progress');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'owner_companies' AND column_name = 'position';