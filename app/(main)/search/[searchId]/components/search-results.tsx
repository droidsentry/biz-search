"use client";

import { useGoogleCustomSearchForm } from "@/components/providers/google-custom-search-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { cn } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function SearchResults() {
  const { data, isLoading , error} = useGoogleCustomSearchForm();


  const searchParams = useSearchParams();
  // URLパラメータからstart値を取得（デフォルト1）
  const currentStart = parseInt(searchParams.get("start") || "1", 10);
  // URL更新
  const pathname = usePathname();
  const router = useRouter();
  const updateURL = useCallback(
    (newParams: URLSearchParams) => {
      const newURL = `${pathname}?${newParams.toString()}`;
      router.push(newURL);
    },
    [pathname, router]
  );
  // ページネーション用のハンドラー
  const handlePageChange = useCallback(
    (newStart: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("start", newStart.toString());
      updateURL(newParams);
    },
    [searchParams, updateURL]
  );

   // ページネーション情報の計算
  const resultsPerPage = 10;
  const currentPage = Math.ceil(currentStart / resultsPerPage);
  const totalResults = data?.searchInformation?.totalResults
    ? parseInt(data.searchInformation.totalResults)
    : 0;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  // Google Custom Search APIの制限について：
  // - 最大100件の結果まで取得可能（start=91, num=10が最後のページ）
  // - start=101以降は「Request contains an invalid argument」エラーが発生
  // - 実際のテストでもstart=101でエラーが確認されている
  const maxPages = Math.min(totalPages, 10); // 10ページまでに制限

  // ページネーションのページ番号を生成
  const getPageNumbers = () => {
    const pages: number[] = [];
    // モバイルでは表示ページ数を減らす
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const range = isMobile ? 1 : 2;
    const startPage = Math.max(1, currentPage - range);
    const endPage = Math.min(maxPages, currentPage + range);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newStart = (currentPage - 2) * resultsPerPage + 1;
      handlePageChange(newStart);
    }
  };

  const handleNextPage = () => {
    if (currentPage < maxPages) {
      const newStart = currentPage * resultsPerPage + 1;
      handlePageChange(newStart);
    }
  };

  const handlePageClick = (page: number) => {
    const newStart = (page - 1) * resultsPerPage + 1;
    handlePageChange(newStart);
  };

  const handlePaginationClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  // API制限に関するチェック
  const isNearApiLimit = currentStart > 80; // 8ページ目以降で警告
  const isPastApiLimit = currentStart > 100; // 10ページ目以降（実際にはエラーになる）

  if (!data) return null;

  return (
    <div className="w-full ">
      <div className="sticky top-10 pb-4 sm:pb-6 -mt-8 pt-8 z-10 bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">
              検索結果
              <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                ({data?.searchInformation?.formattedTotalResults} 件)
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              検索項目：{data?.queries?.request?.[0].searchTerms}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              除外項目：{data?.queries?.request?.[0].excludeTerms}
            </p>
          </div>

        </div>
      </div>
      {/* <div className="sticky top-10 pb-4 sm:pb-6 -mt-8 pt-8 z-10 bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">
              検索結果
              <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                ({data?.searchInformation?.formattedTotalResults} 件)
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              検索項目：{data?.queries?.request?.[0].searchTerms}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              除外項目：{data?.queries?.request?.[0].excludeTerms}
            </p>
          </div>

        </div>
      </div> */}

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-sm">⚠️</span>
            <div>
              <p className="text-sm font-medium">検索でエラーが発生しました</p>
              <p className="text-xs text-red-600 mt-1">
                {isPastApiLimit
                  ? "Google Custom Search APIの制限により、これ以上の結果を取得できません。検索条件を絞り込んでください。"
                  : error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API制限警告 */}
      {isNearApiLimit && !error && (
        <div className="mb-4 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-700">
            <span className="text-sm">💡</span>
            <p className="text-sm">
              Google Custom Search
              APIの制限に近づいています。10ページ目以降は結果を取得できません。
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items?.map((item, index) => {
            const image: string | undefined =
              item.pagemap?.cse_image?.[0]?.src ||
              item.pagemap?.cse_thumbnail?.[0]?.src ||
              item.pagemap?.metatags?.[0]?.["og:image"];
            return (
              item.link && (
                <Card
                  key={index}
                  className={cn(
                    "transition-all hover:shadow-md",
                    "hover:border-muted-foreground/30",
                    "relative !bg-muted/50 "
                  )}
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Link
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 sm:gap-4 "
                        >
                          <h3 className="text-base sm:text-lg font-medium hover:underline inline-flex items-center gap-1">
                            {item.title}
                            <span className="absolute inset-0 " />
                          </h3>
                          <ExternalLink className="size-3 flex-shrink-0" />
                        </Link>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/80">
                        {item.displayLink || item.link}
                      </p>
                      <div
                        className={cn(
                          "prose prose-sm max-w-none",
                          "dark:prose-invert",
                          "line-clamp-2 sm:line-clamp-3",
                          "text-xs sm:text-sm"
                        )}
                        dangerouslySetInnerHTML={{
                          __html: item.htmlSnippet || item.snippet || "",
                        }}
                      />
                    </div>

                    {/* {image && (
                      <img
                        src={image}
                        alt={item.title || "Search result image"}
                        className="aspect-video object-cover rounded-md w-full sm:w-24 sm:h-16 md:w-32 md:h-20 lg:w-40 lg:h-28 border-muted-foreground/20 border flex-shrink-0 order-first sm:order-last"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )} */}
                  </CardContent>
                </Card>
              )
            );
          })}
        </div>
      )}

      {/* ページネーション機能 */}
      {!isLoading && data?.items && data.items.length > 0 && maxPages > 1 && (
        <div className="mt-8 space-y-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => handlePaginationClick(e, handlePreviousPage)}
                  className={cn(
                    "cursor-pointer",
                    currentPage <= 1 && "opacity-50 cursor-not-allowed"
                  )}
                  aria-disabled={currentPage <= 1}
                />
              </PaginationItem>

              {getPageNumbers().map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) =>
                      handlePaginationClick(e, () => handlePageClick(page))
                    }
                    isActive={page === currentPage}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {currentPage < maxPages - 2 && (
                <PaginationItem className="hidden sm:block">
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => handlePaginationClick(e, handleNextPage)}
                  className={cn(
                    "cursor-pointer",
                    currentPage >= maxPages && "opacity-50 cursor-not-allowed"
                  )}
                  aria-disabled={currentPage >= maxPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Google Custom Search APIの制限に関する説明 */}
          {currentPage >= maxPages && totalResults > 100 && (
            <div className="text-center text-sm text-muted-foreground">
              <p>
                💡 Google Custom Search
                APIの制限により、最大100件（10ページ）までの結果を表示しています。
                <br />
                より多くの結果を確認するには、検索条件を絞り込んでください。
              </p>
            </div>
          )}

          {/* 結果数の表示 */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              {currentStart}件目～
              {Math.min(currentStart + resultsPerPage - 1, totalResults)}件目
              （全{data?.searchInformation?.formattedTotalResults}件中）
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
