-- import_stagingとimport_jobsテーブルをシステム管理者のみがアクセスできるように設定
-- 作成日: 2025-07-28

BEGIN;

-- ========================================
-- 1. import_stagingテーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.import_staging ENABLE ROW LEVEL SECURITY;

-- システム管理者のみがINSERT可能
CREATE POLICY "System owners can insert staging data" ON public.import_staging
  FOR INSERT TO authenticated
  WITH CHECK (public.is_system_owner());

-- システム管理者のみがSELECT可能
CREATE POLICY "System owners can view staging data" ON public.import_staging
  FOR SELECT TO authenticated
  USING (public.is_system_owner());

-- システム管理者のみがUPDATE可能
CREATE POLICY "System owners can update staging data" ON public.import_staging
  FOR UPDATE TO authenticated
  USING (public.is_system_owner())
  WITH CHECK (public.is_system_owner());

-- システム管理者のみがDELETE可能
CREATE POLICY "System owners can delete staging data" ON public.import_staging
  FOR DELETE TO authenticated
  USING (public.is_system_owner());

-- ========================================
-- 2. import_jobsテーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- システム管理者のみがINSERT可能
CREATE POLICY "System owners can insert import jobs" ON public.import_jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_system_owner());

-- システム管理者のみがSELECT可能
CREATE POLICY "System owners can view import jobs" ON public.import_jobs
  FOR SELECT TO authenticated
  USING (public.is_system_owner());

-- システム管理者のみがUPDATE可能
CREATE POLICY "System owners can update import jobs" ON public.import_jobs
  FOR UPDATE TO authenticated
  USING (public.is_system_owner())
  WITH CHECK (public.is_system_owner());

-- システム管理者のみがDELETE可能
CREATE POLICY "System owners can delete import jobs" ON public.import_jobs
  FOR DELETE TO authenticated
  USING (public.is_system_owner());

-- ========================================
-- 3. RPC関数にシステム管理者チェックを追加
-- ========================================

-- create_project_and_import_properties関数を更新
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
  -- システム管理者チェック
  IF NOT public.is_system_owner() THEN
    RAISE EXCEPTION 'この操作はシステム管理者のみ実行可能です';
  END IF;

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

-- ========================================
-- 4. 自動削除クロンジョブの設定
-- ========================================

-- 既存のジョブがある場合は削除
SELECT cron.unschedule('cleanup-import-staging') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-import-staging'
);

-- 毎日午前3時（JST）= UTC 18時に実行
SELECT cron.schedule(
  'cleanup-import-staging',           -- ジョブ名
  '0 18 * * *',                      -- 毎日18:00 UTC (3:00 JST)
  $$DELETE FROM import_staging WHERE created_at < now() - interval '24 hours'$$
);

-- ========================================
-- 5. 動作確認用クエリ
-- ========================================

-- RLS設定確認
COMMENT ON TABLE public.import_staging IS 
  'PDFインポートの一時ステージングテーブル（システム管理者のみアクセス可能）';

COMMENT ON TABLE public.import_jobs IS 
  'PDFインポートジョブの管理テーブル（システム管理者のみアクセス可能）';

COMMIT;

-- 動作確認用クエリ（別途実行）
-- 1. RLSポリシー確認
-- SELECT tablename, policyname, cmd, roles, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename IN ('import_staging', 'import_jobs');

-- 2. cronジョブ確認
-- SELECT jobid, jobname, schedule, command, active
-- FROM cron.job
-- WHERE jobname = 'cleanup-import-staging';

-- 3. ジョブ実行履歴確認（実行後）
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-import-staging')
-- ORDER BY start_time DESC
-- LIMIT 10;