-- biz-searchからbiz-search-demoへの移行SQL
-- 作成日: 2025-07-27
-- 
-- biz-searchプロジェクトで追加された新しいテーブルと変更をbiz-search-demoに適用します

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

-- ========================================
-- 3. owner_companiesテーブルのカラム削除
-- ========================================
-- biz-searchでは'position'カラムが削除されています
ALTER TABLE public.owner_companies DROP COLUMN IF EXISTS position;

-- ========================================
-- 4. search_api_logsテーブルのカラム削除と追加
-- ========================================
-- 削除されたカラム（存在する場合のみ削除）
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'search_api_logs' 
               AND column_name = 'start') THEN
        ALTER TABLE public.search_api_logs DROP COLUMN start;
    END IF;
END $$;

-- ========================================
-- 5. トリガーとインデックスの追加
-- ========================================

-- updated_atトリガーの追加（まだ存在しない場合）
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- import_jobsのupdated_atトリガー
DROP TRIGGER IF EXISTS update_import_jobs_updated_at ON public.import_jobs;
CREATE TRIGGER update_import_jobs_updated_at
    BEFORE UPDATE ON public.import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ========================================
-- 6. RLS（Row Level Security）の設定
-- ========================================

-- import_stagingテーブルのRLSは無効（biz-searchと同じ）
ALTER TABLE public.import_staging DISABLE ROW LEVEL SECURITY;

-- import_jobsテーブルのRLSは無効（biz-searchと同じ）
ALTER TABLE public.import_jobs DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. コメント追加
-- ========================================
COMMENT ON TABLE public.import_staging IS 'PDFインポートの一時ステージングテーブル';
COMMENT ON TABLE public.import_jobs IS 'PDFインポートジョブの管理テーブル';

-- ========================================
-- 8. データ型の確認と修正
-- ========================================
-- search_api_logsのカラムが欠けている場合の追加（念のため）
DO $$
BEGIN
    -- result_countカラムの確認
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'search_api_logs' 
                   AND column_name = 'result_count') THEN
        ALTER TABLE public.search_api_logs ADD COLUMN result_count integer NULL;
    END IF;
END $$;

-- ========================================
-- 9. 関数の作成
-- ========================================

-- update_updated_at関数（存在しない場合のみ作成）
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- update_updated_at_column関数（別名バージョン）
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- check_global_api_limit関数
CREATE OR REPLACE FUNCTION public.check_global_api_limit(p_api_name text, p_increment integer DEFAULT 1)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_limit_record RECORD;
  v_usage_record RECORD;
  v_new_daily_count integer;
  v_new_monthly_count integer;
  v_now timestamptz := now();
  v_current_date date := CURRENT_DATE;
  v_current_month_start date := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  -- 制限設定を取得
  SELECT * INTO v_limit_record
  FROM api_global_limits
  WHERE api_name = p_api_name
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'allowed', false,
      'error', 'API設定が見つかりません'
    );
  END IF;
  
  -- 使用状況を取得（行レベルロック）
  SELECT * INTO v_usage_record
  FROM api_global_usage
  WHERE api_name = p_api_name
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- 初回の場合は作成
    INSERT INTO api_global_usage (api_name)
    VALUES (p_api_name)
    RETURNING * INTO v_usage_record;
  END IF;
  
  -- 日付が変わった場合はカウンターをリセット
  IF v_usage_record.daily_date < v_current_date THEN
    v_usage_record.daily_count := 0;
    v_usage_record.daily_date := v_current_date;
  END IF;
  
  -- 月が変わった場合はカウンターをリセット
  IF v_usage_record.monthly_date < v_current_month_start THEN
    v_usage_record.monthly_count := 0;
    v_usage_record.monthly_date := v_current_month_start;
  END IF;
  
  -- ブロック期限が過ぎている場合は解除
  IF v_usage_record.is_blocked AND v_usage_record.blocked_until IS NOT NULL 
     AND v_usage_record.blocked_until <= v_now THEN
    v_usage_record.is_blocked := false;
    v_usage_record.blocked_until := NULL;
  END IF;
  
  -- ブロック中の場合
  IF v_usage_record.is_blocked THEN
    RETURN json_build_object(
      'allowed', false,
      'error', 'API利用制限に達しています',
      'blocked_until', v_usage_record.blocked_until,
      'daily_used', v_usage_record.daily_count,
      'daily_limit', v_limit_record.daily_limit,
      'monthly_used', v_usage_record.monthly_count,
      'monthly_limit', v_limit_record.monthly_limit
    );
  END IF;
  
  -- 新しいカウント値を計算
  v_new_daily_count := v_usage_record.daily_count + p_increment;
  v_new_monthly_count := v_usage_record.monthly_count + p_increment;
  
  -- 制限チェック
  IF v_new_daily_count > v_limit_record.daily_limit OR 
     v_new_monthly_count > v_limit_record.monthly_limit THEN
    -- ブロック設定
    UPDATE api_global_usage
    SET is_blocked = true,
        blocked_until = CASE
          WHEN v_new_daily_count > v_limit_record.daily_limit THEN
            (v_current_date + interval '1 day')::timestamptz
          ELSE
            (v_current_month_start + interval '1 month')::timestamptz
        END,
        updated_at = v_now
    WHERE api_name = p_api_name;
    
    RETURN json_build_object(
      'allowed', false,
      'error', 'API利用制限に達しました',
      'blocked_until', CASE
        WHEN v_new_daily_count > v_limit_record.daily_limit THEN
          (v_current_date + interval '1 day')::timestamptz
        ELSE
          (v_current_month_start + interval '1 month')::timestamptz
      END,
      'daily_used', v_usage_record.daily_count,
      'daily_limit', v_limit_record.daily_limit,
      'monthly_used', v_usage_record.monthly_count,
      'monthly_limit', v_limit_record.monthly_limit
    );
  END IF;
  
  -- カウンターを更新
  UPDATE api_global_usage
  SET daily_count = v_new_daily_count,
      daily_date = v_current_date,
      monthly_count = v_new_monthly_count,
      monthly_date = v_current_month_start,
      updated_at = v_now
  WHERE api_name = p_api_name;
  
  -- 使用状況とともに成功を返す
  RETURN json_build_object(
    'allowed', true,
    'daily_used', v_new_daily_count,
    'daily_limit', v_limit_record.daily_limit,
    'monthly_used', v_new_monthly_count,
    'monthly_limit', v_limit_record.monthly_limit,
    'daily_remaining', v_limit_record.daily_limit - v_new_daily_count,
    'monthly_remaining', v_limit_record.monthly_limit - v_new_monthly_count
  );
