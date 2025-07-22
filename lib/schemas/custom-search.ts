import { z } from "zod";

export const matchTypeSchema = z.enum(["exact", "partial"]);
export const keywordsSchema = z.object({
  value: z.string(),
  matchType: matchTypeSchema,
});

const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "1文字以上入力してください" })
  .max(256, { message: "256文字以内で入力してください" });

export const googleCustomSearchParamsSchema = z.object({
  customerName: nameSchema,
  customerNameExactMatch: matchTypeSchema,
  address: z.string().trim().optional(),
  addressExactMatch: matchTypeSchema,
  dateRestrict: z.enum(["all", "y1", "y3", "y5", "y10"]),
  isAdvancedSearchEnabled: z.boolean(),
  additionalKeywords: z.array(keywordsSchema),
  searchSites: z.array(z.string()),
  siteSearchMode: z.enum(["any", "specific", "exclude"]),
});

const searchPatternDescriptionSchema = z
  .string()
  .trim()
  .max(1000, { message: "1000文字以内で入力してください" })
  .optional();
export const googleCustomSearchPatternSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  searchPatternName: nameSchema,
  searchPatternDescription: searchPatternDescriptionSchema,
  googleCustomSearchParams: googleCustomSearchParamsSchema,
});
