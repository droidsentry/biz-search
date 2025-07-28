-- =====================================================
-- biz-search-demoプロジェクトのセキュリティ更新用SQL（セクション別）
-- =====================================================
-- 適用対象: biz-search-demo (ID: nzblvllhpgkczpxvtvrz)
-- 各セクションを個別に実行できます
-- =====================================================

-- =====================================================
-- セクション1: import_stagingテーブルのRLS設定
-- =====================================================
BEGIN;

-- RLSを有効化
ALTER TABLE import_staging ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除（念のため）
DROP POLICY IF EXISTS "システム管理者のみアクセス可能" ON import_staging;

-- システム管理者のみアクセス可能なポリシーを作成
CREATE POLICY "システム管理者のみアクセス可能" ON import_staging
  FOR ALL
  TO authenticated
  USING (public.is_system_owner())
  WITH CHECK (public.is_system_owner());

-- テーブルコメントを更新
COMMENT ON TABLE import_staging IS 'PDFインポートの一時ステージングテーブル（システム管理者のみアクセス可能）';

COMMIT;

-- =====================================================
-- セクション2: import_jobsテーブルのRLS設定
-- =====================================================
BEGIN;

-- RLSを有効化
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除（念のため）
DROP POLICY IF EXISTS "システム管理者のみアクセス可能" ON import_jobs;

-- システム管理者のみアクセス可能なポリシーを作成
CREATE POLICY "システム管理者のみアクセス可能" ON import_jobs
  FOR ALL
  TO authenticated
  USING (public.is_system_owner())
  WITH CHECK (public.is_system_owner());

-- テーブルコメントを更新
COMMENT ON TABLE import_jobs IS 'PDFインポートジョブの管理テーブル（システム管理者のみアクセス可能）';

COMMIT;

-- =====================================================
-- セクション3: create_project_and_import_properties関数の更新
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_project_and_import_properties(
  p_name TEXT,
  p_description TEXT,
  p_job_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_user_id UUID;
  v_import_count INTEGER := 0;
BEGIN
  -- システム管理者チェックを追加
  IF NOT public.is_system_owner() THEN
    RAISE EXCEPTION 'この操作はシステム管理者のみ実行可能です';
  END IF;

  -- 現在のユーザーIDを取得
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '認証されていません';
  END IF;

  -- トランザクション開始
  BEGIN
    -- 1. プロジェクトを作成
    INSERT INTO projects (name, description, created_by, updated_by)
    VALUES (p_name, p_description, v_user_id, v_user_id)
    RETURNING id INTO v_project_id;

    -- 2. import_stagingからpropertiesにデータを移行
    INSERT INTO properties (
      project_id,
      prefecture,
      municipality,
      district,
      block_number,
      land_number,
      building_name,
      room_number,
      owner_name,
      owner_address,
      co_owners,
      ownership_type,
      land_area,
      building_area,
      building_structure,
      created_by,
      updated_by
    )
    SELECT 
      v_project_id,
      prefecture,
      municipality,
      district,
      block_number,
      land_number,
      building_name,
      room_number,
      owner_name,
      owner_address,
      co_owners,
      ownership_type,
      land_area,
      building_area,
      building_structure,
      v_user_id,
      v_user_id
    FROM import_staging
    WHERE job_id = p_job_id;

    -- インポートした件数を取得
    GET DIAGNOSTICS v_import_count = ROW_COUNT;

    -- 3. import_jobsのステータスを更新
    UPDATE import_jobs
    SET 
      status = 'completed',
      completed_at = CURRENT_TIMESTAMP,
      imported_count = v_import_count,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;

    -- 4. import_stagingから該当データを削除
    DELETE FROM import_staging WHERE job_id = p_job_id;

    -- トランザクションコミット（自動）
    RETURN v_project_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- エラーが発生した場合、import_jobsのステータスをfailedに更新
      UPDATE import_jobs
      SET 
        status = 'failed',
        error_message = SQLERRM,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = p_job_id;
      
      -- エラーを再発生
      RAISE;
  END;
END;
$$;

-- =====================================================
-- セクション4: 自動削除クロンジョブの設定
-- =====================================================
-- pg_cronエクステンションが有効化されていることを確認
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 既存のジョブを確認
SELECT jobname, schedule, command, active FROM cron.job WHERE jobname = 'cleanup-import-staging';

-- 既存のジョブがあれば削除（エラーを無視）
DO $$
BEGIN
  -- ジョブが存在する場合のみ削除
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-import-staging') THEN
    PERFORM cron.unschedule('cleanup-import-staging');
  END IF;
END $$;

-- 毎日午前3時（JST）に24時間以上古いステージングデータを削除するジョブを作成
SELECT cron.schedule(
  'cleanup-import-staging',
  '0 18 * * *',  -- 毎日18:00 UTC (JST 3:00)
  'DELETE FROM import_staging WHERE created_at < now() - interval ''24 hours'';'
);

-- ジョブが作成されたことを確認
SELECT jobname, schedule, command, active FROM cron.job WHERE jobname = 'cleanup-import-staging';

-- =====================================================
-- 確認用クエリ
-- =====================================================

-- RLS設定の確認
SELECT 
  tablename, 
  rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('import_staging', 'import_jobs');

-- RLSポリシーの確認
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('import_staging', 'import_jobs');

-- is_system_owner関数の存在確認
SELECT 
  proname,
  prorettype::regtype,
  proargtypes::regtype[]
FROM pg_proc
WHERE proname = 'is_system_owner'
  AND pronamespace = 'public'::regnamespace;

-- クロンジョブの確認
SELECT 
  jobname, 
  schedule, 
  command, 
  active 
FROM cron.job 
WHERE jobname = 'cleanup-import-staging';