import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * アプリケーション設定を取得する
 */
export async function getAppSettings(key: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) {
    console.error(`Failed to fetch app setting for key: ${key}`, error);
    return null;
  }
  
  return data?.value || null;
}

/**
 * 検索フォームのデフォルト値を取得
 */
export async function getSearchFormDefaults() {
  const defaults = await getAppSettings('search_form_defaults');
  
  // フォールバック値（DBから取得できない場合）
  if (!defaults) {
    return {
      ownerName: "",
      ownerNameMatchType: "exact" as const,
      ownerAddress: "",
      ownerAddressMatchType: "partial" as const,
      period: "all" as const,
      isAdvancedSearchEnabled: false,
      additionalKeywords: [
        {
          value: "代表取締役",
          matchType: "exact" as const,
        }
      ],
      searchSites: ["facebook.com", "linkedin.com", "nikkei.com"],
      siteSearchMode: "any" as const,
    };
  }
  
  return defaults;
}

/**
 * Google Custom Searchパターンを取得
 */
export async function getGoogleCustomSearchPattern() {
  const pattern = await getAppSettings('google_custom_search_pattern');
  
  // フォールバック値（DBから取得できない場合）
  if (!pattern) {
    return {
      id: undefined,
      userId: undefined,
      searchPatternName: "新規検索パターン",
      searchPatternDescription: "",
      googleCustomSearchParams: {
        customerName: "",
        customerNameExactMatch: "exact" as const,
        address: "",
        addressExactMatch: "partial" as const,
        dateRestrict: "all",
        isAdvancedSearchEnabled: false,
        additionalKeywords: [
          {
            value: "代表取締役",
            matchType: "partial" as const,
          }
        ],
        searchSites: ["facebook.com", "linkedin.com", "nikkei.com"],
        siteSearchMode: "any" as const,
      },
    };
  }
  
  return pattern;
}

