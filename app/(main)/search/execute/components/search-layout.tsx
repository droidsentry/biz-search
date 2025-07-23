"use client";

import { SearchSidebar } from "./search-sidebar";
import { CompactSearchForm } from "./compact-search-form";
import { PatternCards } from "./pattern-cards";
import { SearchResults } from "./search-results";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/lib/types/database";
import { useGoogleCustomSearchForm } from "@/components/providers/google-custom-search-form";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { SearchPatternFormModal } from "./search-pattern-form-modal";
import { useState, useEffect } from "react";
import { MobileSidebarToggle } from "./mobile-sidebar-toggle";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchPattern } from "@/lib/types/custom-search";

interface SearchLayoutProps {
  patterns: SearchPattern[];
}

export function SearchLayout({ patterns: initialPatterns }: SearchLayoutProps) {
  const { isNewSearch, data, patternId } = useGoogleCustomSearchForm();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patterns, setPatterns] = useState(initialPatterns);
  // const [currentSearchId, setCurrentSearchId] = useState(patternId);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentPattern = patterns.find((pattern) => pattern.id === patternId);

  if (!data) {
    return (
      <div className="h-full mx-auto max-w-[1400px] px-2 md:px-4 flex items-center justify-center mb-8">
        <div className="w-full max-w-2xl">
          <div className="text-center my-8">
            <h1 className="text-3xl font-bold mb-2">
              {isNewSearch
                ? "新規検索"
                : `検索パターン: ${currentPattern?.searchPatternName}`}
            </h1>
            <p className="text-muted-foreground">
              {isNewSearch
                ? "検索条件を入力して、ビジネス情報を検索します"
                : currentPattern?.searchPatternDescription}
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <CompactSearchForm onSave={() => setShowSaveModal(true)} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full mx-auto max-w-[1400px] px-2 md:px-4 min-h-0 ">
      <div className="flex h-full gap-4">
        {/* メインコンテンツエリア */}
        <main className="h-full flex-1">
          <SearchResults />
        </main>

        {/* モバイルトグル */}
        <MobileSidebarToggle onToggle={setSidebarOpen} />

        {/* サイドバー */}
        <SearchSidebar
          className={cn(
            "z-40",
            sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          )}
        >
          {/* 検索フォーム */}
          <div className="space-y-4 ">
            <CompactSearchForm onSave={() => setShowSaveModal(true)} />
          </div>

          <Separator />

          {/* 保存されたパターン */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">保存された検索パターン</h3>
            </div>
            <PatternCards
              patterns={patterns}
              // currentPatternId={currentSearchId}
            />
          </div>
        </SearchSidebar>

        {/* 保存モーダル */}
        <SearchPatternFormModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          mode="create"
          projectId="default"
          onSaveSuccess={(newPatternId, patternData) => {
            // // URLをhistory APIで静かに更新（リロードなし）
            // window.history.replaceState({}, "", `/search/${newPatternId}`);
            // setCurrentSearchId(newPatternId);
            // router.push(`/search/${newPatternId}`);
            // URLからstartパラメータを削除してページを更新
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("start");
            newParams.set("patternId", newPatternId);
            const newUrl = `${pathname}${
              newParams.toString() ? `?${newParams.toString()}` : ""
            }`;
            // パターンIDを更新
            router.replace(newUrl);

            // // 新しいパターンを即座にリストに追加
            // if (patternData) {
            //   setPatterns((prev) => [...prev, patternData]);
            // }
          }}
        />
      </div>
    </div>
  );
}
