import 'server-only';

import { getSearchFormDefaults, getGoogleCustomSearchPattern } from '@/lib/actions/app-settings';
import { DEFAULT_SEARCH_FORM_VALUES } from '@/lib/constants/search-form-defaults';
import { DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN } from '@/lib/constants/google-custom-search';
import type { SearchFormData } from '@/lib/schemas/serpstack';
import type { GoogleCustomSearchPattern } from '@/lib/types/custom-search';

/**
 * サーバーコンポーネントで使用する検索フォームのデフォルト値を取得
 */
export async function getDefaultSearchFormValues(): Promise<SearchFormData> {
  try {
    const dbValues = await getSearchFormDefaults();
    return dbValues as SearchFormData;
  } catch (error) {
    console.error("Failed to fetch search form defaults from DB:", error);
    return DEFAULT_SEARCH_FORM_VALUES;
  }
}

/**
 * サーバーコンポーネントで使用するGoogle Custom Searchパターンを取得
 */
export async function getDefaultGoogleCustomSearchPattern(): Promise<GoogleCustomSearchPattern> {
  try {
    const dbPattern = await getGoogleCustomSearchPattern();
    return dbPattern as GoogleCustomSearchPattern;
  } catch (error) {
    console.error("Failed to fetch Google custom search pattern from DB:", error);
    return DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN;
  }
}