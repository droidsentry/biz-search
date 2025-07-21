import { GoogleCustomSearchPattern } from "../types/custom-search";


export const DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN: GoogleCustomSearchPattern = {
  id: undefined,
  userId: undefined,
  searchPatternName: "新規検索パターン",
  searchPatternDescription: "",
  googleCustomSearchParams: {
    customerName: "", //薮田大地
    customerNameExactMatch: "exact",
    prefecture: "選択しない",
    prefectureExactMatch: "exact",
    address: "",
    addressExactMatch: "exact",
    isAdvancedSearchEnabled: false,
    additionalKeywords: [
      {
        value: "代表取締役",
        matchType: "exact",
      },
      {
        value: "社長",
        matchType: "exact",
      },
      {
        value: "専務",
        matchType: "exact",
      },
    ],
    additionalKeywordsSearchMode: "and",
    excludeKeywords: [{
      value: "東京都",
      matchType: "exact",
    },],
    searchSites: ["facebook.com", "linkedin.com", "nikkei.com"],
    siteSearchMode: "any",
  },
  createdAt: "",
  updatedAt: "",
  lastUsedAt: "",
};