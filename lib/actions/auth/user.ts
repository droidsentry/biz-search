"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export const isUserNameUnique = async (userName: string) => {
  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("username", userName)
    .single();
  return !data;
};