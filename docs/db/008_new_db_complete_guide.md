# 新DB設計完全ガイド

このドキュメントは、新しいDB設計でシステムを一新する際の完全な実装ガイドです。

## 1. 新しいDB設計の概要

### 設計思想

新しいDB設計は以下の原則に基づいています：

1. **データの一意性**: 物件と所有者をマスターデータとして管理
2. **履歴管理**: 所有者の変更履歴を完全に追跡
3. **プロジェクト独立性**: プロジェクト間で物件データを共有
4. **データ整合性**: 外部キー制約とトリガーによる整合性保証
5. **監査証跡**: 誰がいつ何をしたかを完全に記録

### 権限モデル

本システムでは2階層の権限管理を採用しています：

1. **システムレベル権限**（profilesテーブル）
   - `system_owner`: システム全体の管理者権限
   - `user`: 一般ユーザー権限

2. **プロジェクトレベル権限**（project_membersテーブル）
   - `owner`: プロジェクトの全権限（メンバー管理、削除等）
   - `editor`: データの編集権限（削除は不可）
   - `viewer`: データの閲覧のみ

**重要**: これらは独立した概念であり、system_ownerであってもプロジェクトに明示的にメンバーとして追加されていなければ、そのプロジェクトのデータにはアクセスできません（ただし、RLSポリシーでsystem_ownerには特別な権限を付与）。

### テーブル構造

```sql
-- 1. 物件マスターテーブル（グローバルに一意）
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL UNIQUE,  -- 物件住所は完全に一意
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. 所有者マスターテーブル
CREATE TABLE owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  lat numeric(10, 8),  -- 所有者住所の緯度
  lng numeric(11, 8),  -- 所有者住所の経度
  street_view_available boolean DEFAULT false,  -- 所有者住所のストリートビュー可用性
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(name, address)  -- 同姓同名で同住所は同一人物とみなす
);

-- 3. 物件所有履歴テーブル（シンプルな中間テーブル）
CREATE TABLE property_ownerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
  ownership_start timestamptz DEFAULT now() NOT NULL,  -- 所有開始時刻
  ownership_end timestamptz,                           -- 所有終了時刻（NULL = 現在の所有者）
  is_current boolean DEFAULT true,                     -- 現在の所有者フラグ
  source text,                                         -- 'pdf_import', 'manual_update'等
  recorded_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,      -- レコード作成時刻
  updated_at timestamptz DEFAULT now() NOT NULL,      -- レコード更新時刻
  UNIQUE(property_id, owner_id),  -- シンプルな一意制約
  CHECK (ownership_end IS NULL OR ownership_end >= ownership_start)
);

-- 設計の特徴：
-- - property_idとowner_idの組み合わせで一意性を保証（シンプルな中間テーブル）
-- - 同じ物件・所有者の組み合わせは1レコードのみ存在
-- - ownership_start: 実際の所有開始時刻を記録
-- - created_at: システムへの初回登録時刻
-- - updated_at: レコードの最終更新時刻（ownership_end設定時など）

-- ON DELETE CASCADEの仕様：
-- - propertiesが削除されると、関連する所有履歴も自動削除
-- - ownersが削除されると、関連する所有履歴も自動削除
-- - 履歴データの整合性を自動的に維持

-- 4. プロジェクト物件関連テーブル
CREATE TABLE project_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  added_by uuid REFERENCES auth.users(id) NOT NULL,  -- 監査証跡：誰が追加したか
  added_at timestamptz DEFAULT now() NOT NULL,
  import_source_file text,  -- インポート元ファイル名
  UNIQUE(project_id, property_id)
);

-- 5. 所有者会社情報テーブル
CREATE TABLE owner_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  company_number text,
  position text,
  source_url text NOT NULL,
  rank integer CHECK (rank BETWEEN 1 AND 3) NOT NULL,
  is_verified boolean DEFAULT false,  -- 確認済みフラグ
  researched_by uuid REFERENCES auth.users(id) NOT NULL,
  researched_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(owner_id, rank)
);

-- 6. プロフィールテーブル（ユーザー詳細情報）
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text NOT NULL,
  username text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('system_owner', 'user')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_username_key UNIQUE (username),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 7. プロジェクトテーブル（既存）
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 8. プロジェクトメンバーテーブル（既存）
CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL,  -- プロジェクト単位の権限
  added_by uuid REFERENCES auth.users(id) NOT NULL,  -- 監査証跡：誰がメンバーを追加したか
  added_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);
```

### インデックスの設計

