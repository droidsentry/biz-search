import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import SearchPatternList from "./list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          <Link href="/search/execute?patternId=new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規検索
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="recent" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            最近使用した順
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            使用回数順
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Suspense fallback={<PatternListSkeleton />}>
            <SearchPatternList sortBy="recent" />
          </Suspense>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Suspense fallback={<PatternListSkeleton />}>
            <SearchPatternList sortBy="usage" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
