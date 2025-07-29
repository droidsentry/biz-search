"use client";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import SearchForm from "./forms/SearchForm";
import SearchResults from "./forms/SearchResults";
import { SearchSidebar } from "./search-sidebar";
import { searchWithParams } from "../action-form";
import type { SerpstackResponse } from "@/lib/types/serpstack";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface OwnerSearchProps {
  initialQuery: string;
  initialAddress?: string;
  projectId: string;
  ownerId: string;
}

export function OwnerSearch({
  initialQuery,
  initialAddress,
  projectId,
  ownerId,
}: OwnerSearchProps) {
  const [searchData, setSearchData] = useState<SerpstackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URLパラメータから検索を実行
  const performSearch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string | string[] | undefined> = {};
      searchParams.forEach((value, key) => {
        if (params[key]) {
          // 既に値がある場合は配列にする
          if (Array.isArray(params[key])) {
            (params[key] as string[]).push(value);
          } else {
            params[key] = [params[key] as string, value];
          }
        } else {
          params[key] = value;
        }
      });
      
      const result = await searchWithParams(params);
      setSearchData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // URLパラメータが変更されたら検索を実行
  useEffect(() => {
    const hasSearchParams = searchParams.has('ownerName') || 
                          searchParams.has('ownerAddress') || 
                          searchParams.has('additionalKeywords[0][value]');
    
    if (hasSearchParams) {
      performSearch();
    }
  }, [searchParams]);

  // 検索開始を早めに通知するためのコールバック
  const handleSearchStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  return (
    <div className="space-y-6 w-full">
      <h3 className="text-lg font-semibold">Web検索</h3>

      <div
        className={
          searchData
            ? "flex gap-4"
            : "flex justify-center w-full"
        }
      >
        {searchData && (
          <div className="flex-1 sticky top-10">
            <SearchResults 
              data={searchData}
              isLoading={isLoading}
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
              isSearching={isLoading}
              onSearchStart={handleSearchStart}
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
