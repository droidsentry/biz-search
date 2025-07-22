import { Header } from "@/components/layouts/header";
import { SubNavigation } from "@/components/layouts/sub-navigation";
import { Footer } from "@/components/layouts/footer";
// import { GoogleCustomSearchFormProvider } from "@/components/providers/google-custom-search-form";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string; ownerId: string; searchId: string }>;
}) {
  const { projectId, ownerId, searchId } = await params;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <SubNavigation />
        <main className="flex-1">
          {/* <GoogleCustomSearchFormProvider searchId={searchId}> */}
          {children}
          {/* </GoogleCustomSearchFormProvider> */}
        </main>
      </div>
      <Footer />
    </div>
  );
}
