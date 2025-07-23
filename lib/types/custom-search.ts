import { customsearch_v1 } from "@googleapis/customsearch";
import z from "zod";
import { googleCustomSearchPatternSchema, keywordsSchema, matchTypeSchema } from "../schemas/custom-search";
import { getSearchPatterns } from "@/app/(main)/search/execute/components/action";

// type GoogleSearchResult = customsearch_v1.Schema$Result;
export type GoogleSearchRequestResponse = customsearch_v1.Schema$Search;


// Search Parameters for API
/**
 * カスタム検索APIのパラメータ。
 * @see https://developers.google.com/custom-search/v1/cse?hl=ja#method_search.cse.list
 * @see https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list?hl=ja
 * 
 */
export type GoogleSearchRequestParams = customsearch_v1.Params$Resource$Cse$List;
export type GoogleCustomSearchPattern = z.infer<typeof googleCustomSearchPatternSchema>;
export type MatchType = z.infer<typeof matchTypeSchema>;
export type Keywords = z.infer<typeof keywordsSchema>;

export type SearchPattern = Awaited<
  ReturnType<typeof getSearchPatterns>
>[number];


