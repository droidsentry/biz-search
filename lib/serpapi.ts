import 'server-only';

import { getJson } from "serpapi";
import { isSuccessfulResponse, parseSerpApiError, type SerpApiErrorResponse } from './serpapi-errors';
import { type SerpapiResponse } from './types/serpapi';
// import { checkLimit } from './check-limit';

interface SerpApiSearchParams {
  q: string;
  tbs?: string;
  start?: number;
  [key: string]: string | number | undefined;
}

export const SerpApiSearch = async (params: string | SerpApiSearchParams): Promise<SerpapiResponse> => {
  // デフォルトパラメータ
  const defaultParams = {
    engine: "google",
    api_key: process.env.SERPAPI_API_KEY,
    location: "Tokyo, Japan",
    hl: "ja",
    gl: "jp",
  };

  // パラメータの構築
  let searchParams;
  if (typeof params === 'string') {
    // 後方互換性のため、文字列の場合はqパラメータとして扱う
    searchParams = {
      ...defaultParams,
      q: params,
    };
  } else {
    // オブジェクトの場合はマージ
    searchParams = {
      ...defaultParams,
      ...params,
    };
  }

  try {

    // await checkLimit();
    const response = await getJson(searchParams);
    // const response = serpapiResponse;
    
    
    // エラーチェック
    if (response.error || !isSuccessfulResponse(response as SerpApiErrorResponse)) {
      // "Google hasn't returned any results"の場合は空の結果として返す
      if (response.error && response.error.toLowerCase().includes("google hasn't returned any results")) {
        return {
          search_metadata: response.search_metadata || {},
          search_parameters: response.search_parameters || {},
          search_information: {
            total_results: 0,
            query_displayed: searchParams.q,
            time_taken_displayed: 0,
            organic_results_state: "No results",
            results_for: "",
          },
          organic_results: [],
          pagination: {
            current: 1,
            next: "",
            other_pages: {
              "2": "",
              "3": "",
              "4": "",
              "5": "",
            },
          },
          serpapi_pagination: {
            current: 1,
            next_link: "",
            next: "",
            other_pages: {
              "2": "",
              "3": "",
              "4": "",
              "5": "",
            },
          },
        } as SerpapiResponse;
      }
      
      const error = parseSerpApiError(response as SerpApiErrorResponse);
      throw new Error(error.message);
    }

    return response as SerpapiResponse;
  } catch (error) {
    // getJson自体がエラーをスローした場合
    if (error instanceof Error && error.name === 'SerpApiError') {
      throw error;
    }
    
    // その他のエラー
    console.error('SerpAPI error:', error);
    throw new Error('検索APIの呼び出し中にエラーが発生しました');
  }
}

