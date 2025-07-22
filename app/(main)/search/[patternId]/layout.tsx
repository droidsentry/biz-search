import { GoogleCustomSearchFormProvider } from "@/components/providers/google-custom-search-form";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;
  // return <>{children}</>;
  return (
    <GoogleCustomSearchFormProvider patternId={patternId}>
      {children}
    </GoogleCustomSearchFormProvider>
  );
}
