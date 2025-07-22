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
import { Plus } from "lucide-react";
import Link from "next/link";
import { SearchPatternFormModal } from "./search-pattern-form-modal";
import { useState, useEffect } from "react";
import { MobileSidebarToggle } from "./mobile-sidebar-toggle";
import { cn } from "@/lib/utils";

type SearchPattern = Tables<"search_patterns">;

interface SearchLayoutProps {
  patterns: SearchPattern[];
  searchId: string;
}

export function SearchLayout({
  patterns: initialPatterns,
  searchId,
}: SearchLayoutProps) {
  const { isNewSearch, data, mode } = useGoogleCustomSearchForm();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patterns, setPatterns] = useState(initialPatterns);
  const [currentSearchId, setCurrentSearchId] = useState(searchId);

  // 新規検索で、まだ検索を実行していない場合は、フルスクリーンフォームを表示
  if (isNewSearch && !data) {
    return (
      <div className="h-full mx-auto max-w-[1400px] px-2 md:px-4 flex items-center justify-center mb-8">
        <div className="w-full max-w-2xl">
          <div className="text-center my-8">
            <h1 className="text-3xl font-bold mb-2">新規検索</h1>
            <p className="text-muted-foreground">
              検索条件を入力して、ビジネス情報を検索します
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <CompactSearchForm
                searchId={currentSearchId}
                onSave={() => setShowSaveModal(true)}
              />
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
            <CompactSearchForm
              searchId={currentSearchId}
              onSave={() => setShowSaveModal(true)}
            />
          </div>

          <Separator />

          {/* 保存されたパターン */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">保存された検索パターン</h3>
              {!isNewSearch && (
                <Link href="/search/new">
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
            <PatternCards
              patterns={patterns}
              currentPatternId={currentSearchId}
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
            // URLをhistory APIで静かに更新（リロードなし）
            window.history.replaceState({}, "", `/search/${newPatternId}`);
            setCurrentSearchId(newPatternId);

            // 新しいパターンを即座にリストに追加
            if (patternData) {
              setPatterns((prev) => [...prev, patternData]);
            }
          }}
        />
      </div>
    </div>
  );
}
