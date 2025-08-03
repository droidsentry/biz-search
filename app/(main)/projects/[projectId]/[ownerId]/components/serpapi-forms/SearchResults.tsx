import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SerpapiResponse } from "@/lib/types/serpapi";
import { cn } from "@/lib/utils";
import {
  formatPeriodFilter,
  parseSearchQuery,
} from "@/lib/utils/search-query-parser";
import { ExternalLink, Search } from "lucide-react";
import Pagination from "./Pagination";
import Link from "next/link";

interface SearchResultsProps {
  data: SerpapiResponse | null;
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
  const totalResults = data.search_information?.total_results;
  const currentPage = data.pagination?.current || 1;
  const timeTaken = data.search_metadata?.total_time_taken;

  // 検索パラメータの解析
  const searchQuery =
    data.search_parameters?.q || data.search_information?.query_displayed;
  const parsedQuery = parseSearchQuery(searchQuery);
  // search_parametersをany型として扱い、tbsプロパティにアクセス
  const searchParams = data.search_parameters as Record<
    string,
    string | undefined
  >;
  const period = formatPeriodFilter(searchParams?.tbs);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">
          <span>
            検索結果{" "}
            {totalResults ? `約${totalResults.toLocaleString()}件` : ""}
            {timeTaken !== undefined && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({timeTaken}秒)
              </span>
            )}
          </span>
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
          {/* 検索パラメータの表示（控えめに） */}
          {searchQuery && (
            <div className="mb-4 px-3 py-2 text-xs text-foreground/90 bg-muted/20 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3" />
                <span>検索クエリ:</span>
                <code className="bg-muted/50 px-1.5 py-0.5 rounded">
                  {searchQuery}
                </code>
              </div>

              {(parsedQuery.exactMatches.length > 0 ||
                parsedQuery.keywords.length > 0 ||
                parsedQuery.siteFilters.include.length > 0 ||
                parsedQuery.siteFilters.exclude.length > 0 ||
                period) && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {parsedQuery.exactMatches.length > 0 && (
                    <>
                      <span className="text-foreground/90">完全一致:</span>
                      {parsedQuery.exactMatches.map((match, index) => (
                        <span key={index} className="text-foreground/90">
                          &quot;{match}&quot;
                        </span>
                      ))}
                    </>
                  )}

                  {parsedQuery.keywords.length > 0 && (
                    <>
                      {parsedQuery.exactMatches.length > 0 && (
                        <span className="text-muted-foreground/50">•</span>
                      )}
                      <span className="text-foreground/90">キーワード:</span>
                      {parsedQuery.keywords.map((keyword, index) => (
                        <span key={index} className="text-foreground/90">
                          {keyword}
                        </span>
                      ))}
                    </>
                  )}

                  {parsedQuery.siteFilters.include.length > 0 && (
                    <>
                      {(parsedQuery.exactMatches.length > 0 ||
                        parsedQuery.keywords.length > 0) && (
                        <span className="text-muted-foreground/50">•</span>
                      )}
                      <span className="text-foreground/90">サイト:</span>
                      <span className="text-muted-foreground/90">
                        {parsedQuery.siteFilters.include.join(", ")}
                      </span>
                    </>
                  )}

                  {parsedQuery.siteFilters.exclude.length > 0 && (
                    <>
                      {(parsedQuery.exactMatches.length > 0 ||
                        parsedQuery.keywords.length > 0 ||
                        parsedQuery.siteFilters.include.length > 0) && (
                        <span className="text-foreground/90">•</span>
                      )}
                      <span className="text-foreground/90">除外:</span>
                      <span className="text-foreground/90">
                        {parsedQuery.siteFilters.exclude.join(", ")}
                      </span>
                    </>
                  )}

                  {period && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-foreground/90">期間:</span>
                      <span className="text-foreground/90">{period}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {results.map((result, index) => (
            <Card
              key={`${result.link}-${index}`}
              className={cn(
                "hover:shadow-md transition-shadow duration-200 border-border min-h-[164px]",
                `
              bg-muted/20
              `
              )}
            >
              <CardContent className="p-6 py-1">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-medium line-clamp-2 flex-1">
                      <Link
                        href={result.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors hover:underline"
                      >
                        {result.title}
                      </Link>
                    </h3>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate max-w-md">
                      {result.displayed_link || new URL(result.link).hostname}
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
