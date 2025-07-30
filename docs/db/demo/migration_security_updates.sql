-- =====================================================
-- biz-search-demoプロジェクトのセキュリティ更新用SQL
-- =====================================================
-- 適用対象: biz-search-demo (ID: nzblvllhpgkczpxvtvrz)
-- 目的: biz-searchプロジェクトと同等のセキュリティ設定を適用
-- =====================================================

-- 1. import_stagingテーブルのRLS設定
-- =====================================================

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

-- 2. import_jobsテーブルのRLS設定
-- =====================================================

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

-- 3. create_project_and_import_properties関数にシステム管理者チェック追加
-- =====================================================

-- 関数を更新（既存の関数を置き換え）
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

-- 4. 自動削除クロンジョブの設定
-- =====================================================
-- 注意: Supabaseのクロンジョブ設定はpg_cronエクステンションが必要です
-- 以下のSQLはSupabaseのダッシュボードまたはAPIで実行してください

-- pg_cronエクステンションが有効化されていることを確認
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 既存のジョブがあれば削除（エラーを無視）
DO $$
BEGIN
  -- ジョブが存在する場合のみ削除
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-import-staging') THEN
    PERFORM cron.unschedule('cleanup-import-staging');
  END IF;
END $$;

-- 毎日午前3時（JST）に24時間以上古いステージングデータを削除するジョブを作成
-- 注意: Supabaseのcronは通常UTCで動作するため、JSTの3:00はUTCの18:00
SELECT cron.schedule(
  'cleanup-import-staging',
  '0 18 * * *',  -- 毎日18:00 UTC (JST 3:00)
  'DELETE FROM import_staging WHERE created_at < now() - interval ''24 hours'';'
);

-- =====================================================
-- 実行前の確認事項
-- =====================================================
-- 1. is_system_owner関数が存在することを確認してください
-- 2. profilesテーブルにroleカラムが存在することを確認してください
-- 3. システム管理者ユーザーのroleが'system_owner'に設定されていることを確認してください
-- 4. pg_cronエクステンションの有効化にはSupabaseダッシュボードでの設定が必要な場合があります

-- 実行後の確認用SQL
-- SELECT tablename, rls_enabled FROM pg_tables WHERE tablename IN ('import_staging', 'import_jobs');
-- SELECT * FROM pg_policies WHERE tablename IN ('import_staging', 'import_jobs');
-- SELECT jobname, schedule, command, active FROM cron.job WHERE jobname = 'cleanup-import-staging';