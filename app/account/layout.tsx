import { createClient } from "@/lib/supabase/server";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { SubNavigation } from "./components/sub-navigation";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <SubNavigation />
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
