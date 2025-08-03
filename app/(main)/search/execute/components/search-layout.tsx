"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SearchFormData, SearchParams } from "@/lib/schemas/serpapi";
import { SearchPattern, SerpapiResponse } from "@/lib/types/serpapi";
import { cn } from "@/lib/utils";

import { searchWithParams } from "../action-serpapi-form";

import { PatternCards } from "./pattern-cards";
import { SearchSidebar } from "./search-sidebar";
import SearchForm from "./serpapi-forms/SearchForm";
import SearchResults from "./serpapi-forms/SearchResults";

interface SearchLayoutProps {
  patterns: SearchPattern[];
  searchFormDefaults: SearchFormData;
}

export function SearchLayout({
  patterns: initialPatterns,
  searchFormDefaults,
}: SearchLayoutProps) {
  // const { isNewSearch, data, patternId } = useGoogleCustomSearchForm();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patterns, setPatterns] = useState<SearchPattern[]>(initialPatterns);
  const searchParams = useSearchParams();
  const [searchData, setSearchData] = useState<SerpapiResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPattern, setCurrentPattern] = useState<SearchPattern>();

  // URLパラメータが変更されたら検索を実行
  useEffect(() => {
    const performSearch = async () => {
      // URLパラメータから検索パラメータを構築
      const hasSearchParams =
        searchParams.get("ownerName") ||
        searchParams.get("ownerAddress") ||
        searchParams.get("additionalKeywords[0][value]");

      if (!hasSearchParams) {
        setSearchData(null);
        setError(null);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        // URLパラメータからSearchParamsオブジェクトを構築
        const searchFormData = {
          ownerName: searchParams.get("ownerName") || "",
          ownerNameMatchType:
            (searchParams.get("ownerNameMatchType") as "exact" | "partial") ||
            "partial",
          ownerAddress: searchParams.get("ownerAddress") || "",
          ownerAddressMatchType:
            (searchParams.get("ownerAddressMatchType") as
              | "exact"
              | "partial") || "partial",
          additionalKeywords: [] as {
            value: string;
            matchType: "exact" | "partial";
          }[],
          searchSites: [] as string[],
          siteSearchMode:
            (searchParams.get("siteSearchMode") as
              | "any"
              | "specific"
              | "exclude") || "any",
          isAdvancedSearchEnabled:
            searchParams.get("isAdvancedSearchEnabled") === "true",
          period:
            (searchParams.get("period") as
              | "all"
              | "last_6_months"
              | "last_year"
              | "last_3_years"
              | "last_5_years"
              | "last_10_years") || "all",
        };

        // additionalKeywordsの復元
        let index = 0;
        while (searchParams.get(`additionalKeywords[${index}][value]`)) {
          const value = searchParams.get(
            `additionalKeywords[${index}][value]`
          ) as string;
          const matchType =
            (searchParams.get(`additionalKeywords[${index}][matchType]`) as
              | "exact"
              | "partial") || "partial";
          searchFormData.additionalKeywords.push({ value, matchType });
          index++;
        }

        // searchSitesの復元
        let siteIndex = 0;
        while (searchParams.get(`searchSites[${siteIndex}]`)) {
          searchFormData.searchSites.push(
            searchParams.get(`searchSites[${siteIndex}]`) as string
          );
          siteIndex++;
        }

        // ページ番号の取得
        const page = searchParams.get("page")
          ? parseInt(searchParams.get("page") as string, 10)
          : 1;

        // 検索パラメータの構築
        const searchParameters: SearchParams = {
          searchForm: searchFormData,
          page,
        };

        // 検索を実行
        const result = await searchWithParams(searchParameters);

        setSearchData(result);
      } catch (err) {
        console.error("Search error:", err);
        setError(err as Error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [searchParams]);

  if (!searchData) {
    return (
      <div className="h-full mx-auto max-w-[1400px] px-2 md:px-4 flex items-center justify-center mb-8">
        <div className="w-full max-w-2xl">
          <div className="text-center my-8">
            <h1 className="text-3xl font-bold mb-2">
              {currentPattern
                ? `検索パターン: ${currentPattern?.searchPatternName}`
                : "新規検索"}
            </h1>
          </div>
          <Card>
            <CardContent className="p-6">
              {/* <CompactSearchForm onSave={() => setShowSaveModal(true)} /> */}
              <SearchForm
                searchData={searchData}
                searchFormDefaults={searchFormDefaults}
                isSearching={isSearching}
                currentPattern={currentPattern}
                setCurrentPattern={setCurrentPattern}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full mx-auto max-w-[1400px] px-2 md:px-4 min-h-0 ">
      <div className="flex h-full gap-4 my-10">
        {/* メインコンテンツエリア */}
        <main className="h-full flex-1">
          <SearchResults
            data={searchData}
            isSearching={isSearching}
            error={error}
          />
        </main>
        {/* サイドバー */}
        <SearchSidebar
          className={cn(
            "z-40",
            sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          )}
        >
          {/* 検索フォーム */}
          <div className="space-y-4 ">
            <SearchForm
              searchData={searchData}
              searchFormDefaults={searchFormDefaults}
              isSearching={isSearching}
              setPatterns={setPatterns}
              currentPattern={currentPattern}
              setCurrentPattern={setCurrentPattern}
            />
          </div>

          <Separator />

          {/* 保存されたパターン */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">保存された検索パターン</h3>
            </div>
            <PatternCards
              patterns={patterns}
              patternId={currentPattern?.id || ""}
              setPatterns={setPatterns}
              setCurrentPattern={setCurrentPattern}
            />
          </div>
        </SearchSidebar>
      </div>
    </div>
  );
}
