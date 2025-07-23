import { SearchLayout } from "./components/search-layout";
import { getSearchPatterns } from "./components/action";
import { redirect } from "next/navigation";
import { GoogleCustomSearchFormProvider } from "@/components/providers/google-custom-search-form";

export default async function SearchDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ patternId: string }>;
}) {
  const { patternId } = await searchParams;
  console.log("patternId", patternId);

  // パターン一覧を取得
  const patterns = await getSearchPatterns();
  // パターンが存在しない場合はリダイレクト
  const selectedSearchPattern = patterns.find(
    (pattern) => pattern.id === patternId
  );
  if (!selectedSearchPattern && patternId !== "new") {
    redirect("/search/patterns");
  }

  return (
    <GoogleCustomSearchFormProvider
      selectedSearchPattern={selectedSearchPattern}
      patterns={patterns}
    >
      <SearchLayout patterns={patterns} />
    </GoogleCustomSearchFormProvider>
  );
}