```sql
-- Phase 1: 基本的なB-treeインデックス（初期実装）
-- シンプルで効率的、完全一致・前方一致検索に最適
CREATE INDEX idx_properties_address ON properties(address);
CREATE INDEX idx_owners_name ON owners(name);
CREATE INDEX idx_owners_address ON owners(address);
CREATE INDEX idx_property_ownerships_current ON property_ownerships(property_id) WHERE is_current = true;
CREATE INDEX idx_property_ownerships_property ON property_ownerships(property_id);
CREATE INDEX idx_property_ownerships_owner ON property_ownerships(owner_id);
-- UNIQUE制約により自動的に以下のインデックスが作成される
-- CREATE UNIQUE INDEX ON property_ownerships(property_id, owner_id);
CREATE INDEX idx_project_properties_project ON project_properties(project_id);
CREATE INDEX idx_project_properties_property ON project_properties(property_id);
CREATE INDEX idx_owner_companies_owner ON owner_companies(owner_id);

-- Phase 2: 部分一致検索の需要が高まったら追加（オプション）
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_properties_address_trgm ON properties USING gin(address gin_trgm_ops);
-- CREATE INDEX idx_owners_name_trgm ON owners USING gin(name gin_trgm_ops);

-- Phase 3: 高度な日本語全文検索が必要になったら（将来的な拡張）
-- CREATE INDEX idx_properties_address_search ON properties USING gin(to_tsvector('japanese', address));
-- CREATE INDEX idx_owners_name_search ON owners USING gin(to_tsvector('japanese', name));
```

#### インデックス戦略の考え方

1. **段階的アプローチ**
   - 初期段階：シンプルなB-treeインデックスで開始
   - 中期段階：実際の検索パターンに基づいて最適化
   - 長期段階：必要に応じて全文検索機能を追加

2. **インデックス選択の基準**
   - データ量：初期は少量なのでB-treeで十分
   - 検索パターン：完全一致が多いか部分一致が多いか
   - パフォーマンス要件：レスポンスタイムの目標値

3. **メンテナンス性**
   - B-treeインデックスは理解しやすく管理が容易
   - GINインデックスは強力だが、サイズと更新コストに注意

### トリガー関数

```sql
-- 所有権履歴の整合性を保つトリガー
CREATE OR REPLACE FUNCTION update_property_ownership() 
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT時のみ処理（UPDATEは既存レコードの更新なので何もしない）
  IF TG_OP = 'INSERT' THEN
    -- 同じproperty_idで異なるowner_idの既存レコードを終了
    UPDATE property_ownerships 
    SET 
      is_current = false, 
      ownership_end = NEW.ownership_start
    WHERE 
      property_id = NEW.property_id 
      AND owner_id != NEW.owner_id
      AND is_current = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_current_owner
BEFORE INSERT ON property_ownerships
FOR EACH ROW EXECUTE FUNCTION update_property_ownership();

-- updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_owner_companies_updated_at BEFORE UPDATE ON owner_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_ownerships_updated_at BEFORE UPDATE ON property_ownerships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 2. データインプット方法

### PDFからの物件データ一括インポート

```typescript
import { createClient } from '@/lib/supabase/server';
import { Tables, TablesInsert } from '@/lib/types/database';

// 型定義
interface PDFPropertyData {
  propertyAddress: string;
  ownerName: string;
  ownerAddress: string;
  lat?: number | null;
  lng?: number | null;
  streetViewAvailable?: boolean;
  sourceFileName: string;
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: Array<{
    propertyAddress: string;
    error: string;
  }>;
}

// メイン関数：PDFデータをインポート
export async function importPropertiesFromPDF(
  projectId: string,
  pdfData: PDFPropertyData[],
  userId: string
): Promise<ImportResult> {
  const supabase = await createClient();
  const errors: ImportResult['errors'] = [];
  let importedCount = 0;

  try {
    // トランザクション的な処理のため、バッチで実行
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < pdfData.length; i += BATCH_SIZE) {
      const batch = pdfData.slice(i, i + BATCH_SIZE);
      
      // Step 1: 所有者マスターの処理
      const uniqueOwners = getUniqueOwners(batch);
      const ownerIdMap = await upsertOwners(supabase, uniqueOwners);
      
      // Step 2: 物件マスターの処理
      const uniqueProperties = getUniqueProperties(batch);
      const propertyIdMap = await upsertProperties(supabase, uniqueProperties);
      
      // Step 3: 物件所有履歴の記録
      const ownershipRecords = buildOwnershipRecords(
        batch,
        propertyIdMap,
        ownerIdMap,
        userId
      );
      await insertOwnershipRecords(supabase, ownershipRecords);
      
      // Step 4: プロジェクトとの関連付け
      const projectPropertyRecords = buildProjectPropertyRecords(
        projectId,
        batch,
        propertyIdMap,
        userId
      );
      await upsertProjectProperties(supabase, projectPropertyRecords);
      
      importedCount += batch.length;
    }
    
    return {
      success: true,
      importedCount,
      errors
    };
    
  } catch (error) {
    console.error('インポートエラー:', error);
    return {
      success: false,
      importedCount,
      errors: [{
        propertyAddress: '',
        error: error instanceof Error ? error.message : '予期せぬエラーが発生しました'
      }]
    };
  }
}

