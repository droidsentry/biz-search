import { GoogleCustomSearchFormProvider } from "@/components/providers/google-custom-search-form";

export default async function Layout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: Promise<{ patternId: string }>;
}) {
  // const { patternId } = await searchParams;

  return <>{children}</>;
  // return (
  //   <GoogleCustomSearchFormProvider patternId={patternId}>
  //     {children}
  //   </GoogleCustomSearchFormProvider>
  // );
}
