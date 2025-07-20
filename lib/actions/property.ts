'use server'

import { createClient } from "@/lib/supabase/server";
import { 
  createProjectSchema, 
  savePropertiesSchema,
  importLogSchema 
} from "@/lib/schemas/property";
import { 
  CreateProjectFormData, 
  SavePropertiesData,
  SavePropertiesResponse 
} from "@/lib/types/property";
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
    .maybeSingle(); // データがなければnullを返す
  
  if (error) {
    console.error('プロジェクト名チェックエラー:', error);
    return false;
  }
  // console.log("data", data)
  // console.log("error", error)
  
  // データがなければ利用可能（true）
  return !data;
}

/**
 * 新規プロジェクトの作成
 */
export async function createProjectAction(formData: CreateProjectFormData) {
  // 認証確認
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: '認証が必要です' };
  }
  
  // バリデーション
  const result = createProjectSchema.safeParse(formData);
  if (!result.success) {
    return { 
      error: '入力データが不正です',
      details: result.error.flatten() 
    };
  }

  // console.log("result.data", result.data)
  // return null
  
  try {
    // 重複チェック
    const isUnique = await checkProjectName(result.data.name);
    if (!isUnique) {
      return { error: 'このプロジェクト名は既に使用されています' };
    }
    
    // プロジェクト作成
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: result.data.name,
        description: result.data.description,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('プロジェクト作成エラー1:', projectError);
      return { error: 'プロジェクトの作成に失敗しました' };
    }
    
    return { success: true, data: project };
  } catch (error) {
    console.error('プロジェクト作成エラー2:', error);
    return { error: '予期せぬエラーが発生しました' };
  }
}

/**
 * 権限チェック
 */
