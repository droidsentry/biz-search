'use server'

import { createGoogleSearchClient } from "@/lib/google/client"
import { googleCustomSearchPatternSchema } from "@/lib/schemas/custom-search";
import { GoogleCustomSearchPattern } from "@/lib/types/custom-search";
import { generateGoogleCustomSearchParams } from "./utils";


export async function getCustomerInfoFromGoogleCustomSearch(formData: GoogleCustomSearchPattern, start: number = 1) {
  try {
  // バリデーション
  const parsed = googleCustomSearchPatternSchema.safeParse(formData);
  if (!parsed.success) {
    console.log("Invalid form data", parsed.error);
    throw new Error("Invalid form data");
  }
  // パラメータ生成
  const googleCustomSearchParams = generateGoogleCustomSearchParams(parsed.data, start);

  const client = await createGoogleSearchClient()
  const response = await client.cse.list(googleCustomSearchParams)
  
  return response.data

} catch (error) {
  console.error("Search error:", error);
  throw new Error("検索中にエラーが発生しました");
}
}