-- =============================================
-- 監査ログテーブルの作成
-- =============================================
-- このファイルは、システム全体の操作履歴を記録するための
-- 監査ログテーブルを定義します。

-- =============================================
-- 1. 汎用監査ログテーブル
-- =============================================
-- システム全体の操作履歴を記録する汎用的なテーブル
CREATE TABLE IF NOT EXISTS audit_logs (
  -- レコードの一意識別子
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 操作を実行したユーザーのID
  -- 必須項目：全ての操作は認証されたユーザーによって実行される
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  
  -- 実行されたアクションの種類
  -- 値の例: 'create', 'update', 'delete', 'import', 'export', 
  --        'login', 'logout', 'view', 'search', 'download'
  action text NOT NULL,
  
  -- 操作対象のリソース種別
  -- 値の例: 'property', 'project', 'owner', 'user', 'api_key', 
  --        'project_member', 'owner_company'
  resource_type text NOT NULL,
  
  -- 操作対象リソースのID（任意）
  -- 例: propertiesテーブルのレコードを更新した場合、そのproperty.id
  -- ログインなどリソースIDが存在しない操作の場合はNULL
  resource_id uuid,
  
  -- 変更内容の詳細（JSONB形式）
  -- 推奨フォーマット: {"before": {...}, "after": {...}}
  -- 例: {
  --   "before": {"owner_name": "山田太郎", "owner_address": "東京都渋谷区1-1-1"},
  --   "after": {"owner_name": "山田太郎", "owner_address": "東京都渋谷区2-2-2"}
  -- }
  changes jsonb,
  
  -- その他の関連情報（JSONB形式）
  -- 例: {
  --   "project_id": "uuid-here",
  --   "file_name": "import_20240118.csv",
  --   "record_count": 150,
  --   "success_count": 148,
  --   "error_count": 2,
  --   "browser": "Chrome 120.0",
  --   "device": "Desktop",
  --   "operating_system": "Windows 11"
  -- }
  metadata jsonb,
  
  -- 操作実行時のIPアドレス
  -- IPv4とIPv6の両方をサポート
  ip_address inet,
  
  -- クライアントのUser-Agent文字列
  -- ブラウザ、OS、デバイスの情報を含む
  user_agent text,
  
  -- レコード作成日時（操作実行日時）
  created_at timestamptz DEFAULT now() NOT NULL
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- =============================================
-- 2. 所有者情報の変更履歴専用テーブル
-- =============================================
-- 重要なマスターデータである所有者情報の変更を詳細に追跡
CREATE TABLE IF NOT EXISTS owner_history (
  -- レコードの一意識別子
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 変更対象の所有者ID
  owner_id uuid REFERENCES owners(id) NOT NULL,
  
  -- 変更を実行したユーザーID
  changed_by uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  
  -- 変更の種類
  -- 'create': 新規作成
  -- 'update': 情報更新
  -- 'merge': 重複統合（2つの所有者レコードを1つに統合）
  change_type text CHECK (change_type IN ('create', 'update', 'merge')) NOT NULL,
  
  -- 変更前の値（JSONB形式）
  -- createの場合はNULL
  -- 例: {"name": "山田太郎", "address": "東京都渋谷区1-1-1"}
  old_values jsonb,
  
  -- 変更後の値（JSONB形式）
  -- 例: {"name": "山田太郎", "address": "東京都渋谷区2-2-2"}
  new_values jsonb NOT NULL,
  
  -- 統合元の所有者ID（mergeの場合のみ）
  merged_from_owner_id uuid REFERENCES owners(id),
  
  -- 変更理由やコメント（任意）
  change_reason text,
  
  -- 変更日時
  changed_at timestamptz DEFAULT now() NOT NULL
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_owner_history_owner_id ON owner_history(owner_id);
CREATE INDEX idx_owner_history_changed_by ON owner_history(changed_by);
CREATE INDEX idx_owner_history_changed_at ON owner_history(changed_at DESC);

-- =============================================
-- 3. データエクスポート履歴テーブル
-- =============================================
-- データのエクスポート操作を記録（GDPR等のコンプライアンス対応）
CREATE TABLE IF NOT EXISTS export_logs (
  -- レコードの一意識別子
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- エクスポート対象の検索プロジェクトID
  project_id uuid REFERENCES projects(id) NOT NULL,
  
  -- エクスポートを実行したユーザーID
  exported_by uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  
  -- エクスポート形式
  -- 'csv': CSV形式
  -- 'excel': Excel形式（.xlsx）
  -- 'json': JSON形式
  -- 'pdf': PDF形式
  export_format text CHECK (export_format IN ('csv', 'excel', 'json', 'pdf')) NOT NULL,
  
  -- エクスポートされたレコード数
  record_count integer NOT NULL,
  
  -- 生成されたファイルサイズ（バイト）
  file_size_bytes integer,
  
  -- ダウンロードURL（一時的なURL）
  download_url text,
  
  -- URLの有効期限
  expires_at timestamptz,
  
  -- エクスポート条件（フィルター等）
  export_filters jsonb,
  
  -- エクスポートされたフィールド一覧
  exported_fields text[],
  
  -- エクスポート実行日時
  created_at timestamptz DEFAULT now() NOT NULL
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_export_logs_project_id ON export_logs(project_id);
CREATE INDEX idx_export_logs_exported_by ON export_logs(exported_by);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at DESC);

-- =============================================
-- 4. RLSポリシーの設定
-- =============================================

-- RLSを有効化
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

-- audit_logsのRLSポリシー
-- 自分の操作ログのみ閲覧可能（管理者は全て閲覧可能にする場合は別途ポリシー追加）
CREATE POLICY "Users can view own audit logs" 
  ON audit_logs FOR SELECT 
  TO authenticated 
  USING (user_id = (SELECT auth.uid()));

-- システムは全ての監査ログを作成可能
CREATE POLICY "System can insert audit logs" 
  ON audit_logs FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- owner_historyのRLSポリシー
-- プロジェクトメンバーは関連する所有者の履歴を閲覧可能
CREATE POLICY "Members can view owner history" 
  ON owner_history FOR SELECT 
  TO authenticated 
  USING (
    owner_id IN (
      SELECT DISTINCT p.owner_id 
      FROM properties p
      WHERE p.project_id IN (SELECT user_project_ids())
      AND p.owner_id IS NOT NULL
    )
  );

-- editor以上の権限で履歴を作成可能
CREATE POLICY "Editors can insert owner history" 
  ON owner_history FOR INSERT 
  TO authenticated 
  WITH CHECK (
    owner_id IN (
      SELECT DISTINCT p.owner_id 
      FROM properties p
      WHERE p.project_id IN (SELECT user_project_ids())
      AND user_project_role(p.project_id) IN ('owner', 'editor')
      AND p.owner_id IS NOT NULL
    )
  );

-- export_logsのRLSポリシー
-- プロジェクトメンバーはエクスポート履歴を閲覧可能
CREATE POLICY "Members can view export logs" 
  ON export_logs FOR SELECT 
  TO authenticated 
  USING (
    project_id IN (SELECT user_project_ids())
  );

-- editor以上の権限でエクスポート履歴を作成可能
CREATE POLICY "Editors can create export logs" 
  ON export_logs FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_project_role(project_id) IN ('owner', 'editor')
    AND (SELECT auth.uid()) = exported_by
  );

-- =============================================
-- 5. サンプルデータとクエリ例
-- =============================================

-- 監査ログの記録例
/*
INSERT INTO audit_logs (
  user_id, action, resource_type, resource_id, changes, metadata, ip_address, user_agent
) VALUES (
  auth.uid(),
  'update',
  'property',
  '550e8400-e29b-41d4-a716-446655440000',
  '{
    "before": {"lat": null, "lng": null},
    "after": {"lat": 35.6762, "lng": 139.6503}
  }'::jsonb,
  '{
    "project_id": "プロジェクトID",
    "update_reason": "ジオコーディング実行",
    "geocoding_provider": "google_maps"
  }'::jsonb,
  '192.168.1.100'::inet,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);

-- 最近の操作履歴を取得
SELECT 
  al.created_at,
  al.action,
  al.resource_type,
  al.changes,
  u.email as user_email
FROM audit_logs al
JOIN auth.users u ON al.user_id = u.id
WHERE al.created_at > NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC
LIMIT 100;

-- 特定リソースの変更履歴を追跡
SELECT 
  created_at,
  action,
  changes,
  metadata
FROM audit_logs
WHERE resource_type = 'property'
  AND resource_id = '物件ID'
ORDER BY created_at DESC;
*/