// ヘルパー関数：ユニークな所有者を抽出
function getUniqueOwners(data: PDFPropertyData[]): TablesInsert<'owners'>[] {
  const ownerMap = new Map<string, TablesInsert<'owners'>>();
  
  data.forEach(item => {
    const key = `${item.ownerName}_${item.ownerAddress}`;
    if (!ownerMap.has(key)) {
      ownerMap.set(key, {
        name: item.ownerName,
        address: item.ownerAddress,
        lat: item.lat,
        lng: item.lng,
        street_view_available: item.streetViewAvailable || false
      });
    }
  });
  
  return Array.from(ownerMap.values());
}

// ヘルパー関数：ユニークな物件を抽出
function getUniqueProperties(data: PDFPropertyData[]): TablesInsert<'properties'>[] {
  const propertyMap = new Map<string, TablesInsert<'properties'>>();
  
  data.forEach(item => {
    if (!propertyMap.has(item.propertyAddress)) {
      propertyMap.set(item.propertyAddress, {
        address: item.propertyAddress
      });
    }
  });
  
  return Array.from(propertyMap.values());
}

// 所有者のupsert処理
async function upsertOwners(
  supabase: any,
  owners: TablesInsert<'owners'>[]
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('owners')
    .upsert(owners, { 
      onConflict: 'name,address',
      ignoreDuplicates: false 
    })
    .select();
  
  if (error) throw error;
  
  const idMap = new Map<string, string>();
  data.forEach((owner: Tables<'owners'>) => {
    idMap.set(`${owner.name}_${owner.address}`, owner.id);
  });
  
  return idMap;
}

// 物件のupsert処理
async function upsertProperties(
  supabase: any,
  properties: TablesInsert<'properties'>[]
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('properties')
    .upsert(properties, { 
      onConflict: 'address',
      ignoreDuplicates: false 
    })
    .select();
  
  if (error) throw error;
  
  const idMap = new Map<string, string>();
  data.forEach((property: Tables<'properties'>) => {
    idMap.set(property.address, property.id);
  });
  
  return idMap;
}

// 所有履歴レコードの構築
function buildOwnershipRecords(
  batch: PDFPropertyData[],
  propertyIdMap: Map<string, string>,
  ownerIdMap: Map<string, string>,
  userId: string
): TablesInsert<'property_ownerships'>[] {
  const records: TablesInsert<'property_ownerships'>[] = [];
  const currentTimestamp = new Date().toISOString();
  
  batch.forEach(item => {
    const propertyId = propertyIdMap.get(item.propertyAddress);
    const ownerId = ownerIdMap.get(`${item.ownerName}_${item.ownerAddress}`);
    
    if (propertyId && ownerId) {
      records.push({
        property_id: propertyId,
        owner_id: ownerId,
        ownership_start: currentTimestamp,
        is_current: true,
        source: 'pdf_import',
        recorded_by: userId
      });
    }
  });
  
  return records;
}

// 所有履歴の挿入（シンプルな処理）
async function insertOwnershipRecords(
  supabase: any,
  records: TablesInsert<'property_ownerships'>[]
) {
  if (records.length === 0) return;
  
  // UNIQUE制約により重複を防止
  const { error } = await supabase
    .from('property_ownerships')
    .upsert(records, {
      onConflict: 'property_id,owner_id',
      ignoreDuplicates: true  // 既存レコードは無視（同じ物件・所有者の組み合わせはスキップ）
    });
  
  if (error) throw error;
}

