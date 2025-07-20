# データ取得パターン参考資料

このドキュメントは、新しいDB設計におけるデータ取得パターンの参考資料です。
将来の実装時に活用してください。

## 新DB設計の概要

### テーブル構造

```sql
-- 1. 物件マスターテーブル（一意性を保証）
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL UNIQUE,  -- 物件住所は完全に一意
  lat numeric(10, 8),
  lng numeric(11, 8),
  street_view_available boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. 所有者マスターテーブル
CREATE TABLE owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(name, address)  -- 同姓同名で同住所は同一人物とみなす
);

-- 3. 物件所有履歴テーブル（時系列管理）
CREATE TABLE property_ownerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) NOT NULL,
  owner_id uuid REFERENCES owners(id) NOT NULL,
  ownership_start date,
  ownership_end date,
  is_current boolean DEFAULT true,  -- 現在の所有者フラグ
  source text,  -- 'pdf_import', 'manual_update'等
  recorded_by uuid REFERENCES auth.users(id) NOT NULL,
  recorded_at timestamptz DEFAULT now() NOT NULL,
  CHECK (ownership_end IS NULL OR ownership_end >= ownership_start)
);

-- 4. プロジェクト物件関連テーブル
CREATE TABLE project_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) NOT NULL,
  added_by uuid REFERENCES auth.users(id) NOT NULL,
  added_at timestamptz DEFAULT now() NOT NULL,
  import_source_file text,  -- インポート元ファイル名
  UNIQUE(project_id, property_id)
);

-- 5. 所有者会社情報テーブル（改善版）
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
```

### リレーションシップ図

```
projects ─┐
          ├─ project_properties ─── properties ─── property_ownerships ─── owners ─── owner_companies
          │                                              (履歴管理)
          └─ project_members ─── users
```

## 基本的なデータ取得パターン

### 1. プロジェクトの物件一覧取得（所有者情報含む）

