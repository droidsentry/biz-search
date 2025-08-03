import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import SearchPatternList from "./list";
import { Skeleton } from "@/components/ui/skeleton";

// ローディングコンポーネント
function PatternListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-[140px] rounded-lg">
          <Skeleton className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "検索パターン - BizSearch",
  description:
    "よく使用する検索条件をパターンとして保存・管理できます。保存したパターンを使って効率的にビジネス情報を検索します。",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4">
      <div className="border-0 border-b border-solid mb-8">
        <div className="flex items-center justify-between my-10">
          <div>
            <h1 className="text-3xl font-bold">カスタム検索</h1>
            <p className="text-muted-foreground mt-2">
              保存した検索パターンで効率的に情報を収集
            </p>
          </div>
          <Link href="/search/execute">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規検索
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<PatternListSkeleton />}>
        <SearchPatternList sortBy="recent" />
      </Suspense>
    </div>
  );
}
