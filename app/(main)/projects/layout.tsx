import { GoogleCustomSearchFormProvider } from "../../../components/providers/google-custom-search-form";
import { getSearchPatterns } from "../search/execute/components/action";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // パターン一覧を取得
  const patterns = await getSearchPatterns();

  return (
    <GoogleCustomSearchFormProvider
      patterns={patterns}
      selectedSearchPattern={undefined}
    >
      {children}
    </GoogleCustomSearchFormProvider>
  );
}
