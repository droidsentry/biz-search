import { SearchFormData } from "../schemas/serpstack";

// デフォルト値
export const DEFAULT_SEARCH_FORM_VALUES: SearchFormData = {
  ownerName: "",
  ownerNameMatchType: "exact",
  ownerAddress: "",
  ownerAddressMatchType: "partial",
  period: "all",
  isAdvancedSearchEnabled: false,
  additionalKeywords: [
    {
      value: "代表取締役",
      matchType: "exact",
    },
  ],
  searchSites: ["facebook.com", "linkedin.com", "nikkei.com"],
  siteSearchMode: "any",
};
