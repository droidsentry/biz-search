import { createClient } from "@/lib/supabase/server";


export async function checkLimit() {
const supabase = await createClient();

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
}