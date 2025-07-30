import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SerpstackResponse } from "@/lib/types/serpstack";
import Pagination from "./Pagination";
import { ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  data: SerpstackResponse | null;
  isSearching: boolean;
  error?: Error | null;
}

export default function SearchResults({
  data,
  isSearching,
  error,
}: SearchResultsProps) {
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">
          エラーが発生しました: {error.message}
        </p>
      </div>
    );
  }

  if (!data || !data.organic_results || data.organic_results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">検索結果が見つかりませんでした</p>
      </div>
    );
  }

  const results = data.organic_results;
  const totalResults = Number(data.search_information?.total_results);
  const currentPage = Number(data.search_parameters?.page) || 1;

  // paginationのpagesから最大ページ番号を取得して件数を推定
  const maxPageNumber =
    data.pagination?.pages?.reduce(
      (max, page) => Math.max(max, page.page),
      0
    ) || 0;

  const estimatedResultsCount =
    maxPageNumber >= 9
      ? `約${maxPageNumber * 10}件以上` // 9ページ以上は「以上」表記
      : maxPageNumber > 0
      ? `約${(maxPageNumber + 1) * 10}件`
      : currentPage > 1
      ? `約${currentPage * 10}件以上`
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">
          {totalResults ? (
            <span>検索結果 約{totalResults.toLocaleString()}件</span>
          ) : estimatedResultsCount ? (
            <span>検索結果 {estimatedResultsCount}</span>
          ) : (
            <span>検索結果 {results.length}件</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {currentPage > 1 && (
            <Badge variant="outline" className="text-sm">
              ページ {currentPage}
            </Badge>
          )}
          <Badge variant="secondary" className="text-sm">
            {results.length}件表示
          </Badge>
        </div>
      </div>
      {!isSearching ? (
        <div
          className={cn(
            "space-y-2",
            `
        
        `
          )}
        >
          {results.map((result, index) => (
            <Card
              key={`${result.url}-${index}`}
              className={cn(
                "hover:shadow-md transition-shadow duration-200 border-border min-h-[164px]",
                `
              
              `
              )}
            >
              <CardContent className="p-6 py-1">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-medium line-clamp-2 flex-1">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {result.title}
                      </a>
                    </h3>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate max-w-md">
                      {result.displayed_url || new URL(result.url).hostname}
                    </span>
                  </div>

                  {result.snippet && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {result.snippet}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Card key={i} className="animate-pulse min-h-[164px]">
              <CardContent className="p-6 py-1">
                <div className="space-y-2">
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
      )}

      {/* ページネーション */}
      <Pagination data={data} isSearching={isSearching} />
    </div>
  );
}
