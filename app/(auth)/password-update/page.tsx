import { createClient } from "@/lib/supabase/server";
import PasswordUpdateForm from "./form";

export default async function Page() {

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PasswordUpdateForm user={user}/>
  );
}