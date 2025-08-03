'use server'

import { SearchParams, searchParamsSchema } from "@/lib/schemas/serpapi"
import { SerpApiSearch } from "@/lib/serpapi"

/**
 * 検索パラメータを生成
 * @param params 検索パラメータ
 * @returns 検索パラメータ
 */
const generateSearchParams = (params: SearchParams) => {
  const { searchForm, page } = params
  const {
    ownerName,
    ownerNameMatchType,
    ownerAddress,
    ownerAddressMatchType,
    additionalKeywords,
    searchSites,
    siteSearchMode,
    period,
  } = searchForm

  // クエリの構築
  const queryParts: string[] = []

  // 所有者名の処理
  if (ownerName.trim()) {
    if (ownerNameMatchType === 'exact') {
      queryParts.push(`"${ownerName.trim()}"`)
    } else {
      queryParts.push(ownerName.trim())
    }
  }

  // 所有者住所の処理
  if (ownerAddress?.trim()) {
    if (ownerAddressMatchType === 'exact') {
      queryParts.push(`"${ownerAddress.trim()}"`)
    } else {
      queryParts.push(ownerAddress.trim())
    }
  }

  // 追加キーワードの処理
  additionalKeywords.forEach(keyword => {
    if (keyword.value.trim()) {
      if (keyword.matchType === 'exact') {
        queryParts.push(`"${keyword.value.trim()}"`)
      } else {
        queryParts.push(keyword.value.trim())
      }
    }
  })

  // サイトフィルタリングの処理
  if (searchSites.length > 0 && siteSearchMode !== 'any') {
    if (siteSearchMode === 'specific') {
      // 複数サイトをOR検索
      const siteQuery = searchSites.map(site => `site:${site}`).join(' OR ')
      queryParts.push(`(${siteQuery})`)
    } else if (siteSearchMode === 'exclude') {
      // サイトを除外
      searchSites.forEach(site => {
        queryParts.push(`-site:${site}`)
      })
    }
  }

  // クエリを結合（AND検索）
  const query = queryParts.join(' ')


  // 追加パラメータの構築
  const searchParams: {
    q: string;
    tbs?: string;
    start?: number;
  } = {
    q: query,
  }

  // 期間指定の処理
  if (period && period !== 'all') {
    const tbsMap: { [key: string]: string } = {
      'last_6_months': 'qdr:m6',
      'last_year': 'qdr:y',
      'last_3_years': 'qdr:y3',
      'last_5_years': 'qdr:y5',
      'last_10_years': 'qdr:y10',
    }
    searchParams.tbs = tbsMap[period]
  }

  // ページネーションの処理
  if (page && page > 1) {
    searchParams.start = (page - 1) * 10
  }

  return searchParams
}

export async function searchWithParams(params: SearchParams) {
  const parsedParams = searchParamsSchema.safeParse(params)
  if (!parsedParams.success) {
    console.error(parsedParams.error.message)
    throw new Error(parsedParams.error.message)
  }

  // paramsからパラメータを生成
  const searchQuery = generateSearchParams(parsedParams.data)
  

  try {
    const searchResult = await SerpApiSearch(searchQuery)
    return searchResult
  } catch (error) {
    // SerpApiErrorの場合はユーザーフレンドリーなメッセージがすでに設定されている
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('検索中にエラーが発生しました');
  }
}