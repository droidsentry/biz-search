"use server";

import { createGoogleSearchClient } from "@/lib/google/client";
import { googleCustomSearchPatternSchema } from "@/lib/schemas/custom-search";
import { createClient } from "@/lib/supabase/server";
import {
  GoogleCustomSearchPattern,
  GoogleSearchRequestParams,
} from "@/lib/types/custom-search";
import { Json, TablesInsert } from "@/lib/types/database";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { generateGoogleCustomSearchParams } from "./utils";

export async function getCustomerInfoFromGoogleCustomSearch(
  formData: GoogleCustomSearchPattern
) {
  const supabase = await createClient();
  // 認証確認
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // グローバルAPI利用制限チェック
  const { data: limitCheck, error: limitCheckError } = await supabase.rpc(
    "check_global_api_limit",
    {
      p_api_name: "google_custom_search",
    }
  );

  if (limitCheckError) {
    console.error("API制限確認エラー:", limitCheckError);
    throw new Error("API制限の確認中にエラーが発生しました");
  }

  // RPCの戻り値をキャスト
  interface LimitCheckResult {
    allowed: boolean;
    daily_used: number;
    daily_limit: number;
    monthly_used: number;
    monthly_limit: number;
  }

  const limitResult = limitCheck as unknown as LimitCheckResult;

  if (!limitResult.allowed) {
    interface RateLimitError extends Error {
      rateLimitInfo?: LimitCheckResult;
    }
    const error: RateLimitError = new Error(
      `API制限に達しました。本日: ${limitResult.daily_used}/${limitResult.daily_limit}回、今月: ${limitResult.monthly_used}/${limitResult.monthly_limit}回`
    );
    error.rateLimitInfo = limitResult;
    throw error;
  }

  const startTime = Date.now();
  let statusCode = 200;
  let errorMessage: string | null = null;
  let resultCount = 0;
  // バリデーション
  const parsed = googleCustomSearchPatternSchema.safeParse(formData);
  if (!parsed.success) {
    console.log("フォームバリデーションエラー:", parsed.error);
    throw new Error("フォームバリデーションエラー");
  }
  const { projectId, patternId } = parsed.data;

  try {
    // パラメータ生成
    const googleCustomSearchParams = generateGoogleCustomSearchParams(
      parsed.data
    );

    const client = await createGoogleSearchClient();
    // console.log("googleCustomSearchParams", googleCustomSearchParams);
    const response = await client.cse.list(googleCustomSearchParams);
    // console.log("response", response);

    // 結果の件数を取得
    resultCount = response.data.items?.length || 0;

    // API使用履歴を記録（認証済みユーザーの全ての検索を記録）
    const apiResponseTime = Date.now() - startTime;

    // 非同期でログを記録（メインの処理をブロックしない）
    recordSearchApiLog({
      userId: user.id,
      projectId: projectId || null,
      patternId: patternId || null,
      googleCustomSearchParams: googleCustomSearchParams,
      apiResponseTime,
      resultCount,
      statusCode,
    }).catch((logError) => {
      console.error("APIログ記録エラー:", logError);
    });

    return {
      ...response.data,
      _rateLimitInfo: limitCheck, // レート制限情報を含める
    };
  } catch (error) {
    console.error("Search error:", error);

    // レート制限エラーの場合はそのまま再スロー
    if (error instanceof Error && "rateLimitInfo" in error) {
      throw error;
    }

    statusCode = 500;
    errorMessage =
      error instanceof Error ? error.message : "検索中にエラーが発生しました";

    // エラー時もログを記録
    const apiResponseTime = Date.now() - startTime;

    recordSearchApiLog({
      userId: user.id,
      projectId: projectId || null,
      patternId: patternId || null,
      googleCustomSearchParams: formData,
      apiResponseTime,
      resultCount,
      statusCode,
      errorMessage,
    }).catch((logError) => {
      console.error("APIログ記録エラー:", logError);
    });

    throw new Error("検索中にエラーが発生しました");
  }
}

// IPアドレスの基本的なバリデーション
function isValidIP(ip: string): boolean {
  // IPv4パターン
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6パターン（簡易版）
  const ipv6 = /^([\da-f]{0,4}:){2,7}[\da-f]{0,4}$/i;

  if (ipv4.test(ip)) {
    // IPv4の各オクテットが0-255の範囲内かチェック
    const parts = ip.split(".");
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6.test(ip);
}

// IPアドレス取得の改善
function getClientIP(headersList: Headers): string | null {
  // 優先順位順にヘッダーを確認
  const headersToCheck = [
    "x-real-ip",
    "x-forwarded-for",
    "x-client-ip",
    "cf-connecting-ip", // Cloudflare
    "x-forwarded",
    "forwarded-for",
    "forwarded",
  ];

  for (const header of headersToCheck) {
    const value = headersList.get(header);
    if (value) {
      // カンマ区切りの場合は最初のIPを取得
      const firstIP = value.split(",")[0].trim();

      // IPv6のループバックアドレスを除外
      if (firstIP && firstIP !== "::1" && firstIP !== "localhost") {
        // IPアドレスの形式をバリデーション
        if (isValidIP(firstIP)) {
          return firstIP;
        }
      }
    }
  }

  return null;
}

// API使用履歴の記録
async function recordSearchApiLog({
  userId,
  projectId,
  patternId,
  googleCustomSearchParams,
  apiResponseTime,
  resultCount,
  statusCode,
  errorMessage,
}: {
  userId: string;
  projectId: string | null;
  patternId: string | null;
  googleCustomSearchParams:
    | GoogleSearchRequestParams
    | GoogleCustomSearchPattern;
  apiResponseTime: number;
  resultCount: number;
  statusCode: number;
  errorMessage?: string | null;
}) {
  const supabase = await createClient();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  const ipAddress = getClientIP(headersList);

  // APIログのデータを準備
  const logData: TablesInsert<"search_api_logs"> = {
    user_id: userId,
    project_id: projectId || null,
    pattern_id: patternId,
    google_custom_search_params: googleCustomSearchParams as Json,
    api_response_time: apiResponseTime,
    result_count: resultCount,
    status_code: statusCode,
    error_message: errorMessage,
    ip_address: ipAddress,
    user_agent: userAgent,
  };

  // APIログの記録
  const { data, error } = await supabase
    .from("search_api_logs")
    .insert(logData)
    .select()
    .single();

  if (error) {
    console.error("APIログ記録エラー:", error);
    return { error: error.message };
  }

  if (process.env.NODE_ENV === "development") {
    // console.log("APIログ記録成功:", data);
    // console.log("APIログ記録成功:", data);
    // console.log("APIログ記録成功:");
  }

  return { success: true, data };
}
