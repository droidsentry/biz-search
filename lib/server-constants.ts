import 'server-only';

import { defaultSearchFormSchema, type DefaultSearchFormData } from '@/lib/schemas/serpapi';
import { createClient } from './supabase/server';


/**
 * 検索フォームのデフォルト値を取得
 */
export async function getSearchFormDefaults() {
  // デフォルト値を定義
  const fallbackDefaults: DefaultSearchFormData = {
    ownerName: "",
    ownerNameMatchType: "partial",
    ownerAddress: "",
    ownerAddressMatchType: "partial",
    additionalKeywords: [],
    searchSites: [],
    siteSearchMode: "any",
    isAdvancedSearchEnabled: false,
    period: "all",
  };

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', "search_form_defaults")
      .single();
    
    if (error) {
      console.error(`Failed to fetch app setting for key: search_form_defaults`, error);
      console.error('Using fallback defaults');
      return fallbackDefaults;
    }
    
    if (!data || !data.value) {
      console.error(`No data found for key: search_form_defaults`);
      console.error('Using fallback defaults');
      return fallbackDefaults;
    }
    
    // console.log('Raw app_settings value:', JSON.stringify(data.value, null, 2));
    
    try {
      const parsed = defaultSearchFormSchema.parse(data.value);
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse search_form_defaults:', parseError);
      console.error('Raw value:', data.value);
      console.error('Using fallback defaults');
      return fallbackDefaults;
    }
  } catch (error) {
    console.error('Unexpected error in getSearchFormDefaults:', error);
    console.error('Using fallback defaults');
    return fallbackDefaults;
  }
}
