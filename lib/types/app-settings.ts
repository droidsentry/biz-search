// Supabase型生成が正しく行われていない場合のフォールバック型定義
// import { Tables } from '@/lib/types/database';
// アプリケーション設定の値の型
export type AppSettingValue = SearchFormDefaults | GoogleCustomSearchPattern | Record<string, unknown>;

export interface AppSettings {
  id: string;
  key: string;
  value: AppSettingValue;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// 型生成が修正されたら以下を使用
// export type AppSettings = Tables<'app_settings'>;

export interface SearchFormDefaults {
  ownerName: string;
  ownerNameMatchType: "exact" | "partial";
  ownerAddress: string;
  ownerAddressMatchType: "exact" | "partial";
  period: "all" | "last_6_months" | "last_year" | "last_3_years" | "last_5_years" | "last_10_years";
  isAdvancedSearchEnabled: boolean;
  additionalKeywords: Array<{
    value: string;
    matchType: "exact" | "partial";
  }>;
  searchSites: string[];
  siteSearchMode: "any" | "specific" | "exclude";
}

export interface GoogleCustomSearchPattern {
  id?: string;
  userId?: string;
  searchPatternName: string;
  searchPatternDescription: string;
  googleCustomSearchParams: {
    customerName: string;
    customerNameExactMatch: "exact" | "partial";
    address: string;
    addressExactMatch: "exact" | "partial";
    dateRestrict: string;
    isAdvancedSearchEnabled: boolean;
    additionalKeywords: Array<{
      value: string;
      matchType: "exact" | "partial";
    }>;
    searchSites: string[];
    siteSearchMode: "any" | "specific" | "exclude";
  };
}