async function checkEditPermission(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<boolean> {
  const { data: member } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  
  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .single();
  
  const isOwner = project?.created_by === userId;
  const hasEditPermission = isOwner || member?.role === 'editor';
  
  return hasEditPermission;
}

/**
 * 所有者処理（RLS対応）
 */
async function processOwners(
  supabase: SupabaseClient,
  uniqueOwners: Array<{name: string, address: string}>
): Promise<Map<string, string>> {
  const ownerIdMap = new Map<string, string>();
  
  if (uniqueOwners.length === 0) {
    return ownerIdMap;
  }
  
  // バッチサイズ
  const batchSize = 200;
  
  // upsert で一括作成/更新し、結果を取得
  for (let i = 0; i < uniqueOwners.length; i += batchSize) {
    const batch = uniqueOwners.slice(i, i + batchSize);
    console.log("batch", batch)
    
    const { data, error } = await supabase
      .from('owners')
      .upsert(batch, { onConflict: 'name,address' })
      .select('id, name, address');
    
    if (error) {
      console.error('所有者upsertエラー:', error);
      // エラーがあっても処理を継続
    } else if (data) {
      // 取得したデータをマップに追加
      data.forEach(owner => {
        ownerIdMap.set(`${owner.name}_${owner.address}`, owner.id);
      });
    }
  }
  
  return ownerIdMap;
}

/**
 * 物件保存処理
 */
type PropertyInsert = {
  project_id: string;
  property_address: string;
  owner_id: string;
  source_file_name: string | null;
  lat: number | null;
  lng: number | null;
  street_view_available: boolean | null;
  imported_by: string;
};

type PropertyError = {
  index: number;
  propertyAddress: string;
  error: string;
};

async function saveProperties(
  supabase: SupabaseClient,
  properties: PropertyInsert[]
): Promise<{savedCount: number, errors: PropertyError[]}> {
  const errors: PropertyError[] = [];
  let savedCount = 0;
  
  if (properties.length === 0) {
    return { savedCount, errors };
  }
  
  // チャンク処理（大量データ対応）
  const chunkSize = 500;
  for (let i = 0; i < properties.length; i += chunkSize) {
    const chunk = properties.slice(i, i + chunkSize);
    
    const { data: insertedData, error: insertError } = await supabase
      .from('properties')
      .upsert(chunk, {
        onConflict: 'project_id,property_address',
        ignoreDuplicates: false,
      })
      .select();
    
    if (insertError) {
      console.error('物件一括挿入エラー:', insertError);
      
      // エラーが発生した場合、個別に処理して詳細なエラーを取得
      for (let j = 0; j < chunk.length; j++) {
        const property = chunk[j];
        const originalIndex = i + j;
        
        const { error: singleError } = await supabase
          .from('properties')
          .insert(property);
        
        if (singleError) {
          if (singleError.code === '23505') {
            errors.push({
              index: originalIndex,
              propertyAddress: property.property_address,
              error: 'この物件住所は既にこのプロジェクトに登録されています',
            });
          } else {
            errors.push({
              index: originalIndex,
              propertyAddress: property.property_address,
              error: '物件の登録に失敗しました',
            });
          }
        } else {
          savedCount++;
        }
      }
    } else {
      savedCount += insertedData?.length || 0;
    }
  }
  
  return { savedCount, errors };
}

/**
 * 物件データの一括保存
 */
export async function savePropertiesAction(
  data: SavePropertiesData
): Promise<SavePropertiesResponse> {
  // 認証確認
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // デバッグ用：認証状態を確認
  console.log('Current user:', user?.id, user?.email);
  
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
  
  // 権限チェック
  const hasPermission = await checkEditPermission(supabase, result.data.projectId, user.id);
  if (!hasPermission) {
    return { 
      success: false, 
      projectId: data.projectId,
      savedCount: 0,
      errors: [{ index: -1, propertyAddress: '', error: '編集権限がありません' }]
    };
  }
  
  let savedCount = 0;
  const errors: PropertyError[] = [];
  
  try {
    // Step 1: 重複しない所有者情報を収集
    const ownerMap = new Map<string, { name: string; address: string }>();
    result.data.properties.forEach(property => {
      const key = `${property.ownerName}_${property.ownerAddress}`;
      ownerMap.set(key, {
        name: property.ownerName,
        address: property.ownerAddress,
      });
    });
    const uniqueOwners = Array.from(ownerMap.values());
    console.log("uniqueOwners", uniqueOwners)
    
    // Step 2: 所有者の処理
    const ownerIdMap = await processOwners(supabase, uniqueOwners);
    console.log("ownerIdMap", ownerIdMap)
    
    // 所有者が正しく処理されなかった場合のエラーチェック
    if (ownerIdMap.size === 0 && uniqueOwners.length > 0) {
      console.error('所有者の処理に失敗しました。全ての所有者がマップされませんでした。');
    }
    
    // Step 3: 物件データを準備
    const propertiesToInsert: PropertyInsert[] = [];
    
    result.data.properties.forEach((property, index) => {
      const ownerKey = `${property.ownerName}_${property.ownerAddress}`;
      const ownerId = ownerIdMap.get(ownerKey);
      
      if (!ownerId) {
        errors.push({
          index,
          propertyAddress: property.propertyAddress,
          error: '所有者の登録に失敗しました',
        });
      } else {
        propertiesToInsert.push({
          project_id: result.data.projectId,
          property_address: property.propertyAddress,
          owner_id: ownerId,
          source_file_name: property.sourceFileName || null,
          lat: property.lat || null,
          lng: property.lng || null,
          street_view_available: property.streetViewAvailable || null,
          imported_by: user.id,
        });
      }
    });
    
    // Step 4: 物件の保存
    const saveResult = await saveProperties(supabase, propertiesToInsert);
    savedCount = saveResult.savedCount;
    
    // エラーをマージ
    errors.push(...saveResult.errors);
    
    // インポートログの記録
    const importLogData = {
      projectId: result.data.projectId,
      fileCount: 1, // TODO: 実際のファイル数を渡す
      propertyCount: result.data.properties.length,
      successCount: savedCount,
      errorCount: errors?.length || 0,
    };
    
    const logResult = importLogSchema.safeParse(importLogData);
    if (logResult.success) {
      await supabase
        .from('import_logs')
        .insert({
          project_id: logResult.data.projectId,
          file_count: logResult.data.fileCount,
          property_count: logResult.data.propertyCount,
          success_count: logResult.data.successCount,
          error_count: logResult.data.errorCount,
          imported_by: user.id,
        });
    }
    
    // キャッシュの再検証
    revalidatePath('/property-list');
    
    return {
      success: savedCount > 0,
      projectId: result.data.projectId,
      savedCount,
      errors: errors?.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('物件保存エラー:', error);
    return {
      success: false,
      projectId: result.data.projectId,
      savedCount,
      errors: errors?.length > 0 ? errors : [{ 
        index: -1, 
        propertyAddress: '', 
        error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' 
      }],
    };
  }
}

