import { Metadata } from "next";

import { getBaseURL } from "@/lib/base-url";
import { getSearchFormDefaults } from "@/lib/server-constants";

import { getSearchPatterns } from "./components/action";
import { SearchLayout } from "./components/search-layout";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "検索実行 - BizSearch",
  description:
    "高度な検索条件を組み合わせてビジネス情報を検索します。保存された検索パターンを使用して効率的に情報を収集できます。",
};

export default async function SearchDetailPage() {
  // パターン一覧を取得
  const patterns = await getSearchPatterns();

  // 検索フォームのデフォルト値を取得
  const searchFormDefaults = await getSearchFormDefaults();

  return (
    <div id="search-results-execute">
      <SearchLayout
        patterns={patterns}
        searchFormDefaults={searchFormDefaults}
      />
    </div>
  );
}