// プロジェクト物件関連の処理（補足）
// buildProjectPropertyRecordsとupsertProjectPropertiesの実装は
// 設計書の範囲外ですが、以下の処理を行います：
// 1. プロジェクトと物件の関連付け
// 2. UNIQUE(project_id, property_id)により重複を防止
// 3. ignoreDuplicates: falseで既存レコードを更新
```

### 所有者変更の記録

```typescript
// 手動での所有者変更
export async function updatePropertyOwner(
  propertyId: string,
  newOwnerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    // 新しい所有履歴を追加（トリガーが自動的に既存の履歴を更新）
    const { error } = await supabase
      .from('property_ownerships')
      .insert({
        property_id: propertyId,
        owner_id: newOwnerId,
        ownership_start: new Date().toISOString(),
        is_current: true,
        source: 'manual_update',
        recorded_by: userId
      });
    
    if (error) {
      // UNIQUE制約違反の場合は、既に同じ所有者
      if (error.code === '23505') {
        return { 
          success: false, 
          error: 'この物件は既に指定された所有者のものです' 
        };
      }
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '所有者変更に失敗しました'
    };
  }
}
```

### 会社情報の登録

```typescript
// 会社情報の追加・更新
export async function upsertOwnerCompany(
  ownerId: string,
  companyData: {
    companyName: string;
    companyNumber?: string;
    position?: string;
    sourceUrl: string;
    rank: 1 | 2 | 3;
  },
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('owner_companies')
      .upsert({
        owner_id: ownerId,
        company_name: companyData.companyName,
        company_number: companyData.companyNumber,
        position: companyData.position,
        source_url: companyData.sourceUrl,
        rank: companyData.rank,
        researched_by: userId
      }, {
        onConflict: 'owner_id,rank'
      });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '会社情報の登録に失敗しました'
    };
  }
}
```

## 3. データアウトプット方法

### プロジェクト物件一覧の取得

```typescript
// 基本的な物件一覧取得
export async function getProjectProperties(projectId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('project_properties')
    .select(`
      id,
      added_at,
      import_source_file,
      property:properties!inner (
        id,
        address,
        current_ownership:property_ownerships!inner (
          id,
          ownership_start,
          ownership_end,
          owner:owners!inner (
            id,
            name,
            address,
            lat,
            lng,
            street_view_available,
            companies:owner_companies (
              id,
              company_name,
              company_number,
              position,
              source_url,
              rank,
              is_verified,
              researched_at
            )
          )
        )
      )
    `)
    .eq('project_id', projectId)
    .eq('property.current_ownership.is_current', true)
    .order('added_at', { ascending: false });
  
  return { data, error };
}
```

### 検索とフィルタリング

```typescript
interface SearchParams {
  projectId: string;
  searchTerm?: string;
  hasCompanyInfo?: boolean;
  limit?: number;
  offset?: number;
}

export async function searchProjectProperties(params: SearchParams) {
  const supabase = await createClient();
  
  let query = supabase
    .from('project_properties')
    .select(`
      id,
      property:properties!inner (
        id,
        address,
        current_ownership:property_ownerships!inner (
          owner:owners!inner (
            id,
            name,
            address,
            companies:owner_companies (count)
          )
        )
      )
    `, { count: 'exact' })
    .eq('project_id', params.projectId)
    .eq('property.current_ownership.is_current', true);
  
  // 検索条件
  if (params.searchTerm) {
    query = query.or(`
      property.address.ilike.%${params.searchTerm}%,
      property.current_ownership.owner.name.ilike.%${params.searchTerm}%
    `);
  }
  
  // 会社情報の有無でフィルタ
  if (params.hasCompanyInfo !== undefined) {
    if (params.hasCompanyInfo) {
      query = query.gt('property.current_ownership.owner.companies.count', 0);
    } else {
      query = query.eq('property.current_ownership.owner.companies.count', 0);
    }
  }
  
  // ページネーション
  if (params.limit) {
    query = query.limit(params.limit);
  }
  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }
  
  const { data, error, count } = await query;
  
  return { data, error, count };
}
```

### CSVエクスポート

```sql
-- エクスポート用の関数
CREATE OR REPLACE FUNCTION get_project_export_data(p_project_id uuid)
RETURNS TABLE (
  property_address text,
  owner_name text,
  owner_address text,
  owner_lat numeric,
  owner_lng numeric,
  company_1_name text,
  company_1_number text,
  company_1_position text,
  company_2_name text,
  company_2_number text,
  company_2_position text,
  company_3_name text,
  company_3_number text,
  company_3_position text,
  ownership_start timestamptz,
  import_date timestamptz,
  researched_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.address,
    o.name,
    o.address,
    o.lat,
    o.lng,
    MAX(CASE WHEN oc.rank = 1 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 1 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 1 THEN oc.position END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.position END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.position END),
    po.ownership_start,
    pp.added_at,
    MAX(oc.researched_at)
  FROM project_properties pp
  JOIN properties p ON pp.property_id = p.id
  LEFT JOIN property_ownerships po ON p.id = po.property_id AND po.is_current = true
  LEFT JOIN owners o ON po.owner_id = o.id
  LEFT JOIN owner_companies oc ON o.id = oc.owner_id
  WHERE pp.project_id = p_project_id
  GROUP BY p.id, p.address, po.ownership_start, o.id, o.name, o.address, o.lat, o.lng, pp.added_at
  ORDER BY pp.added_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// TypeScriptでのエクスポート実装
export async function exportProjectToCSV(projectId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_project_export_data', {
    p_project_id: projectId
  });
  
  if (error) throw error;
  
  // CSVフォーマットに変換
  const headers = [
    '物件住所',
    '所有者名', '所有者住所', '所有者緯度', '所有者経度',
    '会社名1', '法人番号1', '役職1',
    '会社名2', '法人番号2', '役職2',
    '会社名3', '法人番号3', '役職3',
    '所有開始日', 'インポート日時', '調査日時'
  ];
  
  const csv = [
    headers.join(','),
    ...data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','))
  ].join('\n');
  
  return csv;
}
```

### リアルタイム更新の監視

```typescript
// 会社情報の更新をリアルタイムで監視
export function subscribeToProjectUpdates(
  projectId: string,
  onUpdate: (payload: any) => void
) {
  const supabase = createClient();
  
  const subscription = supabase
    .channel(`project-${projectId}-updates`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'owner_companies',
        filter: `owner_id=in.(
          SELECT DISTINCT o.id 
          FROM owners o
          JOIN property_ownerships po ON o.id = po.owner_id
          JOIN properties p ON po.property_id = p.id
          JOIN project_properties pp ON p.id = pp.property_id
          WHERE pp.project_id=eq.${projectId}
          AND po.is_current=eq.true
        )`
      },
      onUpdate
    )
    .subscribe();
  
  return subscription;
}
```

## 4. RLSポリシー設計

### 基本方針

1. **system_owner**: 全てのデータへの完全なアクセス
2. **プロジェクトオーナー**: 自分のプロジェクトに関連する全データへのフルアクセス
3. **エディター**: プロジェクトのデータ編集権限（削除は不可）
4. **ビューワー**: プロジェクトのデータ閲覧のみ

### RLSポリシー実装

```sql
-- RLSの有効化
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数：auth.uid()の呼び出しをキャッシュ化（パフォーマンス向上）
CREATE OR REPLACE FUNCTION cached_uid() 
RETURNS uuid AS $$
  SELECT auth.uid()
