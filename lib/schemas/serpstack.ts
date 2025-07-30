import { z } from 'zod';

export const matchTypeSchema = z.enum(["exact", "partial"]);

export const keywordsSchema = z.object({
  value: z.string(),
  matchType: matchTypeSchema,
});

export const searchParamsSchema = z.object({
  q: z.string().min(1, '検索キーワードを入力してください').optional(),
  additionalKeywords: z.array(keywordsSchema).optional(),
  ownerName: z.string().optional(),
  ownerNameMatchType: matchTypeSchema.optional(),
  ownerAddress: z.string().optional(),
  ownerAddressMatchType: matchTypeSchema.optional(),
  searchSites: z.array(z.string()).optional(),
  siteSearchMode: z.enum(["any", "specific", "exclude"]).optional(),
  isAdvancedSearchEnabled: z.string().transform(val => val === 'true').optional(),
  count: z.coerce.number().min(1).max(20).optional(),
  offset: z.coerce.number().min(0).max(9).optional(),
  page: z.coerce.number().min(1).optional(),
  safeSearch: z.enum(['off', 'moderate', 'strict']).optional(),
  searchType: z.enum(['web', 'news', 'images']).optional(),
  domain: z.string().optional(),
  period: z.enum(['all', 'last_6_months', 'last_year', 'last_3_years', 'last_5_years', 'last_10_years']).optional(),
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
