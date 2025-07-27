import { Footer } from "@/components/layouts/footer";
import { Header } from "@/components/layouts/header";
import { SubNavigation } from "@/components/layouts/sub-navigation";
import { createClient } from "@/lib/supabase/server";
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

  const navItems = [
    { href: "/dashboard", label: "ダッシュボードへもどる" },
    { href: "/account/settings", label: "設定" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <SubNavigation navItems={navItems} />
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