$$ LANGUAGE sql STABLE;

-- ヘルパー関数：ユーザーがsystem_ownerかチェック（最適化版）
CREATE OR REPLACE FUNCTION is_system_owner()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND role = 'system_owner'
  );
$$ LANGUAGE sql STABLE;

-- ヘルパー関数：ユーザーがアクセス可能なプロジェクトIDを取得
CREATE OR REPLACE FUNCTION user_accessible_projects()
RETURNS SETOF uuid AS $$
  SELECT p.id FROM projects p WHERE p.created_by = (SELECT auth.uid())
  UNION
  SELECT pm.project_id FROM project_members pm WHERE pm.user_id = (SELECT auth.uid())
$$ LANGUAGE sql STABLE;

-- ヘルパー関数：ユーザーが編集可能なプロジェクトIDを取得
CREATE OR REPLACE FUNCTION user_editable_projects()
RETURNS SETOF uuid AS $$
  SELECT p.id FROM projects p WHERE p.created_by = (SELECT auth.uid())
  UNION
  SELECT pm.project_id FROM project_members pm 
  WHERE pm.user_id = (SELECT auth.uid()) AND pm.role IN ('owner', 'editor')
$$ LANGUAGE sql STABLE;

-- 1. properties テーブルのRLS
-- 読み取り：プロジェクトに関連する物件のみ
CREATE POLICY "properties_select" ON properties FOR SELECT
TO authenticated
USING (
  (SELECT is_system_owner())
  OR properties.id IN (
    SELECT pp.property_id
    FROM project_properties pp
    WHERE pp.project_id = ANY(SELECT user_accessible_projects())
  )
);

-- 挿入：認証済みユーザーは誰でも（重複はUNIQUE制約で防ぐ）
CREATE POLICY "properties_insert" ON properties FOR INSERT
TO authenticated
WITH CHECK (true);

-- 更新：プロジェクトのエディター以上
CREATE POLICY "properties_update" ON properties FOR UPDATE
TO authenticated
USING (
  (SELECT is_system_owner())
  OR properties.id IN (
    SELECT pp.property_id
    FROM project_properties pp
    WHERE pp.project_id = ANY(SELECT user_editable_projects())
  )
);

-- 2. owners テーブルのRLS
-- 読み取り：プロジェクトに関連する所有者のみ
CREATE POLICY "owners_select" ON owners FOR SELECT
TO authenticated
USING (
  (SELECT is_system_owner())
  OR owners.id IN (
    SELECT DISTINCT po.owner_id
    FROM property_ownerships po
    WHERE po.property_id = ANY(
      SELECT pp.property_id
      FROM project_properties pp
      WHERE pp.project_id = ANY(SELECT user_accessible_projects())
    )
  )
);

