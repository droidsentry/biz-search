'use server'

import { createClient } from "@/lib/supabase/server";
import { 
  createProjectSchema, 
  savePropertiesSchema
} from "@/lib/schemas/property";
import { 
  CreateProjectFormData, 
  SavePropertiesData,
  SavePropertiesResponse,
  PDFPropertyData,
  ImportResult
} from "@/lib/types/property";
import { Tables, TablesInsert } from '@/lib/types/database';
import { revalidatePath } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * プロジェクト名の重複チェック
 */
export async function checkProjectName(name: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  
  if (error) {
    console.error('プロジェクト名チェックエラー:', error);
    return false;
  }
  
  return !data;
}

/**
 * 新規プロジェクトの作成
 */
export async function createProjectAction(formData: CreateProjectFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('認証が必要です');
  }

  const {success, data, error} = await createProjectSchema.safeParseAsync(formData);
  if (!success) {
    console.error('プロジェクト作成エラー:', error);
    throw new Error(`プロジェクト作成エラー: ${error.message}`);
  }
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: data.name,
      description: data.description,
      created_by: user.id,
    })
    .select()
    .single();
    
  if (projectError) {
    console.error('プロジェクト作成エラー:', projectError);
    throw new Error('プロジェクトの作成に失敗しました');
  }
  return project;
}


/**
 * ヘルパー関数：ユニークな所有者を抽出
 */
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

/**
 * ヘルパー関数：ユニークな物件を抽出
 */
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

/**
 * 所有者のupsert処理
 */
async function upsertOwners(
  supabase: SupabaseClient,
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

/**
 * 物件のupsert処理
 */
async function upsertProperties(
  supabase: SupabaseClient,
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

/**
 * 所有履歴レコードの構築
 */
function buildOwnershipRecords(
  batch: PDFPropertyData[],
  propertyIdMap: Map<string, string>,
  ownerIdMap: Map<string, string>,
  userId: string
): TablesInsert<'property_ownerships'>[] {
  const records: TablesInsert<'property_ownerships'>[] = [];
  // ownership_startにはインポート実行日時を記録（PDFの記載日付ではない）
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

/**
 * 所有履歴の挿入（UNIQUE制約で重複を防ぐ）
 */
async function insertOwnershipRecords(
  supabase: SupabaseClient,
  records: TablesInsert<'property_ownerships'>[]
) {
  if (records.length === 0) return;
  
  // UNIQUE制約により重複を防止：upsertで適切に処理
  const { error } = await supabase
    .from('property_ownerships')
    .upsert(records, {
      onConflict: 'property_id,owner_id',
      ignoreDuplicates: true  // 既存レコードは無視
    });
  
  if (error) throw error;
}

/**
 * プロジェクト物件レコードの構築
 */
function buildProjectPropertyRecords(
  projectId: string,
  batch: PDFPropertyData[],
  propertyIdMap: Map<string, string>,
  userId: string
): TablesInsert<'project_properties'>[] {
  const records: TablesInsert<'project_properties'>[] = [];
  
  batch.forEach(item => {
    const propertyId = propertyIdMap.get(item.propertyAddress);
    
    if (propertyId) {
      records.push({
        project_id: projectId,
        property_id: propertyId,
        added_by: userId,
        import_source_file: item.sourceFileName
      });
    }
  });
  
  return records;
}

/**
 * プロジェクト物件のupsert処理
 */
async function upsertProjectProperties(
  supabase: SupabaseClient,
  records: TablesInsert<'project_properties'>[]
) {
  if (records.length === 0) return;
  
  const { error } = await supabase
    .from('project_properties')
    .upsert(records, {
      onConflict: 'project_id,property_id',
      ignoreDuplicates: true
    });
  
  if (error) throw error;
}

/**
 * メイン関数：PDFデータをインポート
 */
async function importPropertiesFromPDF(
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

/**
 * 物件データの一括保存（新DB設計対応）
 */
export async function savePropertiesAction(
  data: SavePropertiesData
): Promise<SavePropertiesResponse> {
  // 認証確認
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { 
      success: false, 
      projectId: data.projectId,
      savedCount: 0,
      errors: [{ index: -1, propertyAddress: '', error: '認証が必要です' }]
    };
  }
  
  // バリデーション
  const result = savePropertiesSchema.safeParse(data);
  if (!result.success) {
    return { 
      success: false, 
      projectId: data.projectId,
      savedCount: 0,
      errors: [{ index: -1, propertyAddress: '', error: '入力データが不正です' }]
    };
  }
  
  
  try {
    // PDFPropertyData形式に変換
    const pdfData: PDFPropertyData[] = result.data.properties.map(prop => ({
      propertyAddress: prop.propertyAddress,
      ownerName: prop.ownerName,
      ownerAddress: prop.ownerAddress,
      lat: prop.lat,
      lng: prop.lng,
      streetViewAvailable: prop.streetViewAvailable,
      sourceFileName: prop.sourceFileName || ''
    }));
    
    // 新しいインポート関数を使用
    const importResult = await importPropertiesFromPDF(
      result.data.projectId,
      pdfData,
      user.id
    );
    
    // キャッシュの再検証
    revalidatePath('/property-list');
    revalidatePath('/property-import');
    
    // ImportResult型をSavePropertiesResponse型に変換
    const errors = importResult.errors.map((err, index) => ({
      index,
      propertyAddress: err.propertyAddress,
      error: err.error
    }));
    
    return {
      success: importResult.success,
      projectId: result.data.projectId,
      savedCount: importResult.importedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('物件保存エラー:', error);
    return {
      success: false,
      projectId: result.data.projectId,
      savedCount: 0,
      errors: [{ 
        index: -1, 
        propertyAddress: '', 
        error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
      }]
    };
  }
}

