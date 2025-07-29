'use server'

import { getSerpstackClient, type SerpstackResponse } from '@/lib/serpstack'
import { generateSearchParams } from '@/lib/utils/serpstack-params'
import type { Keywords } from '@/lib/types/serpstack'
import { searchParamsSchema } from '@/lib/schemas/serpstack'

type ParsedParams = {
  additionalKeywords?: Keywords[]
  searchSites?: string[]
  [key: string]: string | string[] | Keywords[] | undefined
}

function parseArrayParams(params: Record<string, string | string[] | undefined>): ParsedParams {
  const result: ParsedParams = {}
  
  // additionalKeywords[0][value]=代表取締役&additionalKeywords[0][matchType]=exact の形式を解析
  const additionalKeywords: Keywords[] = []
  let index = 0
  
  while (true) {
    const valueKey = `additionalKeywords[${index}][value]`
    const matchTypeKey = `additionalKeywords[${index}][matchType]`
    
    const value = params[valueKey] as string | undefined
    const matchType = params[matchTypeKey] as string | undefined
    
    if (!value) break
    
    additionalKeywords.push({
      value,
      matchType: (matchType as 'exact' | 'partial') || 'partial'
    })
    index++
  }
  
  if (additionalKeywords.length > 0) {
    result.additionalKeywords = additionalKeywords
  }
  
  // searchSites[0]=example.com の形式を解析
  const searchSites: string[] = []
  let siteIndex = 0
  
  while (true) {
    const siteKey = `searchSites[${siteIndex}]`
    const site = params[siteKey] as string | undefined
    
    if (!site) break
    
    searchSites.push(site)
    siteIndex++
  }
  
  if (searchSites.length > 0) {
    result.searchSites = searchSites
  }
  
  // その他のパラメータをコピー
  for (const [key, value] of Object.entries(params)) {
    if (!key.startsWith('additionalKeywords[') && !key.startsWith('searchSites[')) {
      result[key] = value
    }
  }
  
  return result
}

export async function searchWithParams(params: Record<string, string | string[] | undefined>): Promise<SerpstackResponse> {
  const parsedParams = parseArrayParams(params)
  const result = searchParamsSchema.safeParse(parsedParams)

  if (!result.success) {
    throw new Error('検索パラメータが不正です')
  }

  // フォームデータからパラメータを生成
  const { searchQuery, apiParams } = generateSearchParams(result.data)

  const serpstack = getSerpstackClient()
  const searchResult = await serpstack.search(searchQuery, apiParams)
  console.log("total_results", searchResult.search_information?.total_results)
  return searchResult
}