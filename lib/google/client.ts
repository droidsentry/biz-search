import "server-only";

import { customsearch } from "@googleapis/customsearch";

/**
 * カスタム検索APIクライアントを作成する
 * @returns カスタム検索APIクライアント
 * @see https://github.com/googleapis/google-api-nodejs-client/tree/main/src/apis/customsearch
 * @see https://googleapis.dev/nodejs/googleapis/latest/customsearch/classes/Resource$Cse.html
 */
const customSearch = customsearch({
  version: "v1",
  auth: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
});

export async function createGoogleSearchClient() {
  return customSearch;
}