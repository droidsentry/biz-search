import { z } from "zod";
import { prefectures } from "../data/prefectures";

export const matchTypeSchema = z.enum(['exact', 'partial']);
export const keywordsSchema = z.object({
  value: z.string(),
  matchType: matchTypeSchema,
})

const searchModeSchema = z.enum(['and', 'or']);

const nameSchema = z.string().trim()
  .min(1, { message: "1文字以上入力してください" })
  .max(256, { message: "256文字以内で入力してください" });

const googleCustomSearchParamsSchema = z.object({
  customerName: nameSchema,
  customerNameExactMatch: matchTypeSchema,
  prefecture: z.enum(prefectures),
  prefectureExactMatch: matchTypeSchema,
  address: z.string().trim().optional(),
  addressExactMatch: matchTypeSchema,
  isAdvancedSearchEnabled: z.boolean(),
  additionalKeywords: z.array(keywordsSchema),
  additionalKeywordsSearchMode: searchModeSchema,
  excludeKeywords: z.array(keywordsSchema),
  searchSites: z.array(z.string()),
  siteSearchMode: z.enum(['any', 'specific', 'exclude']),
});

const searchPatternDescriptionSchema = z.string().trim().max(1000, { message: "1000文字以内で入力してください" }).optional();
export const googleCustomSearchPatternSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  searchPatternName: nameSchema,
  searchPatternDescription: searchPatternDescriptionSchema,
  googleCustomSearchParams: googleCustomSearchParamsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  lastUsedAt: z.string(),
});