-- 挿入：認証済みユーザーは誰でも
CREATE POLICY "owners_insert" ON owners FOR INSERT
TO authenticated
WITH CHECK (true);

-- 更新：プロジェクトのエディター以上
CREATE POLICY "owners_update" ON owners FOR UPDATE
TO authenticated
USING (
  (SELECT is_system_owner())
  OR owners.id IN (
    SELECT DISTINCT po.owner_id
    FROM property_ownerships po
    WHERE po.property_id = ANY(
      SELECT pp.property_id
      FROM project_properties pp
      WHERE pp.project_id = ANY(SELECT user_editable_projects())
    )
  )
);

-- 3. property_ownerships テーブルのRLS
-- 読み取り：プロジェクトに関連する履歴のみ
CREATE POLICY "property_ownerships_select" ON property_ownerships FOR SELECT
TO authenticated
USING (
  (SELECT is_system_owner())
  OR property_ownerships.property_id IN (
    SELECT pp.property_id
    FROM project_properties pp
    WHERE pp.project_id = ANY(SELECT user_accessible_projects())
  )
);

-- 挿入：プロジェクトのエディター以上かつ記録者として自分を設定
CREATE POLICY "property_ownerships_insert" ON property_ownerships FOR INSERT
TO authenticated
WITH CHECK (
  recorded_by = (SELECT cached_uid())
  AND (
    (SELECT is_system_owner())
    OR property_ownerships.property_id IN (
      SELECT pp.property_id
      FROM project_properties pp
      WHERE pp.project_id = ANY(SELECT user_editable_projects())
    )
  )
);

-- 更新：禁止（履歴は不変）
-- 削除：禁止（履歴は不変）

-- 4. project_properties テーブルのRLS
-- 読み取り：プロジェクトメンバーのみ
CREATE POLICY "project_properties_select" ON project_properties FOR SELECT
TO authenticated
USING (
  (SELECT is_system_owner())
  OR project_properties.project_id = ANY(SELECT user_accessible_projects())
);

-- 挿入：プロジェクトのエディター以上かつ追加者として自分を設定
CREATE POLICY "project_properties_insert" ON project_properties FOR INSERT
TO authenticated
WITH CHECK (
  added_by = (SELECT cached_uid())
  AND (
    (SELECT is_system_owner())
    OR project_properties.project_id = ANY(SELECT user_editable_projects())
  )
);

-- 削除：プロジェクトオーナーまたはsystem_owner
CREATE POLICY "project_properties_delete" ON project_properties FOR DELETE
TO authenticated
USING (
  (SELECT is_system_owner())
  OR project_properties.project_id IN (
    SELECT p.id FROM projects p WHERE p.created_by = (SELECT cached_uid())
  )
);

-- 5. owner_companies テーブルのRLS
-- 読み取り：プロジェクトに関連する会社情報のみ
CREATE POLICY "owner_companies_select" ON owner_companies FOR SELECT
TO authenticated
USING (
  (SELECT is_system_owner())
  OR owner_companies.owner_id IN (
    SELECT DISTINCT po.owner_id
    FROM property_ownerships po
    WHERE po.property_id = ANY(
      SELECT pp.property_id
      FROM project_properties pp
      WHERE pp.project_id = ANY(SELECT user_accessible_projects())
    )
  )
);

-- 挿入：プロジェクトのエディター以上かつ調査者として自分を設定
CREATE POLICY "owner_companies_insert" ON owner_companies FOR INSERT
TO authenticated
WITH CHECK (
  researched_by = (SELECT cached_uid())
  AND (
    (SELECT is_system_owner())
    OR owner_companies.owner_id IN (
      SELECT DISTINCT po.owner_id
      FROM property_ownerships po
      WHERE po.property_id = ANY(
        SELECT pp.property_id
        FROM project_properties pp
        WHERE pp.project_id = ANY(SELECT user_editable_projects())
      )
    )
  )
);

-- 更新：プロジェクトのエディター以上
CREATE POLICY "owner_companies_update" ON owner_companies FOR UPDATE
TO authenticated
USING (
  (SELECT is_system_owner())
  OR owner_companies.owner_id IN (
    SELECT DISTINCT po.owner_id
    FROM property_ownerships po
    WHERE po.property_id = ANY(
      SELECT pp.property_id
      FROM project_properties pp
      WHERE pp.project_id = ANY(SELECT user_editable_projects())
    )
  )
);

