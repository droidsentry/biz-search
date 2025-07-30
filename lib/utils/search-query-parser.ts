/**
 * 検索クエリを解析して、使用された検索パラメータを抽出する
 */
export function parseSearchQuery(query: string | undefined): {
  keywords: string[];
  exactMatches: string[];
  siteFilters: { include: string[]; exclude: string[] };
  rawQuery: string;
} {
  if (!query) {
    return {
      keywords: [],
      exactMatches: [],
      siteFilters: { include: [], exclude: [] },
      rawQuery: "",
    };
  }

  const result = {
    keywords: [] as string[],
    exactMatches: [] as string[],
    siteFilters: { include: [] as string[], exclude: [] as string[] },
    rawQuery: query,
  };

  // 完全一致の抽出（"..."で囲まれた部分）
  const exactMatchRegex = /"([^"]+)"/g;
  let match;
  while ((match = exactMatchRegex.exec(query)) !== null) {
    result.exactMatches.push(match[1]);
  }

  // サイトフィルタの抽出
  const siteIncludeRegex = /site:(\S+)/g;
  while ((match = siteIncludeRegex.exec(query)) !== null) {
    result.siteFilters.include.push(match[1]);
  }

  const siteExcludeRegex = /-site:(\S+)/g;
  while ((match = siteExcludeRegex.exec(query)) !== null) {
    result.siteFilters.exclude.push(match[1]);
  }

  // OR検索でまとめられたサイトフィルタの抽出
  const orSiteRegex = /\(((?:site:\S+\s*(?:OR\s+)?)+)\)/g;
  while ((match = orSiteRegex.exec(query)) !== null) {
    const sites = match[1].match(/site:(\S+)/g);
    if (sites) {
      sites.forEach((site) => {
        const siteName = site.replace("site:", "");
        if (!result.siteFilters.include.includes(siteName)) {
          result.siteFilters.include.push(siteName);
        }
      });
    }
  }

  // 通常のキーワードの抽出（完全一致、サイトフィルタを除く）
  let cleanedQuery = query;
  
  // 完全一致を除去
  cleanedQuery = cleanedQuery.replace(/"[^"]+"/g, "");
  
  // サイトフィルタを除去
  cleanedQuery = cleanedQuery.replace(/\((?:site:\S+\s*(?:OR\s+)?)+\)/g, "");
  cleanedQuery = cleanedQuery.replace(/-?site:\S+/g, "");
  
  // 残りのキーワードを抽出
  const keywords = cleanedQuery.trim().split(/\s+/).filter(k => k.length > 0);
  result.keywords = keywords;

  return result;
}

/**
 * 期間フィルタを日本語に変換
 */
export function formatPeriodFilter(tbs: string | undefined): string | null {
  if (!tbs) return null;

  const periodMap: { [key: string]: string } = {
    "qdr:m6": "過去6ヶ月",
    "qdr:y": "過去1年",
    "qdr:y3": "過去3年",
    "qdr:y5": "過去5年",
    "qdr:y10": "過去10年",
  };

  return periodMap[tbs] || null;
}