"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tables } from "@/lib/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { searchFormSchema } from "@/lib/schemas/serpapi";
import { useSearchPattern } from "@/lib/contexts/search-pattern-context";

type SearchPattern = Tables<"search_patterns"> & {
  parsedParams?: ReturnType<typeof searchFormSchema.parse>;
};


interface SearchPatternListProps {
  patterns: SearchPattern[];
}

export default function SearchPatternList({
  patterns,
}: SearchPatternListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentPattern } = useSearchPattern();

  const handlePatternClick = (e: React.MouseEvent, pattern: SearchPattern) => {
    e.preventDefault();
    const params = new URLSearchParams();

    // パターンのパラメータをパース
    const parsedParams = searchFormSchema.parse(pattern.google_custom_search_params);

    // 既存の所有者名と住所のパラメータを保持
    if (searchParams.get("ownerName")) {
      params.set("ownerName", searchParams.get("ownerName")!);
      params.set(
        "ownerNameMatchType",
        searchParams.get("ownerNameMatchType") || "partial"
      );
    }
    if (searchParams.get("ownerAddress")) {
      params.set("ownerAddress", searchParams.get("ownerAddress")!);
      params.set(
        "ownerAddressMatchType",
        searchParams.get("ownerAddressMatchType") || "partial"
      );
    }

    // 追加キーワードを配列形式で設定
    parsedParams.additionalKeywords.forEach(
      (keyword, index) => {
        params.set(`additionalKeywords[${index}][value]`, keyword.value);
        params.set(
          `additionalKeywords[${index}][matchType]`,
          keyword.matchType
        );
      }
    );

    // 検索対象サイトを配列形式で設定
    parsedParams.searchSites.forEach((site, index) => {
      params.set(`searchSites[${index}]`, site);
    });

    params.set(
      "siteSearchMode",
      parsedParams.siteSearchMode
    );
    params.set("period", parsedParams.period);
    params.set(
      "isAdvancedSearchEnabled",
      parsedParams.isAdvancedSearchEnabled.toString()
    );

    const newUrl = `/search/execute?${params.toString()}`;
    router.push(newUrl);
    
    // パターンをContextに設定（データベース形式からキャメルケース形式に変換）
    const formattedPattern = {
      id: pattern.id,
      searchPatternName: pattern.name,
      searchPatternDescription: pattern.description,
      googleCustomSearchParams: parsedParams,
      usageCount: pattern.usage_count,
      createdAt: pattern.created_at,
      updatedAt: pattern.updated_at,
      lastUsedAt: pattern.last_used_at,
    };
    setCurrentPattern(formattedPattern);
  };

  if (patterns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">検索パターンがまだありません</p>
        <Link href="/search/execute">
          <Button className="mt-4">最初の検索を開始</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {patterns.map((pattern) => (
        <Card 
          key={pattern.id} 
          className="h-full hover:shadow-lg transition-shadow cursor-pointer"
          onClick={(e) => handlePatternClick(e, pattern)}
        >
          <CardHeader>
            <CardTitle className="text-lg">{pattern.name}</CardTitle>
            {pattern.description && (
              <CardDescription>{pattern.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>{pattern.usage_count}回使用</span>
              </div>
              {pattern.last_used_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(pattern.last_used_at), "M/d HH:mm", {
                      locale: ja,
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
