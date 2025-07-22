"use server";

import { createGoogleSearchClient } from "@/lib/google/client";
import { googleCustomSearchPatternSchema } from "@/lib/schemas/custom-search";
import { GoogleCustomSearchPattern } from "@/lib/types/custom-search";
import { generateGoogleCustomSearchParams } from "./utils";
import { recordSearchApiLog } from "@/app/(main)/search/[searchId]/action";

interface SearchOptions {
  projectId?: string;
  patternId?: string;
}

export async function getCustomerInfoFromGoogleCustomSearch(
  formData: GoogleCustomSearchPattern,
  start: number = 1,
  options?: SearchOptions
) {
  console.log("発火", new Date().toISOString());
  console.log("formData", formData);
  const startTime = Date.now();
  let statusCode = 200;
  let errorMessage: string | null = null;
  let resultCount = 0;

  try {
    // バリデーション
    const parsed = googleCustomSearchPatternSchema.safeParse(formData);
    if (!parsed.success) {
      console.log("Invalid form data", parsed.error);
      throw new Error("Invalid form data");
    }
    // パラメータ生成
    const googleCustomSearchParams = generateGoogleCustomSearchParams(
      parsed.data,
      start
    );

    const client = await createGoogleSearchClient();
    const response = await client.cse.list(googleCustomSearchParams);

    // 結果の件数を取得
    resultCount = response.data.items?.length || 0;

    // API使用履歴を記録（projectIdが指定されている場合のみ）
    if (options?.projectId) {
      const apiResponseTime = Date.now() - startTime;

      // 非同期でログを記録（メインの処理をブロックしない）
      recordSearchApiLog(
        options.projectId,
        options.patternId || null,
        parsed.data,
        apiResponseTime,
        resultCount,
        statusCode,
        errorMessage
      ).catch((logError) => {
        console.error("APIログ記録エラー:", logError);
      });
    }

    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    statusCode = 500;
    errorMessage =
      error instanceof Error ? error.message : "検索中にエラーが発生しました";

    // エラー時もログを記録
    if (options?.projectId) {
      const apiResponseTime = Date.now() - startTime;

      recordSearchApiLog(
        options.projectId,
        options.patternId || null,
        formData,
        apiResponseTime,
        0,
        statusCode,
        errorMessage
      ).catch((logError) => {
        console.error("APIログ記録エラー:", logError);
      });
    }

    throw new Error("検索中にエラーが発生しました");
  }
}
