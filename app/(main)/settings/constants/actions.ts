'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AppSettingValue } from '@/lib/types/app-settings';
import type { Json } from '@/lib/types/database';

/**
 * アプリケーション設定を更新する（システムオーナーのみ）
 */
export async function updateAppSetting(key: string, value: AppSettingValue, description?: string) {
  const supabase = await createClient();
  
  // システムオーナーチェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '認証が必要です' };
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (!profile || profile.role !== 'system_owner') {
    return { success: false, error: '権限がありません' };
  }
  
  const { data, error } = await supabase
    .from('app_settings')
    .update({ 
      value: value as Json,
      description,
      updated_at: new Date().toISOString()
    })
    .eq('key', key)
    .select()
    .single();
  
  if (error) {
    console.error(`Failed to update app setting for key: ${key}`, error);
    return { success: false, error: error.message };
  }
  
  // 設定画面のパスを再検証
  revalidatePath('/settings/constants');
  // 設定を使用している可能性のある他のパスも再検証
  revalidatePath('/', 'layout');
  
  return { success: true, data };
}