```typescript
async function getProjectPropertiesWithOwners(projectId: string) {
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
        lat,
        lng,
        street_view_available,
        current_ownership:property_ownerships!inner (
          id,
          ownership_start,
          owner:owners (
            id,
            name,
            address
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

### 2. 会社情報を含む詳細な一覧取得

```typescript
async function getProjectPropertiesWithFullDetails(projectId: string) {
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
        lat,
        lng,
        street_view_available,
        current_ownership:property_ownerships!inner (
          id,
          ownership_start,
          owner:owners (
            id,
            name,
            address,
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

## 高度なクエリパターン

### 注記：開発初期段階での実装方針
- **ビューの使用は現段階では不要**（オーバーエンジニアリング回避）
- **N+1問題はSupabaseの優れたJOIN機能で解決済み**
- 将来的にパフォーマンス要件が明確になった時点で以下を検討：
  - 複雑なクエリが頻繁に実行される場合のビュー作成
  - 大量データ処理時の最適化戦略
  - キャッシュ層の導入

### 1. 検索・フィルタリング機能

```typescript
interface PropertySearchParams {
  projectId: string;
  searchTerm?: string;
  hasCompanyInfo?: boolean;
  limit?: number;
  offset?: number;
}

async function searchProjectProperties(params: PropertySearchParams) {
  const supabase = await createClient();
  
  let query = supabase
    .from('project_properties')
    .select(`
      id,
      property:properties!inner (
        id,
        address,
        lat,
        lng,
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

## パフォーマンス最適化

### 1. インデックスの活用

```sql
-- 検索性能向上のためのインデックス
CREATE INDEX idx_properties_address_search ON properties USING gin(to_tsvector('japanese', address));
CREATE INDEX idx_owners_name_search ON owners USING gin(to_tsvector('japanese', name));
CREATE INDEX idx_property_ownerships_current ON property_ownerships(property_id) WHERE is_current = true;
CREATE INDEX idx_project_properties_property ON project_properties(property_id);
```

### 2. PostgreSQL関数の使用

```sql
-- 所有権履歴の整合性を保つトリガー
CREATE OR REPLACE FUNCTION update_property_ownership() 
RETURNS TRIGGER AS $$
BEGIN
  -- 新しい所有者が設定されたら、以前の所有者のis_currentをfalseに
  IF NEW.is_current = true THEN
    UPDATE property_ownerships 
    SET is_current = false, ownership_end = CURRENT_DATE
    WHERE property_id = NEW.property_id 
    AND id != NEW.id 
    AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_current_owner
BEFORE INSERT OR UPDATE ON property_ownerships
FOR EACH ROW EXECUTE FUNCTION update_property_ownership();
```

## エクスポート用データ取得

### CSVエクスポート用のフラット化されたデータ

```sql
CREATE OR REPLACE FUNCTION get_project_export_data(p_project_id uuid)
RETURNS TABLE (
  property_address text,
  property_lat numeric,
  property_lng numeric,
  owner_name text,
  owner_address text,
  company_1_name text,
  company_1_number text,
  company_1_position text,
  company_2_name text,
  company_2_number text,
  company_2_position text,
  company_3_name text,
  company_3_number text,
  company_3_position text,
  import_date timestamptz,
  researched_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.address,
    p.lat,
    p.lng,
    o.name,
    o.address,
    MAX(CASE WHEN oc.rank = 1 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 1 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 1 THEN oc.position END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.position END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.position END),
    pp.added_at,
    MAX(oc.researched_at)
  FROM project_properties pp
  JOIN properties p ON pp.property_id = p.id
  LEFT JOIN property_ownerships po ON p.id = po.property_id AND po.is_current = true
  LEFT JOIN owners o ON po.owner_id = o.id
  LEFT JOIN owner_companies oc ON o.id = oc.owner_id
  WHERE pp.project_id = p_project_id
  GROUP BY p.id, p.address, p.lat, p.lng, o.id, o.name, o.address, pp.added_at
  ORDER BY pp.added_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// TypeScriptでの使用例
async function getProjectDataForExport(projectId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_project_export_data', {
    p_project_id: projectId
  });
  
  return { data, error };
}
```

## リアルタイム機能

### Supabaseのリアルタイム購読を使用した会社情報の更新監視

```typescript
function subscribeToCompanyUpdates(projectId: string, onUpdate: (payload: any) => void) {
  const supabase = createClient();
  
  const subscription = supabase
    .channel(`project-${projectId}-companies`)
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

// 使用例
const subscription = subscribeToCompanyUpdates('project-id', (payload) => {
  console.log('会社情報が更新されました:', payload);
  // UIを更新するロジック
});

// クリーンアップ
subscription.unsubscribe();
```

## TypeScriptでの型定義と実装例

### 型定義

```typescript
import { Tables } from '@/lib/types/database';

// 基本的な型定義
type Property = Tables<'properties'>;
type Owner = Tables<'owners'>;
type PropertyOwnership = Tables<'property_ownerships'>;
type ProjectProperty = Tables<'project_properties'>;
type OwnerCompany = Tables<'owner_companies'>;

// 複合型の定義
interface PropertyWithOwner extends Property {
  current_ownership: PropertyOwnership & {
    owner: Owner;
  };
}

interface PropertyWithFullDetails extends Property {
  current_ownership: PropertyOwnership & {
    owner: Owner & {
      companies: OwnerCompany[];
    };
  };
}

interface ProjectPropertyDetail {
  id: string;
  added_at: string;
  import_source_file: string | null;
  property: PropertyWithFullDetails;
}
```

### エラーハンドリングの実装

```typescript
async function safeGetProjectProperties(projectId: string) {
  try {
    const { data, error } = await getProjectPropertiesWithFullDetails(projectId);
    
    if (error) {
      console.error('データ取得エラー:', error);
      
      // ユーザーフレンドリーなエラーメッセージ
      if (error.code === 'PGRST116') {
        throw new Error('指定されたプロジェクトが見つかりません');
      }
      if (error.code === '42501') {
        throw new Error('このプロジェクトへのアクセス権限がありません');
      }
      
      throw new Error('データの取得に失敗しました');
    }
    
    return data;
  } catch (error) {
    console.error('予期せぬエラー:', error);
    throw error;
  }
}
```

### RLSを考慮した実装

```typescript
// system_ownerチェックを含む権限確認
async function checkProjectAccess(projectId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  // system_ownerチェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role === 'system_owner') {
    return true;
  }
  
  // プロジェクトメンバーチェック
  const { data: member } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle();
  
  return !!member;
}
```

## PDFからのデータインポートパターン

### 現在のDB設計での実装（推奨）

現在の設計はシンプルで効率的です：

```typescript
// 現在の実装（lib/actions/property.ts参照）
async function savePropertiesAction(data: SavePropertiesData) {
  // 1. 所有者の一括登録（upsert）
  const { data: owners } = await supabase
    .from('owners')
    .upsert(uniqueOwners, { onConflict: 'name,address' })
    .select();
  
  // 2. 物件の一括登録（プロジェクトごと）
  const { data: properties } = await supabase
    .from('properties')
    .upsert(propertiesToInsert, {
      onConflict: 'project_id,property_address'
    })
    .select();
  
  // 2つのテーブルへの操作で完了
}
```

### 新しいDB設計での実装例

```typescript
async function savePropertiesNewDesign(
  projectId: string,
  pdfData: PropertyData[]
) {
  const supabase = await createClient();
  
  // Step 1: 所有者マスターの処理
  const uniqueOwners = getUniqueOwners(pdfData);
  const { data: owners } = await supabase
    .from('owners')
    .upsert(uniqueOwners, { onConflict: 'name,address' })
    .select();
  
  // Step 2: 物件マスターの処理（グローバルに一意）
  const uniqueProperties = getUniqueProperties(pdfData);
  const { data: properties } = await supabase
    .from('properties')
    .upsert(uniqueProperties, { onConflict: 'address' })
    .select();
  
  // Step 3: 物件所有履歴の記録
  // 既存の所有者をis_current=falseに更新
  for (const property of properties) {
    await supabase
      .from('property_ownerships')
      .update({ is_current: false, ownership_end: currentDate })
      .eq('property_id', property.id)
      .eq('is_current', true);
  }
  
  // 新しい所有関係を追加
  const ownershipRecords = buildOwnershipRecords(
    pdfData, owners, properties
  );
  await supabase
    .from('property_ownerships')
    .insert(ownershipRecords);
  
  // Step 4: プロジェクトとの関連付け
  const projectPropertyLinks = buildProjectPropertyLinks(
    projectId, properties, pdfData
  );
  await supabase
    .from('project_properties')
    .upsert(projectPropertyLinks, {
      onConflict: 'project_id,property_id'
    });
}
```

### 両設計の比較

| 観点 | 現在の設計 | 新しい設計 |
|------|-----------|-----------|
| **クエリ数** | 2〜3回 | 最低4回以上 |
| **複雑性** | シンプル | 複雑（履歴管理含む） |
| **トランザクション** | 簡単 | 難しい |
| **パフォーマンス** | 高速 | やや遅い |
| **重複データ** | プロジェクトごと | なし |
| **履歴管理** | なし | あり |

## 現在のDB設計を維持する理由

### 1. シンプルさの価値

```typescript
// 現在: 1つのテーブルで完結
const { data } = await supabase
  .from('properties')
  .select('*, owner:owners(*)')
  .eq('project_id', projectId);

// 新設計: 複数テーブルをJOIN
const { data } = await supabase
  .from('project_properties')
  .select(`
    property:properties(
      *,
      current_ownership:property_ownerships(
        owner:owners(*)
      )
    )
  `)
  .eq('project_id', projectId);
```

### 2. 段階的な拡張案

```typescript
// Phase 1: 現在の構造で重複チェックを強化
async function improvedSaveProperties(data: PropertyData[]) {
  // プロジェクト内での重複を事前チェック
  const existingAddresses = await checkExistingProperties(
    projectId, 
    data.map(p => p.propertyAddress)
  );
  
  const newProperties = data.filter(
    p => !existingAddresses.includes(p.propertyAddress)
  );
  
  // 新規のみ追加
  return await saveProperties(newProperties);
}

// Phase 2: 必要に応じて履歴テーブルのみ追加
// 既存の構造は変更せず、追加のテーブルで履歴管理

// Phase 3: 本当に必要になったら新設計へ移行
```

## 実装時の考慮事項

### エラーハンドリング

```typescript
async function robustSaveProperties(data: PropertyData[]) {
  const errors = [];
  const savedCount = { owners: 0, properties: 0 };
  
  try {
    // バッチごとにエラーを記録
    for (const batch of chunks(data, BATCH_SIZE)) {
      try {
        const result = await processBatch(batch);
        savedCount.owners += result.owners;
        savedCount.properties += result.properties;
      } catch (batchError) {
        errors.push({
          batch: batch.map(p => p.propertyAddress),
          error: batchError.message
        });
      }
    }
    
    return { success: true, savedCount, errors };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### パフォーマンス最適化

```typescript
// 大量データの効率的な処理
async function optimizedBulkImport(data: PropertyData[]) {
  const CHUNK_SIZE = 500;  // Supabaseの推奨サイズ
  
  // 並列処理ではなく順次処理（DB負荷を考慮）
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    // upsertで重複を自動処理
    await supabase
      .from('properties')
      .upsert(chunk, {
        onConflict: 'project_id,property_address',
        defaultToNull: false
      });
    
    // 進捗を報告
    console.log(`処理済み: ${i + chunk.length}/${data.length}`);
  }
}
```

## まとめ

この新しいDB設計により以下の利点が得られます：

1. **データ整合性**: 物件の重複がなく、所有者履歴も管理可能
2. **パフォーマンス**: 適切なインデックスとビューでクエリを最適化
3. **柔軟性**: プロジェクト間で物件情報を共有可能
4. **拡張性**: 将来的な要件変更に対応しやすい構造
5. **セキュリティ**: RLSで権限管理が明確

ただし、**現段階では現在のシンプルな設計を維持することを推奨**します。複雑な要件が明確になった時点で、段階的に移行することが現実的です。

実装時は、これらのパターンを参考に、具体的な要件に合わせて調整してください。