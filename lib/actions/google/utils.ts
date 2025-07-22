import { GoogleCustomSearchPattern, GoogleSearchRequestParams } from "@/lib/types/custom-search";

/**
 * キーワードを検索クエリ用にフォーマットする
 * @param value キーワード文字列
 * @param matchType マッチタイプ（完全一致/部分一致）
 * @returns フォーマット済みのキーワード文字列
 */
const formatKeyword = (value: string, matchType: 'exact' | 'partial'): string => {
  return matchType === 'exact' ? `"${value}"` : value;
};

/**
 * 複数サイトの検索クエリを構築する
 * @param sites サイトのリスト
 * @param mode 検索モード
 * @returns サイト検索用のクエリ文字列
 */
const buildMultipleSiteQuery = (sites: string[], mode: 'specific' | 'exclude'): string => {
  if (mode === 'specific') {
    // OR検索の場合は括弧で囲む
    return `(${sites.map(site => `site:${site}`).join(' OR ')})`;
  } else {
    // 除外の場合は各サイトに-を付ける
    return sites.map(site => `-site:${site}`).join(' ');
  }
};

/**
 * Google Custom Search APIのパラメータを生成する
 * @param parsedData 検索パターンデータ
 * @param start ページネーション用の開始位置
 * @returns Google検索APIパラメータ
 */
export const generateGoogleCustomSearchParams = (parsedData: GoogleCustomSearchPattern, start: number = 1): GoogleSearchRequestParams => {
  const MAX_RESULTS = 10;
  const { googleCustomSearchParams } = parsedData;
  const { 
    customerName, customerNameExactMatch,
    address, addressExactMatch,
    dateRestrict,
    isAdvancedSearchEnabled,
    additionalKeywords,
    searchSites, siteSearchMode
  } = googleCustomSearchParams;

  // ========================================
  // 基本検索クエリの構築（常に実行）
  // ========================================
  const queryParts: string[] = [];
  
  // 顧客名（必須）
  queryParts.push(formatKeyword(customerName, customerNameExactMatch));
  
  // 住所（オプション）
  if (address && address.trim()) {
    queryParts.push(formatKeyword(address.trim(), addressExactMatch));
  }

  // 基本のGoogle検索パラメータを作成
  const googleSearchParams: GoogleSearchRequestParams = {
    q: queryParts.join(' ').trim(),
    cx: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID!,
    num: MAX_RESULTS,
    start: start,
  };

  // 検索期間の設定
  if (dateRestrict && dateRestrict !== "all") {
    googleSearchParams.dateRestrict = dateRestrict;
  }

  // ========================================
  // 高度な検索オプション（トグルON時のみ実行）
  // ========================================
  if (isAdvancedSearchEnabled) {
    // 追加キーワードの処理（常にOR検索）
    if (additionalKeywords && additionalKeywords.length > 0) {
      // OR検索: orTermsパラメータを使用
      const orKeywords = additionalKeywords
        .filter(keyword => keyword.value && keyword.value.trim()) // 空の値を除外
        .map(keyword => formatKeyword(keyword.value.trim(), keyword.matchType))
        .join("|");
      
      if (orKeywords) {
        googleSearchParams.orTerms = orKeywords;
      }
    }

    // サイト検索の処理
    if (searchSites && searchSites.length > 0 && siteSearchMode !== 'any') {
      // 空のサイトを除外
      const validSites = searchSites.filter(site => site && site.trim());
      
      if (validSites.length > 0) {
        if (validSites.length === 1) {
          // 単一サイト: API パラメータを使用
          googleSearchParams.siteSearch = validSites[0].trim();
          googleSearchParams.siteSearchFilter = siteSearchMode === 'specific' ? 'i' : 'e';
        } else {
          // 複数サイト: クエリに追加
          const siteQuery = buildMultipleSiteQuery(
            validSites.map(site => site.trim()), 
            siteSearchMode as 'specific' | 'exclude'
          );
          googleSearchParams.q = `${googleSearchParams.q} ${siteQuery}`.trim();
        }
      }
    }
  }

  // クエリの最終的なクリーンアップ（連続するスペースを単一のスペースに）
  googleSearchParams.q = googleSearchParams.q?.replace(/\s+/g, ' ').trim();

  return googleSearchParams;
}