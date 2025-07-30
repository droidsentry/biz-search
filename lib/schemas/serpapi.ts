import { z } from 'zod';

export const matchTypeSchema = z.enum(["exact", "partial"]);

export const keywordsSchema = z.object({
  value: z.string(),
  matchType: matchTypeSchema,
});

// フォーム用のスキーマ（URLパラメータとは別に定義）
export const searchFormSchema = z.object({
  additionalKeywords: z.array(keywordsSchema),
  ownerName: z.string(),
  ownerNameMatchType: matchTypeSchema,
  ownerAddress: z.string(),
  ownerAddressMatchType: matchTypeSchema,
  searchSites: z.array(z.string()),
  siteSearchMode: z.enum(["any", "specific", "exclude"]),
  isAdvancedSearchEnabled: z.boolean(),
  period: z.enum(['all', 'last_6_months', 'last_year', 'last_3_years', 'last_5_years', 'last_10_years']),
});

export type SearchFormData = z.infer<typeof searchFormSchema>;

export const searchParamsSchema = z.object({
  searchForm: searchFormSchema,
  page: z.number().optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

