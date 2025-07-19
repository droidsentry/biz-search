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
import { Tables } from "@/lib/types/database";
import { revalidatePath } from "next/cache";

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
 * 物件データの一括保存
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
  
  // 権限チェック（editor以上）
  const { data: member } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', result.data.projectId)
    .eq('user_id', user.id)
    .maybeSingle();
  
  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', result.data.projectId)
    .single();
  
  const isOwner = project?.created_by === user.id;
  const hasEditPermission = isOwner || member?.role === 'editor';
  
  if (!hasEditPermission) {
    return { 
      success: false, 
      projectId: data.projectId,
      savedCount: 0,
      errors: [{ index: -1, propertyAddress: '', error: '編集権限がありません' }]
    };
  }
  
  const errors: SavePropertiesResponse['errors'] = [];
  let savedCount = 0;
  
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
    
    // Step 2: 既存の所有者を一括で取得
    
    // Supabaseのor条件を使用して既存の所有者を検索
    let existingOwners: Pick<Tables<'owners'>, 'id' | 'name' | 'address'>[] = [];
    if (uniqueOwners.length > 0) {
      // バッチ処理（Supabaseのデフォルトlimit:1000を考慮）
      const batchSize = 500;
      for (let i = 0; i < uniqueOwners.length; i += batchSize) {
        const batch = uniqueOwners.slice(i, i + batchSize);
        
        // 各所有者の条件を作成（適切にエスケープ）
        const orConditions = batch.map(o => {
          // 値を適切にエスケープ
          const escapedName = o.name.replace(/'/g, "''").replace(/"/g, '""');
          const escapedAddress = o.address.replace(/'/g, "''").replace(/"/g, '""');
          return `and(name.eq."${escapedName}",address.eq."${escapedAddress}")`;
        }).join(',');
        
      const { data } = await supabase
          .from('owners')
          .select('id, name, address')
          .or(orConditions);
        
        
        if (data) {
          existingOwners = existingOwners.concat(data);
        }
      }
    }
    
    // Step 3: 新規所有者を特定して一括作成
    const existingOwnerKeys = new Set(
      existingOwners.map(o => `${o.name}_${o.address}`)
    );
    
    const newOwners = uniqueOwners.filter(owner => 
      !existingOwnerKeys.has(`${owner.name}_${owner.address}`)
    );
    
    let createdOwners: Pick<Tables<'owners'>, 'id' | 'name' | 'address'>[] = [];
    if (newOwners.length > 0) {
      const { data, error: createError } = await supabase
        .from('owners')
        .insert(newOwners)
        .select();
      
      if (createError) {
        console.error('所有者一括作成エラー:', createError);
        // 個別に作成を試みる
        for (const owner of newOwners) {
          const { data: singleOwner } = await supabase
            .from('owners')
            .insert(owner)
            .select()
            .single();
          if (singleOwner) {
            createdOwners.push(singleOwner);
          }
        }
      } else if (data) {
        createdOwners = data;
      }
    }
    
    // Step 4: 所有者IDマップを作成
    const allOwners = [...existingOwners, ...createdOwners];
    const ownerIdMap = new Map(
      allOwners.map(o => [`${o.name}_${o.address}`, o.id])
    );
    
    // Step 5: 物件データを準備して一括挿入
    const propertiesToInsert = result.data.properties.map((property, index) => {
      const ownerKey = `${property.ownerName}_${property.ownerAddress}`;
      const ownerId = ownerIdMap.get(ownerKey);
      
      if (!ownerId) {
        errors.push({
          index,
          propertyAddress: property.propertyAddress,
          error: '所有者の登録に失敗しました',
        });
        return null;
      }
      
      return {
        project_id: result.data.projectId,
        property_address: property.propertyAddress,
        owner_id: ownerId,
        source_file_name: property.sourceFileName || null,
        lat: property.lat || null,
        lng: property.lng || null,
        street_view_available: property.streetViewAvailable || null,
        imported_by: user.id,
      };
    }).filter(p => p !== null);
    
    // Step 6: 物件を一括で挿入（upsertで重複を回避）
    if (propertiesToInsert.length > 0) {
      // チャンク処理（大量データ対応、Supabaseのデフォルトlimit:1000を考慮）
      const chunkSize = 500;
      for (let i = 0; i < propertiesToInsert.length; i += chunkSize) {
        const chunk = propertiesToInsert.slice(i, i + chunkSize);
        
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
    }
    
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

