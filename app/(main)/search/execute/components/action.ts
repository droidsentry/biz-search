'use server'

import { searchFormSchema } from '@/lib/schemas/serpapi';
import { createClient } from '@/lib/supabase/server';

export async function getSearchPatterns() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }
  const { data, error } = await supabase
    .from('search_patterns')
    .select(`
      id,
      searchPatternName:name,
      searchPatternDescription:description,
      googleCustomSearchParams:google_custom_search_params,
      usageCount:usage_count,
      createdAt:created_at,
      updatedAt:updated_at,
      lastUsedAt:last_used_at
      `)
    .eq('user_id', user.id)
    .order('last_used_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('パターン取得エラー:', error);
    return [];
  }

  const parsedData = data.map((pattern) => {
    return {
      ...pattern,
      googleCustomSearchParams: searchFormSchema.parse(pattern.googleCustomSearchParams),
    };
  });

  return parsedData
}