-- 削除：プロジェクトオーナーまたはsystem_owner
CREATE POLICY "owner_companies_delete" ON owner_companies FOR DELETE
TO authenticated
USING (
  (SELECT is_system_owner())
  OR owner_companies.owner_id IN (
    SELECT DISTINCT po.owner_id
    FROM property_ownerships po
    WHERE po.property_id = ANY(
      SELECT pp.property_id
      FROM project_properties pp
      WHERE pp.project_id IN (
        SELECT p.id FROM projects p WHERE p.created_by = (SELECT cached_uid())
      )
    )
  )
);

-- 6. projects テーブルのRLS
-- 読み取り：メンバーまたは作成者
CREATE POLICY "projects_select" ON projects FOR SELECT
TO authenticated
USING (
  (SELECT is_system_owner())
  OR created_by = (SELECT cached_uid())
  OR id IN (
    SELECT project_id FROM project_members WHERE user_id = (SELECT cached_uid())
  )
);

-- 挿入：認証済みユーザーは誰でも（作成者として自分を設定）
CREATE POLICY "projects_insert" ON projects FOR INSERT
TO authenticated
WITH CHECK (created_by = (SELECT cached_uid()));

-- 更新：プロジェクトオーナーまたはsystem_owner
CREATE POLICY "projects_update" ON projects FOR UPDATE
TO authenticated
USING (
  (SELECT is_system_owner())
  OR created_by = (SELECT cached_uid())
);

-- 削除：プロジェクトオーナーまたはsystem_owner
CREATE POLICY "projects_delete" ON projects FOR DELETE
TO authenticated
USING (
  (SELECT is_system_owner())
  OR created_by = (SELECT cached_uid())
);

-- 7. profiles テーブルのRLS
-- 読み取り：自分のプロフィールまたはsystem_owner
CREATE POLICY "profiles_select" ON profiles FOR SELECT
TO authenticated
USING (
  id = (SELECT cached_uid())
  OR (SELECT is_system_owner())
);

-- 挿入：自分のプロフィールのみ（通常はauth.usersトリガーで作成）
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT cached_uid()));

-- 更新：自分のプロフィールのみ（roleは変更不可）
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
TO authenticated
USING (id = (SELECT cached_uid()))
WITH CHECK (
  id = (SELECT cached_uid())
  AND (role = OLD.role OR (SELECT is_system_owner()))
);

-- 削除：禁止（CASCADE削除のみ許可）
-- profilesテーブルの削除ポリシーは設定しない

-- 8. project_members テーブルのRLS
-- 読み取り：プロジェクトメンバー
CREATE POLICY "project_members_select" ON project_members FOR SELECT
TO authenticated
USING (
  (SELECT is_system_owner())
  OR user_id = (SELECT cached_uid())
  OR project_id = ANY(SELECT user_accessible_projects())
);

-- 挿入：プロジェクトオーナーかつ追加者として自分を設定
CREATE POLICY "project_members_insert" ON project_members FOR INSERT
TO authenticated
WITH CHECK (
  added_by = (SELECT cached_uid())
  AND (
    (SELECT is_system_owner())
    OR project_members.project_id IN (
      SELECT p.id FROM projects p WHERE p.created_by = (SELECT cached_uid())
    )
  )
);

-- 更新：プロジェクトオーナー
CREATE POLICY "project_members_update" ON project_members FOR UPDATE
TO authenticated
USING (
  (SELECT is_system_owner())
  OR project_members.project_id IN (
    SELECT p.id FROM projects p WHERE p.created_by = (SELECT cached_uid())
  )
);

