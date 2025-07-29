import type { Keywords, SearchParams } from '@/lib/types/serpstack'

/**
 * 期間フィルターからSerpstack API用のパラメータを生成
 */
export function generatePeriodParams(period: string | undefined) {
  if (!period || period === 'all') {
    return {}
  }

  const now = new Date()
  const startDate = new Date()
  
  switch (period) {
    case 'last_6_months':
      startDate.setMonth(now.getMonth() - 6)
      break
    case 'last_year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    case 'last_3_years':
      startDate.setFullYear(now.getFullYear() - 3)
      break
    case 'last_5_years':
      startDate.setFullYear(now.getFullYear() - 5)
      break
    case 'last_10_years':
      startDate.setFullYear(now.getFullYear() - 10)
      break
    default:
      return {}
  }
  
  return {
    period: 'custom' as const,
    period_start: startDate.toISOString().split('T')[0],
    period_end: now.toISOString().split('T')[0],
  }
}

/**
 * ドメインフィルターを検索クエリに追加
 */
export function generateSearchQuery(
  keywords: Keywords[], 
  searchSites?: string[], 
  siteSearchMode?: 'any' | 'specific' | 'exclude',
  ownerName?: string, 
  ownerNameMatchType?: 'exact' | 'partial',
  ownerAddress?: string,
  ownerAddressMatchType?: 'exact' | 'partial'
) {
  // キーワードを検索クエリに変換
  const keywordParts = keywords.map(keyword => {
    if (keyword.matchType === 'exact') {
      return `"${keyword.value}"`
    } else {
      return keyword.value
    }
  })
  
  let searchQuery = keywordParts.join(' ')
  
  // 所有者名が指定されている場合は検索クエリに追加
  if (ownerName) {
    if (ownerNameMatchType === 'exact') {
      searchQuery = `${searchQuery} "${ownerName}"`
    } else {
      searchQuery = `${searchQuery} ${ownerName}`
    }
  }
  
  // 所有者住所が指定されている場合は検索クエリに追加
  if (ownerAddress) {
    if (ownerAddressMatchType === 'exact') {
      searchQuery = `${searchQuery} "${ownerAddress}"`
    } else {
      searchQuery = `${searchQuery} ${ownerAddress}`
    }
  }
  
  // サイト検索モードに応じてドメインフィルターを追加
  if (searchSites && searchSites.length > 0 && siteSearchMode && siteSearchMode !== 'any') {
    if (siteSearchMode === 'specific') {
      // 指定サイトのみ
      const siteQueries = searchSites.map(site => `site:${site}`).join(' OR ')
      searchQuery = `${searchQuery} (${siteQueries})`
    } else if (siteSearchMode === 'exclude') {
      // 指定サイト除外
      const excludeQueries = searchSites.map(site => `-site:${site}`).join(' ')
      searchQuery = `${searchQuery} ${excludeQueries}`
    }
  }
  
  return searchQuery.trim()
}

/**
 * フォームデータからSerpstack API用のパラメータを生成
 */
export function generateSearchParams(params: SearchParams) {
  const { additionalKeywords, ownerName, ownerNameMatchType, ownerAddress, ownerAddressMatchType, searchSites, siteSearchMode, count, page, safeSearch, period } = params

  const keywords = additionalKeywords || []

  // 検索キーワード、所有者名、所有者住所のいずれかが必要
  if (keywords.length === 0 && !ownerName && !ownerAddress) {
    throw new Error('検索キーワード、所有者名、または所有者住所を入力してください')
  }

  // ドメイン絞り込み、所有者名、所有者住所を検索クエリに追加
  const searchQuery = generateSearchQuery(
    keywords, 
    searchSites, 
    siteSearchMode,
    ownerName, 
    ownerNameMatchType,
    ownerAddress,
    ownerAddressMatchType
  )

  // 期間フィルターの設定
  const periodParams = generatePeriodParams(period)

  // Serpstack API用のパラメータ
  const apiParams = {
    num: count || 20, // 検索結果の最大件数
    page: page || 1,  // 検索結果のページ番号
    safe: (safeSearch === 'strict' ? 1 : 0) ,
    ...periodParams,
  } as const

  return {
    searchQuery,
    apiParams,
  }
}