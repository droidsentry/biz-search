import { GoogleCustomSearchPattern } from "../types/custom-search";

export const DEFAULT_GOOGLE_CUSTOM_SEARCH_PATTERN: GoogleCustomSearchPattern = {
  id: undefined,
  userId: undefined,
  searchPatternName: "新規検索パターン",
  searchPatternDescription: "",
  googleCustomSearchParams: {
    customerName: "",
    customerNameExactMatch: "exact",
    address: "",
    addressExactMatch: "partial",
    dateRestrict: "all",
    isAdvancedSearchEnabled: false,
    additionalKeywords: [
      {
        value: "代表取締役",
        matchType: "partial",
      },
    ],
    searchSites: ["facebook.com", "linkedin.com", "nikkei.com"],
    siteSearchMode: "any",
  },
};