-- 削除：プロジェクトオーナー（ただし自分自身は削除不可）
CREATE POLICY "project_members_delete" ON project_members FOR DELETE
TO authenticated
USING (
  user_id != (SELECT cached_uid())
  AND (
    (SELECT is_system_owner())
    OR project_members.project_id IN (
      SELECT p.id FROM projects p WHERE p.created_by = (SELECT cached_uid())
    )
  )
);
```

### RLSポリシーの整合性確保

1. **カスケード削除の保護**: 外部キー制約により、関連データの整合性を保証
2. **履歴の不変性**: property_ownershipsテーブルは挿入のみ許可
3. **記録者の追跡**: recorded_by, researched_by, added_byフィールドで操作者を記録
4. **パフォーマンス最適化**: 
   - シンプルな`is_system_owner()`関数で高速化
   - 明示的なJOINによりクエリプランの最適化
   - SECURITY DEFINER関数を避けてRLSの安全性確保

### RLSパフォーマンス最適化のポイント

1. **関数の使用を最小限に**
   - 複雑な関数呼び出しを避け、直接的なJOINを使用
   - `is_system_owner()`は軽量でSTABLEな関数として実装

2. **インデックスの活用**
   - RLSポリシーで使用される列にインデックスを作成
   - 特に`project_id`、`user_id`、`created_by`列が重要

3. **段階的な最適化**
   - 初期段階：現在の実装で十分な性能
   - 中期段階：必要に応じてマテリアライズドビューを検討
   - 長期段階：パフォーマンス監視に基づいて最適化

## まとめ

この新しいDB設計により、以下が実現されます：

1. **データの一元管理**: 物件と所有者の重複を排除
2. **完全な履歴追跡**: 所有者の変更履歴を時系列で管理
3. **柔軟なプロジェクト管理**: プロジェクト間での物件共有
4. **堅牢なセキュリティ**: RLSによる細かなアクセス制御
5. **スケーラビリティ**: インデックスとトリガーによる最適化
6. **監査証跡**: added_by、recorded_by、researched_byフィールドによる完全な操作履歴
7. **2階層権限管理**: システムレベルとプロジェクトレベルの権限分離

### 設計上の重要な決定事項

1. **監査フィールドの必要性**
   - `added_by`、`recorded_by`、`researched_by`は削除せず維持
   - 理由：コンプライアンス、問題追跡、責任の明確化

2. **権限の分離**
   - `profiles.role`：システム全体の権限
   - `project_members.role`：プロジェクト単位の権限
   - 理由：柔軟性と管理の簡素化の両立

3. **中間テーブル設計の採用**
   - property_idとowner_idの組み合わせで一意性を保証
   - 同じ物件・所有者の組み合わせは1レコードのみ
   - ownership_start: 実際の所有開始時刻
   - created_at: システムへの初回登録時刻
   - updated_at: レコードの最終更新時刻
   - 理由：シンプルで理解しやすい設計、重複データの防止、監査証跡の強化

## property_ownershipsテーブルの設計詳細

### 新設計：シンプルな中間テーブル

新しいテーブル設計は以下の特徴を持ちます：

1. **UUID主キー**: `id`フィールドを主キーとして使用
2. **UNIQUE制約**: `(property_id, owner_id)`のシンプルな組み合わせで重複防止
3. **ON DELETE CASCADE**: 親レコードの削除時に自動的に履歴も削除
4. **時刻管理の明確化**: 
   - `ownership_start`: 実際の所有開始時刻
   - `created_at`: システムへの初回登録時刻
   - `updated_at`: レコードの最終更新時刻

### 設計のメリット

1. **シンプルな設計**: 
   - 理解しやすい中間テーブル構造
   - 同じ物件・所有者の組み合わせは1レコードのみ

2. **効率的なデータ管理**: 
   - 重複データの心配がない
   - UPSERTで簡単に処理可能

3. **履歴の明確化**: 
   - 所有者変更は新しいレコードの挿入で実現
   - トリガーが自動的に既存レコードを終了

4. **監査証跡の強化**: 
   - created_atとupdated_atで完全な履歴管理
   - recorded_byで操作者を追跡

### 実装上の注意点

インポート処理では`upsert`を使用し、既存レコードは更新しない：

```typescript
const { error } = await supabase
  .from('property_ownerships')
  .upsert(records, {
    onConflict: 'property_id,owner_id',
    ignoreDuplicates: true  // 既存レコードは無視（同じ物件・所有者の組み合わせはスキップ）
  });
```

### トリガーの動作

1. **INSERT時のみ動作**: 新しい所有者が追加されたとき
2. **既存レコードの終了**: 同じproperty_idで異なるowner_idのレコードを終了
3. **UPDATE時は動作しない**: 既存レコードの更新時は何もしない

### エラーハンドリング

```typescript
if (error.code === '23505') {
  // UNIQUE制約違反 = 既に同じ所有者
  return { 
    success: false, 
    error: 'この物件は既に指定された所有者のものです' 
  };
}
```

この設計により、履歴データの整合性を保ちながら、シンプルで理解しやすいデータモデルを実現できます。

### 新設計による改善点

1. **データモデルの簡素化**
   - 中間テーブルとしてのシンプルな構造
   - 重複データの完全な排除

2. **保守性の向上**
   - 理解しやすいUNIQUE制約
   - 明確なトリガー動作

3. **パフォーマンスの向上**
   - インデックスの効率的な利用
   - シンプルなクエリ構造

### 注意事項

1. **ignoreDuplicatesの設定**
   - property_ownershipsのupsert時は`ignoreDuplicates: true`を使用
   - これにより、既存レコードは無視され、エラーも発生しない
   - 同じ物件・所有者の組み合わせはスキップされる

2. **トリガーの動作範囲**
   - INSERT時のみ動作するように変更
   - UPDATE時の不要な処理を防止

実装時は、トランザクション管理とエラーハンドリングに注意し、段階的な移行を検討してください。