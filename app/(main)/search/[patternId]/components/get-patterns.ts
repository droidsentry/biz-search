import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/lib/types/database';

type SearchPattern = Tables<'search_patterns'>;

export async function getPatterns(): Promise<SearchPattern[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('search_patterns')
    .select('*')
    .eq('user_id', user.id)
    .order('last_used_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('パターン取得エラー:', error);
    return [];
  }

  return data || [];
}