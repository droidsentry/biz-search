// import { GoogleCustomSearchOwnerFormProvider } from "@/components/providers/google-custom-search-owner-form";
// import { getSearchPatterns } from "../search/execute/components/action";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // パターン一覧を取得
  // const patterns = await getSearchPatterns();

  return (
    // <GoogleCustomSearchOwnerFormProvider
    //   patterns={patterns}
    // >
      <>{children}</>
    // </GoogleCustomSearchOwnerFormProvider>
  );
}
