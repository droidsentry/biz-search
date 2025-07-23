'use server'

import { googleCustomSearchParamsSchema } from '@/lib/schemas/custom-search';
import { createClient } from '@/lib/supabase/server';

export async function getSearchPatterns() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }
/**
 * const data: {
    created_at: string;
    description: string | null;
    google_custom_search_params: Json;
    id: string;
    last_used_at: string | null;
    name: string;
    updated_at: string;
    usage_count: number | null;
    user_id: string;
}[] | null
 */
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
      googleCustomSearchParams: googleCustomSearchParamsSchema.parse(pattern.googleCustomSearchParams),
    };
  });

  return parsedData
}