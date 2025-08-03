import 'server-only';

import { defaultSearchFormSchema } from '@/lib/schemas/serpapi';
import { createClient } from './supabase/server';


/**
 * 検索フォームのデフォルト値を取得
 */
export async function getSearchFormDefaults() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', "search_form_defaults")
    .single();
  
  if (error) {
    console.error(`Failed to fetch app setting for key: search_form_defaults`, error);
    throw new Error("Failed to fetch app setting for key: search_form_defaults");
  }
  const parsed = defaultSearchFormSchema.parse(data.value);
  
  return parsed;
}