END;
$function$;

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

-- その他の関数も追加（スペースの都合上、主要なものだけ記載）
-- update_property_ownership関数
CREATE OR REPLACE FUNCTION public.update_property_ownership()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- INSERT時のみ処理（UPDATEは既存レコードの更新なので何もしない）
  IF TG_OP = 'INSERT' THEN
    -- 同じproperty_idで異なるowner_idの既存レコードを終了
    UPDATE property_ownerships 
    SET 
      is_current = false, 
      ownership_end = NEW.ownership_start,
      updated_at = now()
    WHERE 
      property_id = NEW.property_id 
      AND owner_id != NEW.owner_id
      AND is_current = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- increment_search_pattern_usage関数
CREATE OR REPLACE FUNCTION public.increment_search_pattern_usage(pattern_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE search_patterns 
  SET usage_count = usage_count + 1,
      last_used_at = now()
  WHERE id = pattern_id;
END;
$function$;

-- update_pattern_usage_on_log_insert関数
CREATE OR REPLACE FUNCTION public.update_pattern_usage_on_log_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.pattern_id IS NOT NULL THEN
    PERFORM increment_search_pattern_usage(NEW.pattern_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- ========================================
-- 10. トリガーの作成
-- ========================================

-- api_global_limitsのupdated_atトリガー
DROP TRIGGER IF EXISTS api_global_limits_updated_at ON public.api_global_limits;
CREATE TRIGGER api_global_limits_updated_at
    BEFORE UPDATE ON public.api_global_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- api_global_usageのupdated_atトリガー
DROP TRIGGER IF EXISTS api_global_usage_updated_at ON public.api_global_usage;
CREATE TRIGGER api_global_usage_updated_at
    BEFORE UPDATE ON public.api_global_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- property_ownershipsの単一所有者確保トリガー
DROP TRIGGER IF EXISTS ensure_single_current_owner ON public.property_ownerships;
CREATE TRIGGER ensure_single_current_owner
    BEFORE INSERT ON public.property_ownerships
    FOR EACH ROW
    EXECUTE FUNCTION update_property_ownership();

-- search_api_logsの使用回数更新トリガー
DROP TRIGGER IF EXISTS increment_usage_count_on_api_log ON public.search_api_logs;
CREATE TRIGGER increment_usage_count_on_api_log
    AFTER INSERT ON public.search_api_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_pattern_usage_on_log_insert();

-- ========================================
-- 11. 制約の追加（存在しない場合のみ）
-- ========================================

-- owners テーブルのユニーク制約
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'owners_name_address_key'
    ) THEN
        ALTER TABLE public.owners ADD CONSTRAINT owners_name_address_key UNIQUE (name, address);
    END IF;
END $$;

-- project_properties テーブルのユニーク制約
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_properties_project_id_property_id_key'
    ) THEN
        ALTER TABLE public.project_properties ADD CONSTRAINT project_properties_project_id_property_id_key UNIQUE (project_id, property_id);
    END IF;
END $$;

-- property_ownerships テーブルのユニーク制約
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
-- 移行完了メッセージ
-- ========================================
DO $$
BEGIN
    RAISE NOTICE 'biz-searchからbiz-search-demoへの移行が完了しました';
    RAISE NOTICE '新規テーブル: import_staging, import_jobs';
    RAISE NOTICE '変更テーブル: owner_companies (positionカラム削除)';
    RAISE NOTICE '新規関数: check_global_api_limit, cleanup_old_staging_data, create_project_and_import_properties等';
    RAISE NOTICE '新規トリガー: api_global_limits_updated_at, api_global_usage_updated_at等';
END $$;