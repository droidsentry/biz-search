import "server-only";

import { Database } from "@/lib/types/database";
import { createClient } from "@supabase/supabase-js";

/**
 * 管理者クライアントを作成
 * @returns 管理者クライアント
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}