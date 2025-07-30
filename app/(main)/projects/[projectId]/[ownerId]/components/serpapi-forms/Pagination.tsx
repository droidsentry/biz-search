"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

import type { SerpapiResponse } from "@/lib/types/serpapi";

interface PaginationProps {
  data: SerpapiResponse;
  isSearching: boolean;
}

export default function Pagination({ data, isSearching }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [clickedPage, setClickedPage] = useState<number | null>(null);

  // デバッグ用のログ
  useEffect(() => {
    if (data?.pagination) {
      console.log("Pagination data:", {
        current: data.pagination.current,
        other_pages: data.pagination.other_pages,
        total_results: data.search_information?.total_results,
      });
    }
  }, [data]);

  // データがない場合は表示しない
  if (!data || !data.organic_results || data.organic_results.length === 0) {
    return null;
  }

  // 総数が10件以下の場合は表示しない
  const totalResults = data.search_information?.total_results || 0;
  if (totalResults <= 10) {
    return null;
  }

  // データから必要な値を抽出
  const currentPage = data.pagination?.current || 1;
  const otherPages = data.pagination?.other_pages || {};

  // プロジェクトIDとオーナーIDをパスから取得
  const pathSegments = pathname.split("/");
  const projectId = pathSegments[2];
  const ownerId = pathSegments[3];

  const handlePageChange = (newPage: number) => {
    setClickedPage(newPage);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      router.push(`/projects/${projectId}/${ownerId}?${params.toString()}`, {
        scroll: false,
      });

      // ページ遷移後に検索結果の上部にスクロール
      setTimeout(() => {
        const searchResultsElement = document.getElementById("search-results");
        if (searchResultsElement) {
          searchResultsElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    });
  };

  // ページ番号の配列を作成（現在のページを含む）
  const pageNumbers: number[] = [currentPage];

  // other_pagesからページ番号を追加
  Object.keys(otherPages).forEach((pageStr) => {
    const pageNum = parseInt(pageStr);
    if (!isNaN(pageNum) && !pageNumbers.includes(pageNum)) {
      pageNumbers.push(pageNum);
    }
  });

  // ページ番号をソート
  pageNumbers.sort((a, b) => a - b);

  // ページネーションが必要ない場合（ページが1つのみ）
  if (pageNumbers.length <= 1) {
    return null;
  }

  // 表示するページ番号を決定（最大10個）
  const maxPagesToShow = 10;
  let pagesToShow: number[] = [];

  if (pageNumbers.length <= maxPagesToShow) {
    pagesToShow = pageNumbers;
  } else {
    // 現在のページの前後を優先的に表示
    const currentIndex = pageNumbers.indexOf(currentPage);
    const startIndex = Math.max(
      0,
      currentIndex - Math.floor(maxPagesToShow / 2)
    );
    const endIndex = Math.min(pageNumbers.length, startIndex + maxPagesToShow);

    pagesToShow = pageNumbers.slice(startIndex, endIndex);
  }

  return (
    <div className="mt-8 flex items-center justify-center">
      <div className="flex items-center gap-1">
        {/* 最初のページへのリンク（表示されていない場合） */}
        {pagesToShow[0] > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={isSearching || isPending}
              className="h-8 w-8 p-0"
            >
              {isPending && clickedPage === 1 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "1"
              )}
            </Button>
            {pagesToShow[0] > 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </>
        )}

        {/* ページ番号ボタン */}
        {pagesToShow.map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePageChange(pageNum)}
            disabled={currentPage === pageNum || isSearching || isPending}
            className="h-8 w-8 p-0 cursor-pointer"
          >
            {isPending && clickedPage === pageNum ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              pageNum
            )}
          </Button>
        ))}

        {/* 最後のページへのリンク（表示されていない場合） */}
        {pagesToShow[pagesToShow.length - 1] <
          pageNumbers[pageNumbers.length - 1] && (
          <>
            {pagesToShow[pagesToShow.length - 1] <
              pageNumbers[pageNumbers.length - 1] - 1 && (
              <span className="px-2 text-muted-foreground ">...</span>
            )}
            <Button
              variant={
                currentPage === pageNumbers[pageNumbers.length - 1]
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() =>
                handlePageChange(pageNumbers[pageNumbers.length - 1])
              }
              disabled={isSearching || isPending}
              className="h-8 w-8 p-0 cursor-pointer"
            >
              {isPending &&
              clickedPage === pageNumbers[pageNumbers.length - 1] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                pageNumbers[pageNumbers.length - 1]
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
