import { GoogleCustomSearchFormProvider } from "@/components/providers/google-custom-search-form";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ searchId: string }>
}) {
  const { searchId } = await params;
  return <GoogleCustomSearchFormProvider searchId={searchId}>{children}</GoogleCustomSearchFormProvider>;
}