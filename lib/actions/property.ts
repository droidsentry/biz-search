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
      console.error('プロジェクト作成エラー:', projectError);
      return { error: 'プロジェクトの作成に失敗しました' };
    }
    
    return { success: true, data: project };
  } catch (error) {
    console.error('プロジェクト作成エラー:', error);
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
    // トランザクション的な処理
    for (let i = 0; i < result.data.properties.length; i++) {
      const property = result.data.properties[i];
      
      try {
        // 所有者の登録または取得
        let ownerId: string | null = null;
        
        // 既存の所有者をチェック
        const { data: existingOwner } = await supabase
          .from('owners')
          .select('id')
          .eq('name', property.ownerName)
          .eq('address', property.ownerAddress)
          .maybeSingle();
        
        if (existingOwner) {
          ownerId = existingOwner.id;
        } else {
          // 新規所有者を作成
          const { data: newOwner, error: ownerError } = await supabase
            .from('owners')
            .insert({
              name: property.ownerName,
              address: property.ownerAddress,
            })
            .select()
            .single();
          
          if (ownerError) {
            throw new Error('所有者の登録に失敗しました');
          }
          
          ownerId = newOwner.id;
        }
        
        // 物件情報の登録
        const { error: propertyError } = await supabase
          .from('properties')
          .insert({
            project_id: result.data.projectId,
            property_address: property.propertyAddress,
            owner_id: ownerId,
            source_file_name: property.sourceFileName,
            lat: property.lat,
            lng: property.lng,
            street_view_available: property.streetViewAvailable,
            imported_by: user.id,
          });
        
        if (propertyError) {
          // 重複エラーの場合は特別なメッセージ
          if (propertyError.code === '23505') {
            throw new Error('この物件は既に登録されています');
          }
          throw new Error('物件の登録に失敗しました');
        }
        
        savedCount++;
      } catch (error) {
        errors?.push({
          index: i,
          propertyAddress: property.propertyAddress,
          error: error instanceof Error ? error.message : '不明なエラー',
        });
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
      savedCount: 0,
      errors: [{ 
        index: -1, 
        propertyAddress: '', 
        error: '予期せぬエラーが発生しました' 
      }],
    };
  }
}

