import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getApiLogs() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 最近のAPIログを取得
  const { data: apiLogs } = await supabase
    .from("search_api_logs")
    .select(
      `
        id,
        created_at,
        status_code,
        result_count,
        error_message,
        api_response_time,
        google_custom_search_params,
        pattern:search_patterns (
          id,
          name
        ),
        project:projects (
          id,
          name
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return apiLogs;
}
