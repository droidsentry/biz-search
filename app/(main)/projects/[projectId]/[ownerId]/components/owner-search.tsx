"use client";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import SearchForm from "./serpapi-forms/SearchForm";
import SearchResults from "./serpapi-forms/SearchResults";
import { SearchSidebar } from "./search-sidebar";
import type { SerpapiResponse } from "@/lib/types/serpapi";
import type { SearchFormData, SearchParams } from "@/lib/schemas/serpapi";
import { useSearchParams } from "next/navigation";
import { searchWithParams } from "./action-serpapi-form";

interface OwnerSearchProps {
  initialQuery: string;
  initialAddress?: string;
  projectId: string;
  ownerId: string;
  searchFormDefaults: SearchFormData;
}

export function OwnerSearch({
  initialQuery,
  initialAddress,
  projectId,
  ownerId,
  searchFormDefaults,
}: OwnerSearchProps) {
  const [searchData, setSearchData] = useState<SerpapiResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchParams = useSearchParams();

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

  // console.log("searchData", searchData);

  return (
    <div id="search-results" className="space-y-6 w-full">
      <h3 className="text-lg font-semibold">Web検索</h3>

      <div className={searchData ? "flex gap-4" : "flex justify-center w-full"}>
        {searchData && (
          <div className="flex-1 sticky top-10">
            <SearchResults
              data={searchData}
              isSearching={isSearching}
              error={error}
            />
          </div>
        )}
        {/* サイドバー */}
        <SearchSidebar className={cn("z-40")}>
          <div className="space-y-4 ">
            <SearchForm
              projectId={projectId}
              ownerId={ownerId}
              initialOwnerName={initialQuery}
              initialOwnerAddress={initialAddress}
              isSearching={isSearching}
              searchFormDefaults={searchFormDefaults}
            />

            <Separator />

            {/* 保存されたパターン */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">保存された検索パターン</h3>
              </div>
              {/* パターンカードは後で実装 */}
            </div>
          </div>
        </SearchSidebar>
      </div>
    </div>
  );
}
